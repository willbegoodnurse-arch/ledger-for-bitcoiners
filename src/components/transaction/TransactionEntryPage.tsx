import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/ledger.css";
import "../../styles/forms.css";
import { useLedger } from "../../state/LedgerContext";
import { fmtKRW, krwToSats, nowDatetimeLocal } from "../../lib/format";
import type { CategoryId } from "../../types";
import CategoryGroupPicker from "./CategoryGroupPicker";

export default function TransactionEntryPage() {
  const { data, addTxn, updateTxn, categories } = useLedger();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const editingTxn = editId ? data.txns.find((t) => t.id === Number(editId)) ?? null : null;

  const [amount, setAmount] = useState(() => (editingTxn ? String(Math.abs(editingTxn.amount)) : ""));
  const [cat, setCat] = useState<CategoryId>(
    () =>
      editingTxn?.cat ??
      (categories.find((c) => c.id === "food") ?? categories.find((c) => c.group === "expense") ?? categories[0]).id
  );
  const [title, setTitle] = useState(() => editingTxn?.title ?? "");
  const [memo, setMemo] = useState(() => editingTxn?.memo ?? "");
  const [date, setDate] = useState(() => editingTxn?.date ?? nowDatetimeLocal());

  const selectedCategory = categories.find((c) => c.id === cat) ?? categories[0];
  const isIncome = selectedCategory.flow === "income";

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const sats = useMemo(() => krwToSats(amountNum, data.btcKRW), [amountNum, data.btcKRW]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) return;
    if (editingTxn) {
      updateTxn(editingTxn.id, { title, cat, amount: amountNum, isIncome, date, memo });
      navigate(-1);
    } else {
      addTxn({ title, cat, amount: amountNum, isIncome, date, memo });
      navigate("/");
    }
  };

  return (
    <div className="ldg-screen">
      <div className="ldg-content">
        <div className="ldg-page-title">{editingTxn ? "거래 수정" : "거래 입력"}</div>
        <div className="ldg-page-sub">
          {editingTxn
            ? "금액·카테고리·날짜를 바꾸면 잔액과 통계에 바로 반영돼요."
            : "수기로 거래를 기록하면 현재 시세 기준 사토시 환산을 바로 보여줘요."}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ldg-card">
            <div className="ldg-field">
              <div className="ldg-label">카테고리</div>
              <CategoryGroupPicker value={cat} onSelect={(category) => setCat(category.id)} />
            </div>

            <div className="ldg-field" style={{ marginTop: 12 }}>
              <div className="ldg-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                금액 (₩)
                <span className={`ldg-flow-badge ${isIncome ? "income" : "expense"}`}>{isIncome ? "수입" : "지출"}</span>
              </div>
              <input
                className="ldg-amount-input"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="ldg-preview">
                ≈ <b style={{ whiteSpace: "nowrap" }}>{sats.toLocaleString("en-US")} sats</b> · 현재 시세{" "}
                <span style={{ whiteSpace: "nowrap" }}>₩{(data.btcKRW / 1_000_000).toFixed(1)}M</span> 기준
              </div>
            </div>

            <div className="ldg-field">
              <div className="ldg-label">제목</div>
              <input
                className="ldg-input"
                placeholder={selectedCategory.label}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="ldg-field">
              <div className="ldg-label">메모</div>
              <textarea className="ldg-textarea" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>

            <div className="ldg-field">
              <div className="ldg-label">날짜 / 시간</div>
              <input
                className="ldg-input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button className="ldg-submit-btn" type="submit" disabled={amountNum <= 0} style={{ marginTop: 14 }}>
              {isIncome ? "+" : "-"}
              {fmtKRW(amountNum)} {editingTxn ? "수정 완료" : "기록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
