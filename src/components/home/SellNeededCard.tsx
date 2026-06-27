import type { MonthSellSummary } from "../../lib/btcSellRecords";
import type { SellResult } from "../../lib/sellCalculator";
import { fmtBtcValue, fmtKRW, type BtcUnit } from "../../lib/format";
import { getMonthLabel } from "../../lib/month";

interface Props {
  result: SellResult;
  unit: BtcUnit;
  selectedMonth: string;
  monthlyCash: number;
  monthlySellSummary: MonthSellSummary;
  btcKrw: number;
  onConfirmSell?: () => void;
}

function satsFromKrw(krw: number, btcKrw: number): number {
  return Number.isFinite(btcKrw) && btcKrw > 0 ? Math.round((krw / btcKrw) * 100_000_000) : 0;
}

function btcFromSats(sats: number): number {
  return sats / 100_000_000;
}

function BtcAndSats({ btc, sats, unit }: { btc: number; sats: number; unit: BtcUnit }) {
  return (
    <>
      <strong>{fmtBtcValue(btc, unit)}</strong>
      <span className="ldg-balance-sub" style={{ display: "block", marginTop: 2 }}>
        {sats.toLocaleString("en-US")} sats / {btc.toFixed(8)} BTC
      </span>
    </>
  );
}

export default function SellNeededCard({ result, unit, selectedMonth, monthlyCash, monthlySellSummary, btcKrw, onConfirmSell }: Props) {
  const { deficitKrw, sellBtc, sellSats, totalDeficitKrw, confirmedCoverageKrw } = result;
  const noSellNeeded = deficitKrw === 0;
  const hasConfirmed = confirmedCoverageKrw > 0;
  const monthLabel = getMonthLabel(selectedMonth);
  const expectedTotalSats = satsFromKrw(totalDeficitKrw, btcKrw);
  const expectedTotalBtc = btcFromSats(expectedTotalSats);
  const actualSoldBtc = monthlySellSummary.totalSatsSold / 100_000_000;

  return (
    <div className="ldg-card">
      {noSellNeeded ? (
        <>
          <div className="ldg-settlement-done">정산 완료</div>
          <div className="ldg-sell-needed-row" style={{ marginTop: 10 }}>
            <span>이번 달 예상 판매량</span>
            <BtcAndSats btc={expectedTotalBtc} sats={expectedTotalSats} unit={unit} />
          </div>
          <div className="ldg-sell-needed-row">
            <span>이번 달 통장 보유액</span>
            <strong>{fmtKRW(monthlyCash)}</strong>
          </div>
          <div className="ldg-sell-needed-row">
            <span>실제 판매량</span>
            <BtcAndSats btc={actualSoldBtc} sats={monthlySellSummary.totalSatsSold} unit={unit} />
          </div>
          <div className="ldg-sell-needed-row">
            <span>이번 달 판매 후 BTC</span>
            <strong>월 판매량 기준 -{fmtBtcValue(actualSoldBtc, unit)}</strong>
          </div>
          {hasConfirmed && (
            <div className="ldg-balance-sub" style={{ marginTop: 8 }}>
              이미 반영 {fmtKRW(confirmedCoverageKrw)} / 총 부족분 {fmtKRW(totalDeficitKrw)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="ldg-label">판매해야 하는 비트코인</div>
          <div className="ldg-sell-deficit-label">{monthLabel} 부족분</div>
          <div className="ldg-sell-deficit-value">{fmtKRW(deficitKrw)}</div>
          <div className="ldg-sell-needed-row">
            <span>현재 BTC 가격 기준 예상 판매량</span>
            <BtcAndSats btc={sellBtc} sats={sellSats} unit={unit} />
          </div>
          {hasConfirmed && (
            <div className="ldg-balance-sub" style={{ marginTop: 6 }}>
              이미 반영 {fmtKRW(confirmedCoverageKrw)} / 총 부족분 {fmtKRW(totalDeficitKrw)}
            </div>
          )}
          {onConfirmSell && (
            <button type="button" className="ldg-submit-btn" style={{ marginTop: 12 }} onClick={onConfirmSell}>
              BTC 판매 확정
            </button>
          )}
        </>
      )}
    </div>
  );
}
