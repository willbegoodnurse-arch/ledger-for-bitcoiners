import type { Currency, LedgerData } from "../../types";
import { fmtBTC, fmtKRW } from "../../lib/format";

export default function BalanceCard({ d, currency }: { d: LedgerData; currency: Currency }) {
  const main = currency === "KRW" ? fmtKRW(d.balance) : `₿ ${(d.balance / d.btcKRW).toFixed(5)}`;
  const sub = currency === "KRW" ? fmtBTC(d.balance, d.btcKRW) : `≈ ${fmtKRW(d.balance)}`;
  return (
    <div className="ldg-card ldg-balance">
      <div className="ldg-label">사용 가능 잔액</div>
      <div className="ldg-balance-main">{main}</div>
      <div className="ldg-balance-sub">{sub}</div>
    </div>
  );
}
