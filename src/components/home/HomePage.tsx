import { useCallback, useEffect, useState } from "react";
import "../../styles/ledger.css";
import { useLedger } from "../../state/LedgerContext";
import { loadWalletName } from "../../lib/walletName";
import { getHeldBtc } from "../../lib/heldBtc";
import { loadBtcUnit, type BtcUnit } from "../../lib/format";
import { calculateMonthlyLivingCashflow, calculateSellNeeded } from "../../lib/sellCalculator";
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  getNextMonthKey,
  getYearFromMonthKey,
  monthKeyToAnchorDate,
} from "../../lib/month";
import {
  summarizeBtcSellRecordsByMonth,
  summarizeBtcSellRecordsByYear,
  listBtcSellRecordsByMonth,
} from "../../lib/btcSellRecords";
import LightningOverlay from "../lightning/LightningOverlay";
import Slogan from "./Slogan";
import LedgerHeader from "./LedgerHeader";
import CurrencyToggle from "./CurrencyToggle";
import BalanceCard from "./BalanceCard";
import InOutCards from "./InOutCards";
import SellNeededCard from "./SellNeededCard";
import SellConfirmModal from "./SellConfirmModal";
import MonthlySellSummaryCard from "./MonthlySellSummaryCard";
import YearlySellSummaryCard from "./YearlySellSummaryCard";
import PriceWidget from "./PriceWidget";
import ChartCard from "./ChartCard";
import TxnsCard from "./TxnsCard";

export default function HomePage() {
  const { currency, setCurrency, data, categoriesById } = useLedger();
  const [walletName, setWalletName] = useState(loadWalletName);
  const [heldBtc, setHeldBtc] = useState(getHeldBtc);
  const [btcUnit, setBtcUnit] = useState<BtcUnit>(loadBtcUnit);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellSavedMessage, setSellSavedMessage] = useState<string | null>(null);
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    document.title = walletName;
  }, [walletName]);

  useEffect(() => {
    const refresh = () => {
      setWalletName(loadWalletName());
      setHeldBtc(getHeldBtc());
      setBtcUnit(loadBtcUnit());
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const yearKey = getYearFromMonthKey(selectedMonth);
  const anchorDate = monthKeyToAnchorDate(selectedMonth);

  const monthlySellSummary = summarizeBtcSellRecordsByMonth(selectedMonth);
  const yearlySellSummary = summarizeBtcSellRecordsByYear(yearKey);
  const monthRecords = listBtcSellRecordsByMonth(selectedMonth);

  const { incomeKrw, expenseKrw } = calculateMonthlyLivingCashflow(
    data.txns,
    categoriesById,
    anchorDate,
  );
  const sellResult = calculateSellNeeded({
    incomeKrw,
    expenseKrw,
    btcKrw: data.btcKRW,
    heldBtc,
    confirmedCoverageKrw: monthlySellSummary.totalKrwCovered,
  });

  const handleSellSaved = useCallback(() => {
    setHeldBtc(getHeldBtc());
    setRefreshTick((k) => k + 1);
    setSellSavedMessage("BTC 판매 기록이 저장되었습니다. 보유 BTC가 업데이트되었습니다.");
  }, []);

  useEffect(() => {
    if (!sellSavedMessage) return;
    const id = setTimeout(() => setSellSavedMessage(null), 3000);
    return () => clearTimeout(id);
  }, [sellSavedMessage]);

  return (
    <div className="ldg-page-root">
      <LightningOverlay />
      <div className="ldg-screen">
        <div className="ldg-content">
          <Slogan />
          <LedgerHeader
            d={data}
            walletName={walletName}
            selectedMonth={selectedMonth}
            onPrevMonth={() => setSelectedMonth((m) => getPreviousMonthKey(m))}
            onNextMonth={() => setSelectedMonth((m) => getNextMonthKey(m))}
            onResetMonth={() => setSelectedMonth(getCurrentMonthKey())}
          />
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <BalanceCard d={data} heldBtc={heldBtc} unit={btcUnit} />
          <InOutCards d={data} currency={currency} />
          <SellNeededCard
            result={sellResult}
            unit={btcUnit}
            selectedMonth={selectedMonth}
            onConfirmSell={sellResult.deficitKrw > 0 ? () => setSellModalOpen(true) : undefined}
          />
          <MonthlySellSummaryCard
            summary={monthlySellSummary}
            records={monthRecords}
            unit={btcUnit}
            selectedMonth={selectedMonth}
          />
          <YearlySellSummaryCard summary={yearlySellSummary} unit={btcUnit} year={yearKey} />
          <PriceWidget d={data} />
          <ChartCard />
          <TxnsCard d={data} currency={currency} />
        </div>
      </div>
      {sellModalOpen && (
        <SellConfirmModal
          result={sellResult}
          btcKrw={data.btcKRW}
          unit={btcUnit}
          selectedMonth={selectedMonth}
          onClose={() => setSellModalOpen(false)}
          onSaved={handleSellSaved}
        />
      )}
      {sellSavedMessage && (
        <div className="ldg-toast">
          <span>{sellSavedMessage}</span>
        </div>
      )}
    </div>
  );
}
