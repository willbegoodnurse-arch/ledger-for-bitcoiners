import type { Currency, LedgerData } from "../../types";
import { fmtBTC, fmtKRW } from "../../lib/format";

export default function InOutCards({
  d,
  currency,
  netKrw,
}: {
  d: LedgerData;
  currency: Currency;
  netKrw: number;
}) {
  const fmt = (value: number) =>
    currency === "KRW"
      ? (value >= 0 ? "+" : "") + fmtKRW(value)
      : `${value >= 0 ? "+" : "-"}₿${(Math.abs(value) / d.btcKRW).toFixed(5)}`;
  const sub = (value: number) => (currency === "KRW" ? fmtBTC(value, d.btcKRW) : `≈${fmtKRW(value)}`);

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
      <div className="ldg-card ldg-net-card">
        <div>
          <div className="ldg-label">남는 금액</div>
          <div className="ldg-tiny">현재 정산기간 생활비 기준</div>
        </div>
        <div className={`ldg-net-value ${netKrw >= 0 ? "pos" : "neg"}`}>
          {netKrw >= 0 ? "+" : "−"}
          {fmtKRW(Math.abs(netKrw))}
        </div>
      </div>
    </div>
  );
}
