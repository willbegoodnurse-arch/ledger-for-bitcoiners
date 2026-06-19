import type { LedgerData } from "../../types";

export default function LedgerHeader({ d }: { d: LedgerData }) {
  return (
    <div className="ldg-header">
      <div>
        <div className="ldg-month">{d.month}</div>
        <div className="ldg-app-name">My Ledger</div>
      </div>
      <div className="ldg-block">
        <span className="ldg-block-dot" />
        <span className="ldg-block-num">#{d.blockHeight.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
