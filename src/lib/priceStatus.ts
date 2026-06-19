import type { PriceStatus } from "../state/LedgerContext";

export type PriceTone = "live" | "loading" | "stale" | "offline";

// isFallback: 세 시세 중 하나라도 아직 한 번도 실시간으로 갱신된 적이 없음(=더미 사용 중)
export function getPriceTone(status: PriceStatus, isFallback: boolean): PriceTone {
  if (isFallback) return status === "loading" ? "loading" : "offline";
  if (status === "loading") return "loading";
  if (status === "error") return "stale";
  return "live";
}

export const PRICE_TONE_COLOR: Record<PriceTone, string> = {
  live: "#4ade80",
  loading: "#8a8a8a",
  stale: "#f7931a",
  offline: "#f87171",
};

export function formatUpdatedAt(updatedAt: number | null): string {
  return updatedAt ? new Date(updatedAt).toLocaleTimeString("ko-KR") : "";
}
