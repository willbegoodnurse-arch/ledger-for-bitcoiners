import type { LedgerData } from "../../types";
import { getMonthLabel, isCurrentMonth } from "../../lib/month";

interface Props {
  d: LedgerData;
  walletName: string;
  selectedMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetMonth: () => void;
}

export default function LedgerHeader({ d, walletName, selectedMonth, onPrevMonth, onNextMonth, onResetMonth }: Props) {
  const monthLabel = getMonthLabel(selectedMonth);
  const isCurrent = isCurrentMonth(selectedMonth);

  return (
    <div className="ldg-header">
      <div>
        <div className="ldg-month-nav">
          <button type="button" className="ldg-month-btn" onClick={onPrevMonth} aria-label="이전 달">
            〈
          </button>
          <button
            type="button"
            className={`ldg-month-label${isCurrent ? "" : " ldg-month-past"}`}
            onClick={isCurrent ? undefined : onResetMonth}
          >
            {monthLabel}
          </button>
          <button type="button" className="ldg-month-btn" onClick={onNextMonth} aria-label="다음 달">
            〉
          </button>
        </div>
        <div className="ldg-app-name">{walletName}</div>
      </div>
      <div className="ldg-block">
        <span className="ldg-block-dot" />
        <span className="ldg-block-num">#{d.blockHeight.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
