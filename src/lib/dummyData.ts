import type { LedgerData } from "../types";

// 디자인 레퍼런스(myledger.jsx)의 DUMMY를 그대로 포팅. date 필드만 통계 탭의
// 기간 필터링을 위해 time 라벨에 맞춰 추가했다.
export const DUMMY: LedgerData = {
  month: "2026년 4월",
  blockHeight: 894217,
  btcKRW: 158_000_000,
  btcUSD: 117_400,
  usdKRW: 1346,
  balance: 1_847_500,
  income: 3_200_000,
  expense: 1_352_500,
  txns: [
    { id: 1, title: "DCA Buy", cat: "btc_buy", catLabel: "BTC 매수", time: "오늘 09:02", date: "2026-04-26T09:02", amount: -200_000, btcAt: 158_000_000 },
    { id: 2, title: "Starbucks", cat: "cafe", catLabel: "카페/간식", time: "오늘 08:14", date: "2026-04-26T08:14", amount: -5_800, btcAt: 158_120_000 },
    { id: 3, title: "Orijen 사료", cat: "pet", catLabel: "반려", time: "어제 19:42", date: "2026-04-25T19:42", amount: -38_000, btcAt: 157_840_000 },
    { id: 4, title: "April Salary", cat: "salary", catLabel: "급여", time: "4월 25일", date: "2026-04-25T10:00", amount: 3_200_000, btcAt: 156_900_000 },
    { id: 5, title: "지하철", cat: "transport", catLabel: "교통", time: "4월 24일", date: "2026-04-24T08:30", amount: -1_550, btcAt: 156_500_000 },
  ],
};
