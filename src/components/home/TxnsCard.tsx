import type { Currency, LedgerData } from "../../types";
import { fmtKRW, krwToBtc, krwToSats } from "../../lib/format";
import CategoryIcon from "./CategoryIcon";

export default function TxnsCard({ d, currency }: { d: LedgerData; currency: Currency }) {
  return (
    <div className="ldg-card ldg-txns">
      <div className="ldg-card-head">
        <div className="ldg-label">최근 거래</div>
        <button className="ldg-link">전체 보기 →</button>
      </div>
      <div className="ldg-txn-list">
        {d.txns.map((t) => {
          const isPos = t.amount >= 0;
          // 사토시/BTC 환산은 거래 당시 시세(t.btcAt)가 아니라 항상 현재 시세(d.btcKRW) 기준
          const main =
            currency === "KRW"
              ? (isPos ? "+" : "") + fmtKRW(t.amount)
              : `${isPos ? "+" : "-"}₿ ${krwToBtc(Math.abs(t.amount), d.btcKRW).toFixed(6)}`;
          const sub =
            currency === "KRW"
              ? `${krwToSats(Math.abs(t.amount), d.btcKRW).toLocaleString("en-US")} sats`
              : fmtKRW(Math.abs(t.amount));
          return (
            <div className="ldg-txn" key={t.id}>
              <CategoryIcon cat={t.cat} />
              <div className="ldg-txn-mid">
                <div className="ldg-txn-title">{t.title}</div>
                <div className="ldg-txn-meta">
                  {t.catLabel} · {t.time}
                </div>
              </div>
              <div className="ldg-txn-amt">
                <div className={`ldg-txn-main ${isPos ? "pos" : "neg"}`}>{main}</div>
                <div className="ldg-txn-sub">{sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
