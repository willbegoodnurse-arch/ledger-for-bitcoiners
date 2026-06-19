import { useMemo, useState } from "react";

const RANGES = ["일", "월", "년"] as const;

export default function ChartCard() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("월");
  const days = 30;
  const expense = useMemo(
    () => Array.from({ length: days }, (_, i) => 8 + Math.sin(i * 0.6) * 4 + Math.random() * 5),
    []
  );
  const price = useMemo(
    () => Array.from({ length: days }, (_, i) => 150 + Math.sin(i * 0.4) * 6 + i * 0.3 + Math.random() * 2),
    []
  );

  const W = 320;
  const H = 110;
  const pad = 8;
  const maxE = Math.max(...expense);
  const maxP = Math.max(...price);
  const minP = Math.min(...price);
  const barW = (W - pad * 2) / days - 1;

  const linePath = price
    .map((p, i) => {
      const x = pad + i * ((W - pad * 2) / (days - 1));
      const y = pad + (1 - (p - minP) / (maxP - minP)) * (H - pad * 2);
      return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");

  return (
    <div className="ldg-card">
      <div className="ldg-card-head">
        <div className="ldg-label">지출 vs BTC 시세</div>
        <div className="ldg-range">
          {RANGES.map((r) => (
            <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg className="ldg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="지출과 비트코인 시세">
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="rgba(255,255,255,0.06)" />
        {expense.map((e, i) => {
          const x = pad + i * ((W - pad * 2) / days);
          const h = (e / maxE) * (H - pad * 2) * 0.7;
          return <rect key={i} x={x} y={H - pad - h} width={barW} height={h} fill="rgba(255,255,255,0.18)" rx="1" />;
        })}
        <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="1.5" />
        <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="3" opacity="0.25" />
      </svg>
      <div className="ldg-legend">
        <span>
          <span className="dot dot-bar" /> 일별 지출
        </span>
        <span>
          <span className="dot dot-line" /> BTC 시세
        </span>
      </div>
    </div>
  );
}
