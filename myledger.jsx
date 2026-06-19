// My Ledger — 비트코이너용 가계부 메인 대시보드
// 단일 화면. 더미 데이터 + 컴포넌트 state. localStorage 미사용.

const { useState, useMemo, useEffect } = React;

// ---- 더미 데이터 ----
const DUMMY = {
  month: "2026년 4월",
  blockHeight: 894217,
  btcKRW: 158_000_000,
  btcUSD: 117_400,
  usdKRW: 1346,
  balance: 1_847_500,
  income:  3_200_000,
  expense: 1_352_500,
  txns: [
    { id: 1, title: "DCA Buy",         cat: "btc",  catLabel: "투자",   time: "오늘 09:02", amount: -200_000,   btcAt: 158_000_000 },
    { id: 2, title: "Starbucks",        cat: "food", catLabel: "식비",   time: "오늘 08:14", amount: -5_800,     btcAt: 158_120_000 },
    { id: 3, title: "Orijen 사료",      cat: "pet",  catLabel: "반려",   time: "어제 19:42", amount: -38_000,    btcAt: 157_840_000 },
    { id: 4, title: "April Salary",     cat: "in",   catLabel: "수입",   time: "4월 25일",   amount: 3_200_000,  btcAt: 156_900_000 },
    { id: 5, title: "지하철",           cat: "etc",  catLabel: "교통",   time: "4월 24일",   amount: -1_550,     btcAt: 156_500_000 },
  ],
};

const CAT = {
  food: { bg: "rgba(248,113,113,0.15)", fg: "#f87171", icon: "M12 2v4 M8 2v6a4 4 0 0 0 8 0V2 M12 14v8" },
  pet:  { bg: "rgba(74,222,128,0.15)",  fg: "#4ade80", icon: "M5 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M19 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M9 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M15 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M12 22c-4 0-7-3-7-6s3-6 7-6 7 3 7 6-3 6-7 6z" },
  btc:  { bg: "rgba(247,147,26,0.15)",  fg: "#f7931a", icon: "M9 4h5a3 3 0 0 1 0 6H9 M9 10h6a3 3 0 0 1 0 6H9 M9 4v16 M11 2v2 M11 20v2 M14 2v2 M14 20v2" },
  in:   { bg: "rgba(74,222,128,0.15)",  fg: "#4ade80", icon: "M12 4v14 M5 11l7 7 7-7" },
  etc:  { bg: "rgba(255,255,255,0.10)", fg: "#d4d4d4", icon: "M5 12h14 M12 5v14" },
};

const fmtKRW = (n) => (n < 0 ? "-" : "") + "₩" + Math.abs(n).toLocaleString("ko-KR");
const fmtBTC = (krw, rate) => {
  const btc = krw / rate;
  if (Math.abs(btc) >= 0.001) return `≈ ${btc >= 0 ? "" : "-"}${Math.abs(btc).toFixed(5)} BTC`;
  const sats = Math.round(krw / rate * 1e8);
  return `≈ ${sats.toLocaleString("en-US")} sats`;
};
const fmtBTCDirect = (sats) => `₿${(sats).toLocaleString("en-US")}`;

