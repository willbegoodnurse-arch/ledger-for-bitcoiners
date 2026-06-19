import "../../styles/ledger.css";
import { useLedger } from "../../state/LedgerContext";
import LightningOverlay from "../lightning/LightningOverlay";
import Slogan from "./Slogan";
import LedgerHeader from "./LedgerHeader";
import CurrencyToggle from "./CurrencyToggle";
import BalanceCard from "./BalanceCard";
import InOutCards from "./InOutCards";
import PriceWidget from "./PriceWidget";
import ChartCard from "./ChartCard";
import TxnsCard from "./TxnsCard";

export default function HomePage() {
  const { currency, setCurrency, data } = useLedger();
  return (
    <div className="ldg-page-root">
      {/* 번개는 .ldg-screen(z-index 2)의 형제로 렌더링되어야 최하단에 깔린다.
          ldg-screen 내부에 넣으면 z-index:0이 비포지션 콘텐츠 위로 올라와 버린다. */}
      <LightningOverlay />
      <div className="ldg-screen">
        <div className="ldg-content">
          <Slogan />
          <LedgerHeader d={data} />
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <BalanceCard d={data} currency={currency} />
          <InOutCards d={data} currency={currency} />
          <PriceWidget d={data} />
          <ChartCard />
          <TxnsCard d={data} currency={currency} />
        </div>
      </div>
    </div>
  );
}
