import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CategoryDef, Currency, LedgerData, NewTxnInput, Txn } from "../types";
import { DUMMY } from "../lib/dummyData";
import { BUILT_IN_CATEGORIES, DEFAULT_FALLBACK } from "../lib/categories";
import { formatTxnTime } from "../lib/format";
import { fetchLivePrices, type PriceFetchResult } from "../lib/priceApi";

export type PriceStatus = "idle" | "loading" | "ok" | "error";

interface PriceMeta {
  status: PriceStatus;
  error: string | null;
  updatedAt: number | null;
  // 세 시세 필드 각각이 한 번이라도 실제 API로부터 갱신된 적이 있는지
  liveFields: { btcKRW: boolean; btcUSD: boolean; usdKRW: boolean };
}

const CATEGORIES_STORAGE_KEY = "myledger.categories.v1";
const TXNS_STORAGE_KEY = "myledger.txns.v1";
const PENDING_UNDO_STORAGE_KEY = "myledger.pendingUndo.v1";
const UNDO_WINDOW_MS = 5000;

function loadCategories(): CategoryDef[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // 손상된 데이터 등은 무시하고 기본값으로 폴백
  }
  return BUILT_IN_CATEGORIES;
}

function saveCategories(categories: CategoryDef[]) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // 프라이빗 모드 등으로 저장이 안 되어도 인메모리 상태로는 계속 동작
  }
}

interface PersistedTxnsState {
  balance: number;
  income: number;
  expense: number;
  txns: Txn[];
}

function loadTxnsState(): PersistedTxnsState | null {
  try {
    const raw = localStorage.getItem(TXNS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.balance === "number" &&
      typeof parsed.income === "number" &&
      typeof parsed.expense === "number" &&
      Array.isArray(parsed.txns)
    ) {
      return parsed;
    }
  } catch {
    // 손상된 데이터는 무시하고 더미로 폴백
  }
  return null;
}

function saveTxnsState(s: PersistedTxnsState) {
  try {
    localStorage.setItem(TXNS_STORAGE_KEY, JSON.stringify(s));
  } catch {
    // 프라이빗 모드 등으로 저장이 안 되어도 인메모리 상태로는 계속 동작
  }
}

interface PersistedUndoState {
  txn: Txn;
  index: number;
  expiresAt: number;
}

function loadPendingUndo(): PendingUndo | null {
  try {
    const raw = localStorage.getItem(PENDING_UNDO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.index === "number" &&
      typeof parsed.expiresAt === "number" &&
      parsed.txn &&
      typeof parsed.txn.id === "number" &&
      Date.now() < parsed.expiresAt
    ) {
      return parsed;
    }
    localStorage.removeItem(PENDING_UNDO_STORAGE_KEY);
  } catch {
    localStorage.removeItem(PENDING_UNDO_STORAGE_KEY);
  }
  return null;
}

