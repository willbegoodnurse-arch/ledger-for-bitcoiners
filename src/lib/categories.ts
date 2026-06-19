import type { CategoryDef, CategoryGroup } from "../types";

// 그룹별 카테고리 삭제 시 연결된 거래가 재배정되는 폴백 카테고리 id
export const DEFAULT_FALLBACK: Record<"expense" | "income", string> = {
  expense: "etc",
  income: "etc_income",
};

// 보호 카테고리: 삭제 불가(이름/색/아이콘 편집은 가능). 기타/기타수입은 폴백 대상이라 항상
// 존재해야 하고, BTC 매수/매도는 자산 탭의 보유수량 계산이 id로 직접 참조하므로 보호한다.
export const PROTECTED_IDS = new Set(["etc", "etc_income", "btc_buy", "btc_sell"]);

export const BUILT_IN_CATEGORIES: CategoryDef[] = [
  // ---- 지출 16 ----
  { id: "food", label: "식비", group: "expense", flow: "expense", icon: "fork", fg: "#f87171" },
  { id: "cafe", label: "카페/간식", group: "expense", flow: "expense", icon: "coffee", fg: "#fbbf24" },
  { id: "dining", label: "외식", group: "expense", flow: "expense", icon: "utensils", fg: "#fb7185" },
  { id: "grocery", label: "마트/생필품", group: "expense", flow: "expense", icon: "basket", fg: "#2dd4bf" },
  { id: "shopping", label: "쇼핑", group: "expense", flow: "expense", icon: "bag", fg: "#c084fc" },
  { id: "transport", label: "교통", group: "expense", flow: "expense", icon: "bus", fg: "#60a5fa" },
  { id: "housing", label: "주거/공과금", group: "expense", flow: "expense", icon: "home", fg: "#a78bfa" },
  { id: "telecom", label: "통신", group: "expense", flow: "expense", icon: "phone", fg: "#38bdf8" },
  { id: "medical", label: "의료/건강", group: "expense", flow: "expense", icon: "medical", fg: "#f472b6" },
  { id: "pet", label: "반려", group: "expense", flow: "expense", icon: "paw", fg: "#4ade80" },
  { id: "culture", label: "문화/여가", group: "expense", flow: "expense", icon: "ticket", fg: "#facc15" },
  { id: "travel", label: "여행", group: "expense", flow: "expense", icon: "plane", fg: "#22d3ee" },
  { id: "education", label: "교육", group: "expense", flow: "expense", icon: "cap", fg: "#818cf8" },
  { id: "insurance", label: "보험", group: "expense", flow: "expense", icon: "shield", fg: "#94a3b8" },
  { id: "events", label: "경조사", group: "expense", flow: "expense", icon: "gift", fg: "#fda4af" },
  { id: "etc", label: "기타", group: "expense", flow: "expense", icon: "dots", fg: "#d4d4d4", protected: true },

  // ---- 수입 6 ----
  { id: "salary", label: "급여", group: "income", flow: "income", icon: "banknote", fg: "#4ade80" },
  { id: "side_income", label: "부수입", group: "income", flow: "income", icon: "trending", fg: "#86efac" },
  { id: "allowance", label: "용돈", group: "income", flow: "income", icon: "piggy", fg: "#fcd34d" },
  { id: "refund", label: "환급", group: "income", flow: "income", icon: "refresh", fg: "#5eead4" },
  { id: "interest", label: "이자/배당", group: "income", flow: "income", icon: "percent", fg: "#a3e635" },
  {
    id: "etc_income",
    label: "기타수입",
    group: "income",
    flow: "income",
    icon: "arrowDown",
    fg: "#94a3b8",
    protected: true,
  },

  // ---- 투자 2 ----
  {
    id: "btc_buy",
    label: "BTC 매수",
    group: "invest",
    flow: "expense",
    icon: "bitcoin",
    fg: "#f7931a",
    protected: true,
  },
  {
    id: "btc_sell",
    label: "BTC 매도",
    group: "invest",
    flow: "income",
    icon: "bitcoin",
    fg: "#4ade80",
    protected: true,
  },
];

export const GROUP_LABEL: Record<CategoryGroup, string> = {
  expense: "지출",
  income: "수입",
  invest: "투자",
};
