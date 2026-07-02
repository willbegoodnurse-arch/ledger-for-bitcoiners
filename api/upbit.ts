type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

const UPBIT_BTC_KRW_URL = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
const FETCH_TIMEOUT_MS = 8000;

export default async function handler(_req: unknown, res: VercelResponse) {
  try {
    const response = await fetch(UPBIT_BTC_KRW_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`upbit ${response.status}`);

    const data = (await response.json()) as Array<{ trade_price?: number }>;
    const price = Array.isArray(data) ? data[0]?.trade_price : undefined;
    if (typeof price !== "number" || !Number.isFinite(price)) throw new Error("invalid");

    res.setHeader("Cache-Control", "s-maxage=5, stale-while-revalidate=15");
    res.status(200).json({ btcKrw: price });
  } catch {
    res.status(502).json({ error: "upbit_unavailable" });
  }
}