function savePendingUndo(pendingUndo: PendingUndo | null) {
  try {
    if (!pendingUndo) {
      localStorage.removeItem(PENDING_UNDO_STORAGE_KEY);
      return;
    }
    const persisted: PersistedUndoState = pendingUndo;
    localStorage.setItem(PENDING_UNDO_STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // 저장 실패 시에도 메모리 상태의 Undo는 유지한다.
  }
}

function genCategoryId(): string {
  return `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

interface State {
  currency: Currency;
  data: LedgerData;
  refreshIntervalMs: number;
  priceMeta: PriceMeta;
  categories: CategoryDef[];
}

export interface NewCategoryInput {
  label: string;
  fg: string;
  icon: string;
  group: "expense" | "income";
}

type Action =
  | { type: "SET_CURRENCY"; currency: Currency }
  | { type: "ADD_TXN"; input: NewTxnInput }
  | { type: "UPDATE_TXN"; id: number; input: NewTxnInput }
  | { type: "DELETE_TXN"; id: number }
  | { type: "RESTORE_TXN"; txn: Txn; index: number }
  | { type: "SET_REFRESH_INTERVAL"; ms: number }
  | { type: "PRICE_FETCH_START" }
  | ({ type: "PRICE_FETCH_SETTLED" } & PriceFetchResult)
  | { type: "ADD_CATEGORY"; category: CategoryDef }
  | { type: "UPDATE_CATEGORY"; id: string; patch: Partial<Pick<CategoryDef, "label" | "fg" | "icon">> }
  | { type: "DELETE_CATEGORY"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CURRENCY":
      return { ...state, currency: action.currency };
    case "ADD_TXN":
      return applyAddTxn(state, action.input);
    case "UPDATE_TXN":
      return applyUpdateTxn(state, action.id, action.input);
    case "DELETE_TXN":
      return applyDeleteTxn(state, action.id);
    case "RESTORE_TXN":
      return applyRestoreTxn(state, action.txn, action.index);
    case "SET_REFRESH_INTERVAL":
      return { ...state, refreshIntervalMs: action.ms };
    case "PRICE_FETCH_START":
      return { ...state, priceMeta: { ...state.priceMeta, status: "loading" } };
    case "PRICE_FETCH_SETTLED": {
      const { btcKRW, btcUSD, usdKRW, errors } = action;
      return {
        ...state,
        data: {
          ...state.data,
          btcKRW: btcKRW ?? state.data.btcKRW,
          btcUSD: btcUSD ?? state.data.btcUSD,
          usdKRW: usdKRW ?? state.data.usdKRW,
        },
        priceMeta: {
          status: errors.length > 0 ? "error" : "ok",
          error: errors.length > 0 ? errors.join(" / ") : null,
          updatedAt: Date.now(),
          liveFields: {
            btcKRW: state.priceMeta.liveFields.btcKRW || btcKRW !== undefined,
            btcUSD: state.priceMeta.liveFields.btcUSD || btcUSD !== undefined,
            usdKRW: state.priceMeta.liveFields.usdKRW || usdKRW !== undefined,
          },
        },
      };
    }
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.category] };
    case "UPDATE_CATEGORY": {
      const nextLabel = action.patch.label;
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
        data:
          nextLabel === undefined
            ? state.data
            : {
                ...state.data,
                // 라벨이 바뀌면 이미 기록된 거래의 라벨 스냅샷도 함께 갱신해 화면이 어긋나지 않게 한다
                txns: state.data.txns.map((t) => (t.cat === action.id ? { ...t, catLabel: nextLabel } : t)),
              },
      };
    }
    case "DELETE_CATEGORY": {
      const target = state.categories.find((c) => c.id === action.id);
      if (!target || target.protected) return state; // UI가 막아주지만 방어적으로 한 번 더 확인
      const fallbackGroup = target.group === "income" ? "income" : "expense";
      const fallbackId = DEFAULT_FALLBACK[fallbackGroup];
      const fallback = state.categories.find((c) => c.id === fallbackId);
      const fallbackLabel = fallback?.label ?? "기타";
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        data: {
          ...state.data,
          txns: state.data.txns.map((t) =>
            t.cat === action.id ? { ...t, cat: fallbackId, catLabel: fallbackLabel } : t
          ),
        },
      };
    }
  }
}

function applyAddTxn(state: State, input: NewTxnInput): State {
  const category = state.categories.find((c) => c.id === input.cat);
  const label = category?.label ?? input.cat;
  const signedAmount = input.isIncome ? Math.abs(input.amount) : -Math.abs(input.amount);
  const currentMaxId = state.data.txns.reduce((max, t) => Math.max(max, t.id), 0);
  const nextId = Math.max(currentMaxId + 1, Date.now());
  const newTxn: Txn = {
    id: nextId,
    title: input.title.trim() || label,
    cat: input.cat,
    catLabel: label,
    time: formatTxnTime(input.date),
    date: input.date,
    amount: signedAmount,
    btcAt: state.data.btcKRW,
    memo: input.memo,
  };
  return {
    ...state,
    data: {
      ...state.data,
      txns: [newTxn, ...state.data.txns],
      balance: state.data.balance + signedAmount,
      income: state.data.income + (signedAmount > 0 ? signedAmount : 0),
      expense: state.data.expense + (signedAmount < 0 ? -signedAmount : 0),
    },
  };
}

function applyUpdateTxn(state: State, id: number, input: NewTxnInput): State {
  const idx = state.data.txns.findIndex((t) => t.id === id);
  if (idx === -1) return state;
  const oldTxn = state.data.txns[idx];
  const category = state.categories.find((c) => c.id === input.cat);
  const label = category?.label ?? input.cat;
  const signedAmount = input.isIncome ? Math.abs(input.amount) : -Math.abs(input.amount);
  const updatedTxn: Txn = {
    ...oldTxn,
    title: input.title.trim() || label,
    cat: input.cat,
    catLabel: label,
    time: formatTxnTime(input.date),
    date: input.date,
    amount: signedAmount,
    memo: input.memo,
    // btcAt은 의도적으로 보존 — 최초 기록 시점 시세라는 의미를 수정 후에도 유지
  };
  const nextTxns = state.data.txns.slice();
  nextTxns[idx] = updatedTxn;
  const oldIncome = oldTxn.amount > 0 ? oldTxn.amount : 0;
  const oldExpense = oldTxn.amount < 0 ? -oldTxn.amount : 0;
  const newIncome = signedAmount > 0 ? signedAmount : 0;
  const newExpense = signedAmount < 0 ? -signedAmount : 0;
  return {
    ...state,
    data: {
      ...state.data,
      txns: nextTxns,
      balance: state.data.balance - oldTxn.amount + signedAmount,
      income: state.data.income - oldIncome + newIncome,
      expense: state.data.expense - oldExpense + newExpense,
    },
  };
}

function applyDeleteTxn(state: State, id: number): State {
  const idx = state.data.txns.findIndex((t) => t.id === id);
  if (idx === -1) return state;
  const removed = state.data.txns[idx];
  const nextTxns = state.data.txns.slice();
  nextTxns.splice(idx, 1);
  return {
    ...state,
    data: {
      ...state.data,
      txns: nextTxns,
      balance: state.data.balance - removed.amount,
      income: state.data.income - (removed.amount > 0 ? removed.amount : 0),
      expense: state.data.expense - (removed.amount < 0 ? -removed.amount : 0),
    },
  };
}

function applyRestoreTxn(state: State, txn: Txn, index: number): State {
  if (state.data.txns.some((t) => t.id === txn.id)) return state;
  const nextTxns = state.data.txns.slice();
  const insertAt = Math.max(0, Math.min(index, nextTxns.length));
  nextTxns.splice(insertAt, 0, txn);
  return {
    ...state,
    data: {
      ...state.data,
      txns: nextTxns,
      balance: state.data.balance + txn.amount,
      income: state.data.income + (txn.amount > 0 ? txn.amount : 0),
      expense: state.data.expense + (txn.amount < 0 ? -txn.amount : 0),
    },
  };
}

export interface PendingUndo {
  txn: Txn;
  index: number;
  expiresAt: number;
}

interface LedgerContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  data: LedgerData;
  addTxn: (input: NewTxnInput) => void;
  updateTxn: (id: number, input: NewTxnInput) => void;
  deleteTxn: (id: number) => void;
  pendingUndo: PendingUndo | null;
  undoLastDelete: () => void;
  refreshIntervalMs: number;
  setRefreshIntervalMs: (ms: number) => void;
  priceStatus: PriceStatus;
  priceError: string | null;
  priceUpdatedAt: number | null;
  isPriceFallback: boolean;
  refreshPrices: () => void;
  categories: CategoryDef[];
  categoriesById: Record<string, CategoryDef>;
  addCategory: (input: NewCategoryInput) => void;
  updateCategory: (id: string, patch: Partial<Pick<CategoryDef, "label" | "fg" | "icon">>) => void;
  deleteCategory: (id: string) => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function buildInitialState(): State {
  const persisted = loadTxnsState();
  const data: LedgerData = persisted
    ? {
        ...DUMMY,
        balance: persisted.balance,
        income: persisted.income,
        expense: persisted.expense,
        txns: persisted.txns,
      }
    : DUMMY;
  return {
    currency: "KRW",
    data,
    refreshIntervalMs: 60_000,
    priceMeta: {
      status: "idle",
      error: null,
      updatedAt: null,
      liveFields: { btcKRW: false, btcUSD: false, usdKRW: false },
    },
    categories: loadCategories(),
  };
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(() => loadPendingUndo());
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAndApplyPrices = useCallback(async () => {
    dispatch({ type: "PRICE_FETCH_START" });
    const result = await fetchLivePrices();
    dispatch({ type: "PRICE_FETCH_SETTLED", ...result });
  }, []);

  useEffect(() => {
    fetchAndApplyPrices();
    const id = setInterval(fetchAndApplyPrices, state.refreshIntervalMs);
    return () => clearInterval(id);
  }, [state.refreshIntervalMs, fetchAndApplyPrices]);

  useEffect(() => {
    saveCategories(state.categories);
  }, [state.categories]);

  useEffect(() => {
    saveTxnsState({
      balance: state.data.balance,
      income: state.data.income,
      expense: state.data.expense,
      txns: state.data.txns,
    });
  }, [state.data.balance, state.data.income, state.data.expense, state.data.txns]);

  useEffect(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    savePendingUndo(pendingUndo);
    if (!pendingUndo) return;

    const remainingMs = pendingUndo.expiresAt - Date.now();
    if (remainingMs <= 0) {
      setPendingUndo(null);
      return;
    }
    undoTimerRef.current = setTimeout(() => setPendingUndo(null), remainingMs);
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [pendingUndo]);

  const value = useMemo<LedgerContextValue>(() => {
    const { liveFields } = state.priceMeta;

    const deleteTxn = (id: number) => {
      const idx = state.data.txns.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const removed = state.data.txns[idx];
      dispatch({ type: "DELETE_TXN", id });
      setPendingUndo({ txn: removed, index: idx, expiresAt: Date.now() + UNDO_WINDOW_MS });
    };

    const undoLastDelete = () => {
      if (!pendingUndo) return;
      dispatch({ type: "RESTORE_TXN", txn: pendingUndo.txn, index: pendingUndo.index });
      setPendingUndo(null);
    };

    return {
      currency: state.currency,
      setCurrency: (c) => dispatch({ type: "SET_CURRENCY", currency: c }),
      data: state.data,
      addTxn: (input) => dispatch({ type: "ADD_TXN", input }),
      updateTxn: (id, input) => dispatch({ type: "UPDATE_TXN", id, input }),
      deleteTxn,
      pendingUndo,
      undoLastDelete,
      refreshIntervalMs: state.refreshIntervalMs,
      setRefreshIntervalMs: (ms) => dispatch({ type: "SET_REFRESH_INTERVAL", ms }),
      priceStatus: state.priceMeta.status,
      priceError: state.priceMeta.error,
      priceUpdatedAt: state.priceMeta.updatedAt,
      isPriceFallback: !(liveFields.btcKRW && liveFields.btcUSD && liveFields.usdKRW),
      refreshPrices: fetchAndApplyPrices,
      categories: state.categories,
      categoriesById: Object.fromEntries(state.categories.map((c) => [c.id, c])),
      addCategory: (input) =>
        dispatch({
          type: "ADD_CATEGORY",
          category: {
            id: genCategoryId(),
            label: input.label,
            group: input.group,
            flow: input.group,
            icon: input.icon,
            fg: input.fg,
          },
        }),
      updateCategory: (id, patch) => dispatch({ type: "UPDATE_CATEGORY", id, patch }),
      deleteCategory: (id) => dispatch({ type: "DELETE_CATEGORY", id }),
    };
  }, [state, pendingUndo, fetchAndApplyPrices]);

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}
