import { useMemo, useState } from "react";
import "../../styles/ledger.css";
import "../../styles/forms.css";
import { useLedger } from "../../state/LedgerContext";
import { fmtKRW, krwToSats } from "../../lib/format";
import CategoryDonut from "./CategoryDonut";
import ChartCard from "../home/ChartCard";

const RANGES = ["일", "월", "년"] as const;
type Range = (typeof RANGES)[number];

export default function StatsPage() {
  const { data } = useLedger();
  const [range, setRange] = useState<Range>("월");

  const filteredTxns = useMemo(() => {
    if (data.txns.length === 0) return [];
    // 더미 데이터 기준으로 의미 있는 결과를 보여주기 위해 최신 거래일을 기준 시점으로 사용
    const anchor = new Date(data.txns.reduce((a, b) => (a.date > b.date ? a : b)).date);
    return data.txns.filter((t) => {
      const d = new Date(t.date);
      if (range === "일") return d.toDateString() === anchor.toDateString();
      if (range === "월") return d.getFullYear() === anchor.getFullYear() && d.getMonth() === anchor.getMonth();
      return d.getFullYear() === anchor.getFullYear();
    });
  }, [data.txns, range]);

  const periodExpense = filteredTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const periodIncome = filteredTxns.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
  const periodSats = krwToSats(periodExpense, data.btcKRW);

  return (
    <div className="ldg-screen">
      <div className="ldg-content">
        <div className="ldg-page-title">통계</div>
        <div className="ldg-page-sub">기간별 수입·지출과 카테고리 분포를 확인해요.</div>

        <div className="ldg-card">
          <div className="ldg-card-head">
            <div className="ldg-label">기간</div>
            <div className="ldg-range">
              {RANGES.map((r) => (
                <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="ldg-label">수입</div>
              <div className="ldg-inout-main pos">{fmtKRW(periodIncome)}</div>
            </div>
            <div>
              <div className="ldg-label">지출</div>
              <div className="ldg-inout-main neg">{fmtKRW(periodExpense)}</div>
            </div>
          </div>
        </div>

        <div className="ldg-card">
          <div className="ldg-label" style={{ marginBottom: 10 }}>
            카테고리별 지출
          </div>
          <CategoryDonut txns={filteredTxns} />
        </div>

        <ChartCard />

        <div className="ldg-preview">
          이번 기간 지출을 사토시로 환산하면{" "}
          <b style={{ whiteSpace: "nowrap" }}>{periodSats.toLocaleString("en-US")} sats</b> 예요.
        </div>
      </div>
    </div>
  );
}
