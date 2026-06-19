import type { Currency, LedgerData } from "../../types";
import { fmtBTC, fmtKRW } from "../../lib/format";

export default function InOutCards({ d, currency }: { d: LedgerData; currency: Currency }) {
  const fmt = (n: number) =>
    currency === "KRW"
      ? (n >= 0 ? "+" : "") + fmtKRW(n)
      : `${n >= 0 ? "+" : "-"}₿ ${(Math.abs(n) / d.btcKRW).toFixed(5)}`;
  const sub = (n: number) => (currency === "KRW" ? fmtBTC(n, d.btcKRW) : `≈ ${fmtKRW(n)}`);
  return (
    <div className="ldg-inout">
      <div className="ldg-card ldg-inout-card">
        <div className="ldg-label">수입</div>
        <div className="ldg-inout-main pos">{fmt(d.income)}</div>
        <div className="ldg-inout-sub">{sub(d.income)}</div>
      </div>
      <div className="ldg-card ldg-inout-card">
        <div className="ldg-label">지출</div>
        <div className="ldg-inout-main neg">{fmt(-d.expense)}</div>
        <div className="ldg-inout-sub">{sub(d.expense)}</div>
      </div>
    </div>
  );
}
