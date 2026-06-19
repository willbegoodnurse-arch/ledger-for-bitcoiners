import { useMemo } from "react";
import "../../styles/ledger.css";
import "../../styles/forms.css";
import { useLedger } from "../../state/LedgerContext";
import { fmtKRW } from "../../lib/format";

export default function AssetsPage() {
  const { data } = useLedger();

  // BTC 매수/매도를 시간순으로 합쳐 순보유량을 추적한다(매수=증가, 매도=감소).
  const investTxns = useMemo(
    () =>
      data.txns
        .filter((t) => t.cat === "btc_buy" || t.cat === "btc_sell")
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [data.txns]
  );

  const buys = investTxns.filter((t) => t.cat === "btc_buy");
  const sells = investTxns.filter((t) => t.cat === "btc_sell");

  const totalBoughtKRW = buys.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalBoughtQty = buys.reduce((s, t) => s + Math.abs(t.amount) / t.btcAt, 0);
  const totalSoldQty = sells.reduce((s, t) => s + Math.abs(t.amount) / t.btcAt, 0);

  const netQtyBTC = totalBoughtQty - totalSoldQty;
  // 평균 매입가는 매수 건만의 가중평균(매도로는 변하지 않음). 평가손익은 가중평균 원가법 기준 미실현 손익.
  const avgCost = totalBoughtQty > 0 ? totalBoughtKRW / totalBoughtQty : 0;
  const costBasisRemaining = avgCost * netQtyBTC;
  const valuation = netQtyBTC * data.btcKRW;
  const pnl = valuation - costBasisRemaining;
  const pnlPct = costBasisRemaining > 0 ? (pnl / costBasisRemaining) * 100 : 0;
  const pnlClass = pnl >= 0 ? "pos" : "neg";

  // 적립 추이: 매수는 +, 매도는 -로 누적한 순 사토시
  const W = 320;
  const H = 90;
  const pad = 8;
  let cumSats = 0;
  const points = investTxns.map((t) => {
    const sats = Math.round((Math.abs(t.amount) / t.btcAt) * 1e8);
    cumSats += t.cat === "btc_buy" ? sats : -sats;
    return cumSats;
  });
  const minSats = Math.min(...points, 0);
  const maxSats = Math.max(...points, 1);
  const range = maxSats - minSats || 1;
  const valueToY = (v: number) => pad + (1 - (v - minSats) / range) * (H - pad * 2);
  const pointCoords = points.map((v, i) => {
    const x = points.length === 1 ? pad : pad + i * ((W - pad * 2) / (points.length - 1));
    return { x, y: valueToY(v) };
  });
  const linePath = pointCoords.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const zeroY = valueToY(0);

  return (
    <div className="ldg-screen">
      <div className="ldg-content">
        <div className="ldg-page-title">자산</div>
        <div className="ldg-page-sub">보유 BTC는 항상 현재 시세로 재평가돼요.</div>

        <div className="ldg-card ldg-balance">
          <div className="ldg-label">보유 BTC 평가액</div>
          <div className="ldg-balance-main">{fmtKRW(Math.round(valuation))}</div>
          <div className="ldg-balance-sub">₿ {netQtyBTC.toFixed(8)}</div>
        </div>

        <div className="ldg-inout">
          <div className="ldg-card ldg-inout-card">
            <div className="ldg-label">평가손익</div>
            <div className={`ldg-inout-main ${pnlClass}`}>
              {pnl >= 0 ? "+" : ""}
              {fmtKRW(Math.round(pnl))}
            </div>
            <div className="ldg-inout-sub">
              {pnlPct >= 0 ? "+" : ""}
              {pnlPct.toFixed(2)}%
            </div>
          </div>
          <div className="ldg-card ldg-inout-card">
            <div className="ldg-label">평균 매입가</div>
            <div className="ldg-inout-main">{avgCost > 0 ? fmtKRW(Math.round(avgCost)) : "-"}</div>
            <div className="ldg-inout-sub">총 매수 {fmtKRW(totalBoughtKRW)}</div>
          </div>
        </div>

        <div className="ldg-card">
          <div className="ldg-label" style={{ marginBottom: 10 }}>
            적립 추이 (순누적 sats)
          </div>
          {pointCoords.length > 1 ? (
            <svg className="ldg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="누적 사토시 적립 추이">
              <line x1={pad} x2={W - pad} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.06)" />
              <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="1.5" />
              <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="3" opacity="0.25" />
            </svg>
          ) : pointCoords.length === 1 ? (
            <svg className="ldg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="누적 사토시 적립 추이">
              <line x1={pad} x2={W - pad} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.06)" />
              <line
                x1={pointCoords[0].x}
                x2={pointCoords[0].x}
                y1={zeroY}
                y2={pointCoords[0].y}
                stroke="#F7931A"
                strokeWidth="2"
                opacity="0.5"
              />
              <circle cx={pointCoords[0].x} cy={pointCoords[0].y} r="4" fill="#F7931A" />
            </svg>
          ) : (
            <div className="ldg-page-sub">아직 적립 내역이 없어요. 첫 DCA를 기록해보세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
