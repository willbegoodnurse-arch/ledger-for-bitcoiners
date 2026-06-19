import type { Txn } from "../../types";
import { useLedger } from "../../state/LedgerContext";
import { fmtKRW } from "../../lib/format";

export default function CategoryDonut({ txns }: { txns: Txn[] }) {
  const { categoriesById } = useLedger();
  const expenseByCat = new Map<string, number>();
  let total = 0;
  for (const t of txns) {
    if (t.amount >= 0) continue;
    const amt = Math.abs(t.amount);
    expenseByCat.set(t.cat, (expenseByCat.get(t.cat) ?? 0) + amt);
    total += amt;
  }
  const entries = [...expenseByCat.entries()].sort((a, b) => b[1] - a[1]);

  const R = 46;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  if (total === 0) {
    return <div className="ldg-page-sub">이번 기간에 지출 내역이 없어요.</div>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {entries.map(([catId, amt]) => {
          const c = categoriesById[catId] ?? categoriesById.etc;
          const frac = amt / total;
          const len = frac * CIRC;
          const dash = `${len} ${CIRC - len}`;
          const el = (
            <circle
              key={catId}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={c.fg}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(([catId, amt]) => {
          const c = categoriesById[catId] ?? categoriesById.etc;
          return (
            <div key={catId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ldg-fg-2)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: c.fg, display: "inline-block" }} />
                {c.label}
              </span>
              <span className="mono" style={{ fontFamily: "var(--ldg-mono)", color: "var(--ldg-fg-3)" }}>
                {fmtKRW(amt)} · {((amt / total) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