// ---- 헤더 ----
function LedgerHeader({ d }) {
  return (
    <div className="ldg-header">
      <div>
        <div className="ldg-month">{d.month}</div>
        <div className="ldg-app-name">My Ledger</div>
      </div>
      <div className="ldg-block">
        <span className="ldg-block-dot" />
        <span className="ldg-block-num">#{d.blockHeight.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}

// ---- 통화 토글 ----
function CurrencyToggle({ value, onChange }) {
  return (
    <div className="ldg-toggle" role="tablist">
      <button
        className={`ldg-toggle-btn ${value === "KRW" ? "active krw" : ""}`}
        onClick={() => onChange("KRW")}
        role="tab"
        aria-selected={value === "KRW"}
      >
        <span className="ldg-toggle-glyph">₩</span> KRW
      </button>
      <button
        className={`ldg-toggle-btn ${value === "BTC" ? "active btc" : ""}`}
        onClick={() => onChange("BTC")}
        role="tab"
        aria-selected={value === "BTC"}
      >
        <span className="ldg-toggle-glyph">₿</span> Bitcoin
      </button>
    </div>
  );
}

// ---- 잔액 카드 ----
function BalanceCard({ d, currency }) {
  const main = currency === "KRW"
    ? fmtKRW(d.balance)
    : `₿ ${(d.balance / d.btcKRW).toFixed(5)}`;
  const sub = currency === "KRW"
    ? fmtBTC(d.balance, d.btcKRW)
    : `≈ ${fmtKRW(d.balance)}`;
  return (
    <div className="ldg-card ldg-balance">
      <div className="ldg-label">사용 가능 잔액</div>
      <div className="ldg-balance-main">{main}</div>
      <div className="ldg-balance-sub">{sub}</div>
    </div>
  );
}

// ---- 수입/지출 듀얼 ----
function InOutCards({ d, currency }) {
  const fmt = (n) => currency === "KRW"
    ? (n >= 0 ? "+" : "") + fmtKRW(n)
    : `${n >= 0 ? "+" : "-"}₿ ${(Math.abs(n) / d.btcKRW).toFixed(5)}`;
  const sub = (n) => currency === "KRW"
    ? fmtBTC(n, d.btcKRW)
    : `≈ ${fmtKRW(n)}`;
  return (
    <div className="ldg-inout">
      <div className="ldg-card ldg-inout-card">
        <div className="ldg-label">수입</div>
        <div className="ldg-inout-main pos">{fmt(d.income)}</div>
        <div className="ldg-inout-sub">{sub(d.income)}</div>
      </div>
      <div className="ldg-card ldg-inout-card">
        <div className="ldg-label">지출</div>
        <div className="ldg-inout-main neg">{fmt(-d.expense)}</div>
        <div className="ldg-inout-sub">{sub(d.expense)}</div>
      </div>
    </div>
  );
}

// ---- BTC 시세 위젯 ----
function PriceWidget({ d }) {
  // 김프 = (업비트 - 바이낸스*환율) / (바이낸스*환율) * 100
  const fair = d.btcUSD * d.usdKRW;
  const kimchi = ((d.btcKRW - fair) / fair) * 100;
  const kimchiClass = kimchi > 3 ? "danger" : kimchi >= 0 ? "warn" : "good";
  return (
    <div className="ldg-card ldg-price">
      <div className="ldg-card-head">
        <div className="ldg-label">Bitcoin Price</div>
        <div className={`ldg-kimchi ${kimchiClass}`}>
          김프 {kimchi >= 0 ? "+" : ""}{kimchi.toFixed(2)}%
        </div>
      </div>
      <div className="ldg-price-grid">
        <div>
          <div className="ldg-tiny">UPBIT · KRW</div>
          <div className="ldg-price-val">₩{(d.btcKRW / 1_000_000).toFixed(1)}M</div>
        </div>
        <div>
          <div className="ldg-tiny">BINANCE · USD</div>
          <div className="ldg-price-val">${d.btcUSD.toLocaleString("en-US")}</div>
        </div>
        <div>
          <div className="ldg-tiny">USD/KRW</div>
          <div className="ldg-price-val mono">{d.usdKRW.toLocaleString("en-US")}</div>
        </div>
      </div>
    </div>
  );
}

// ---- 차트 카드 ----
function ChartCard() {
  const [range, setRange] = useState("월");
  // 더미 데이터: 30일 지출 막대 + BTC 라인
  const days = 30;
  const expense = useMemo(
    () => Array.from({ length: days }, (_, i) => 8 + Math.sin(i * 0.6) * 4 + Math.random() * 5),
    []
  );
  const price = useMemo(
    () => Array.from({ length: days }, (_, i) => 150 + Math.sin(i * 0.4) * 6 + i * 0.3 + Math.random() * 2),
    []
  );

  const W = 320, H = 110, pad = 8;
  const maxE = Math.max(...expense);
  const maxP = Math.max(...price), minP = Math.min(...price);
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
          {["일", "월", "년"].map((r) => (
            <button
              key={r}
              className={range === r ? "on" : ""}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg className="ldg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="지출과 비트코인 시세">
        {/* baseline grid */}
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="rgba(255,255,255,0.06)" />
        {/* expense bars */}
        {expense.map((e, i) => {
          const x = pad + i * ((W - pad * 2) / days);
          const h = (e / maxE) * (H - pad * 2) * 0.7;
          return (
            <rect
              key={i}
              x={x}
              y={H - pad - h}
              width={barW}
              height={h}
              fill="rgba(255,255,255,0.18)"
              rx="1"
            />
          );
        })}
        {/* price line */}
        <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="1.5" />
        <path d={linePath} fill="none" stroke="#F7931A" strokeWidth="3" opacity="0.25" />
      </svg>
      <div className="ldg-legend">
        <span><span className="dot dot-bar" /> 일별 지출</span>
        <span><span className="dot dot-line" /> BTC 시세</span>
      </div>
    </div>
  );
}

// ---- 거래 내역 ----
function CategoryIcon({ cat }) {
  const c = CAT[cat] || CAT.etc;
  return (
    <div className="ldg-cat-icon" style={{ background: c.bg, color: c.fg }}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={c.icon} />
      </svg>
    </div>
  );
}

function TxnsCard({ d, currency }) {
  return (
    <div className="ldg-card ldg-txns">
      <div className="ldg-card-head">
        <div className="ldg-label">최근 거래</div>
        <button className="ldg-link">전체 보기 →</button>
      </div>
      <div className="ldg-txn-list">
        {d.txns.map((t) => {
          const isPos = t.amount >= 0;
          const main = currency === "KRW"
            ? (isPos ? "+" : "") + fmtKRW(t.amount)
            : `${isPos ? "+" : "-"}₿ ${(Math.abs(t.amount) / t.btcAt).toFixed(6)}`;
          const sub = currency === "KRW"
            ? `${(Math.abs(t.amount) / t.btcAt * 1e8).toLocaleString("en-US", { maximumFractionDigits: 0 })} sats`
            : fmtKRW(Math.abs(t.amount));
          return (
            <div className="ldg-txn" key={t.id}>
              <CategoryIcon cat={t.cat} />
              <div className="ldg-txn-mid">
                <div className="ldg-txn-title">{t.title}</div>
                <div className="ldg-txn-meta">{t.catLabel} · {t.time}</div>
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

// ---- 슬로건 ----
function Slogan() {
  return (
    <div className="ldg-slogan" aria-label="Stay humble. Stack sats.">
      <div className="ldg-slogan-line">Stay humble</div>
      <div className="ldg-slogan-line ldg-slogan-line-2">Stack sats</div>
    </div>
  );
}

// ---- App 메인 ----
function MyLedger({ children }) {
  const [currency, setCurrency] = useState("KRW");
  return (
    <div className="ldg-screen">
      <div className="ldg-content">
        <Slogan />
        {/* 슬로건 위에 번개가 떨어지는 자리 — children으로 LightningStrike가 들어감 */}
        {children}

        <LedgerHeader d={DUMMY} />
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <BalanceCard d={DUMMY} currency={currency} />
        <InOutCards d={DUMMY} currency={currency} />
        <PriceWidget d={DUMMY} />
        <ChartCard />
        <TxnsCard d={DUMMY} currency={currency} />
      </div>
    </div>
  );
}

window.MyLedger = MyLedger;
