const BASE = "https://finnhub.io/api/v1";

export type Quote = {
  c: number;   // current price
  d: number;   // change (absolute)
  dp: number;  // change percent
  h: number;   // high of day
  l: number;   // low of day
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp (seconds epoch)
};

export type Profile = {
  name: string;
  ticker: string;
  exchange: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  logo: string;
  weburl: string;
};

export type Metric = {
  metric: {
    "10DayAverageTradingVolume"?: number;
    peTTM?: number;
    beta?: number;
    currentDividendYieldTTM?: number;
    [key: string]: number | undefined;
  };
};

export type NewsItem = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

const DEFAULT_TIMEOUT_MS = 10_000;

async function getJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Finnhub ${res.status}: ${url.replace(/token=[^&]+/, "token=***")}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Finnhub timeout after ${timeoutMs}ms: ${url.replace(/token=[^&]+/, "token=***")}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchQuote(symbol: string, apiKey: string): Promise<Quote> {
  return getJson<Quote>(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`);
}

export async function fetchProfile(symbol: string, apiKey: string): Promise<Profile> {
  return getJson<Profile>(`${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`);
}

export async function fetchMetric(symbol: string, apiKey: string): Promise<Metric> {
  return getJson<Metric>(`${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${apiKey}`);
}

export async function fetchCompanyNews(
  symbol: string,
  apiKey: string,
  fromDate: string,
  toDate: string,
): Promise<NewsItem[]> {
  return getJson<NewsItem[]>(
    `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${apiKey}`,
  );
}

export type QuoteResult =
  | { symbol: string; ok: true; quote: Quote }
  | { symbol: string; ok: false; error: string };

export async function fetchAllQuotes(
  symbols: string[],
  apiKey: string,
  opts: { concurrency?: number } = {},
): Promise<QuoteResult[]> {
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 8, symbols.length));
  const results: QuoteResult[] = new Array(symbols.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= symbols.length) return;
      const symbol = symbols[i];
      try {
        const quote = await fetchQuote(symbol, apiKey);
        results[i] = { symbol, ok: true, quote };
      } catch (err) {
        results[i] = { symbol, ok: false, error: (err as Error).message };
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
