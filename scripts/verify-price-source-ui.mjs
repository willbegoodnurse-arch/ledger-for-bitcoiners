import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const settings = readFileSync("src/components/settings/SettingsPage.tsx", "utf8");
const priceApi = readFileSync("src/lib/priceApi.ts", "utf8");
const context = readFileSync("src/state/LedgerContext.tsx", "utf8");
const widget = readFileSync("src/components/home/PriceWidget.tsx", "utf8");
const upbitProxyPath = "api/upbit.ts";
assert.equal(existsSync(upbitProxyPath), true, "Vercel Upbit proxy function exists");
const upbitProxy = readFileSync(upbitProxyPath, "utf8");

assert.doesNotMatch(settings, /시세 소스/, "SettingsPage does not render a fake price source selector");
assert.doesNotMatch(settings, /const SOURCES\s*=/, "SettingsPage has no unused SOURCES constant");
assert.doesNotMatch(settings, /\bsetSource\b/, "SettingsPage has no unused source setter");
assert.doesNotMatch(settings, /\[source,\s*setSource\]/, "SettingsPage has no unused source state");
assert.match(settings, /새로고침 주기/, "refresh interval UI remains");
assert.match(settings, /시세 상태/, "price status UI remains");
assert.match(settings, /지금 갱신/, "manual price refresh remains");
assert.match(settings, /여러 공개 API를 fallback으로/, "settings explains automatic fallback behavior");

assert.match(priceApi, /export async function fetchUpbitBtcKrw/, "Upbit BTC/KRW fetch remains");
assert.match(priceApi, /fetchJson\("\/api\/upbit"\)/, "Upbit BTC/KRW fetch tries the same-origin proxy first");
assert.match(priceApi, /fetchUpbitBtcKrwProxy\(\)[\s\S]*fetchUpbitBtcKrwDirect\(\)/, "Upbit BTC/KRW fetch falls back to direct Upbit");
assert.match(priceApi, /fetchJson\(UPBIT_BTC_KRW_URL\)/, "direct Upbit fallback remains");
assert.match(priceApi, /export async function fetchBtcUsdWithFallback/, "BTC/USD fallback chain remains");
assert.match(priceApi, /export async function fetchUsdKrwWithFallback/, "USD/KRW fallback chain remains");
assert.match(priceApi, /export async function fetchBlockHeight/, "block height fetch is exported");
assert.match(priceApi, /https:\/\/mempool\.space\/api\/blocks\/tip\/height/, "mempool block height endpoint exists");
assert.match(priceApi, /https:\/\/blockchain\.info\/q\/getblockcount/, "blockchain.info block height fallback exists");
assert.match(priceApi, /blockHeight\?:\s*number/, "PriceFetchResult includes optional block height");
assert.match(priceApi, /btcKrwIsFallback\?:\s*boolean/, "PriceFetchResult marks BTC/KRW fallback values");
assert.match(priceApi, /export async function fetchLivePrices/, "combined live price fetch remains");
assert.match(priceApi, /result\.btcKRW\s*=\s*btcUsdVal\s*\*\s*usdKrw/, "Upbit failure can derive BTC/KRW from BTC/USD and USD/KRW");
assert.match(priceApi, /result\.btcKrwIsFallback\s*=\s*true/, "derived BTC/KRW values are explicitly flagged");
assert.match(
  priceApi,
  /Promise\.allSettled\(\[\s*fetchUpbitBtcKrw\(\),\s*fetchBtcUsdWithFallback\(\),\s*fetchUsdKrwWithFallback\(\),\s*fetchBlockHeight\(\),?\s*\]\)/,
  "fetchLivePrices keeps independent price sources and joins block height"
);
assert.match(widget, /!btcKrwIsFallback/, "kimchi premium is guarded when BTC/KRW is derived");
assert.match(widget, /김프 보류\(해외 환산 표시 중\)/, "price card explains derived BTC/KRW without fake kimchi");
assert.match(upbitProxy, /https:\/\/api\.upbit\.com\/v1\/ticker\?markets=KRW-BTC/, "Upbit proxy calls the server-side Upbit endpoint");
assert.match(upbitProxy, /btcKrw:\s*price/, "Upbit proxy returns only the BTC/KRW price");
assert.match(upbitProxy, /s-maxage=5,\s*stale-while-revalidate=15/, "Upbit proxy caches briefly to protect rate limits");
assert.match(upbitProxy, /status\(502\)\.json\(\{\s*error:\s*"upbit_unavailable"\s*\}\)/, "Upbit proxy reports unavailable upstreams as 502");
assert.match(
  context,
  /blockHeight:\s*blockHeight\s*\?\?\s*state\.data\.blockHeight/,
  "PRICE_FETCH_SETTLED preserves existing block height when live fetch fails"
);

console.log("verify:price-source-ui passed");
