import type { Currency, Txn } from "../../types";
import { fmtKRW, krwToBtc, krwToSats, formatCategoryLabel } from "../../lib/format";
import CategoryIcon from "./CategoryIcon";

export default function TxnRow({ t, currency, btcKRW }: { t: Txn; currency: Currency; btcKRW: number }) {
  const isPos = t.amount >= 0;
  // 사토시/BTC 환산은 거래 당시 시세(t.btcAt)가 아니라 항상 현재 시세(btcKRW) 기준
  const main =
    currency === "KRW"
      ? (isPos ? "+" : "") + fmtKRW(t.amount)
      : `${isPos ? "+" : "-"}₿ ${krwToBtc(Math.abs(t.amount), btcKRW).toFixed(6)}`;
  const sub =
    currency === "KRW"
      ? `${krwToSats(Math.abs(t.amount), btcKRW).toLocaleString("en-US")} sats`
      : fmtKRW(Math.abs(t.amount));
  return (
    <>
      <CategoryIcon cat={t.cat} />
      <div className="ldg-txn-mid">
        <div className="ldg-txn-title">{t.title}</div>
        <div className="ldg-txn-meta">
          {formatCategoryLabel(t.catLabel)} · {t.time}
        </div>
      </div>
      <div className="ldg-txn-amt">
        <div className={`ldg-txn-main ${isPos ? "pos" : "neg"}`}>{main}</div>
        <div className="ldg-txn-sub">{sub}</div>
      </div>
    </>
  );
}
