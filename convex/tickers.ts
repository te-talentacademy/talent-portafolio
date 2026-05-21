import { query, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  fetchAllQuotes,
  fetchProfile,
  fetchMetric,
  fetchCompanyNews,
} from "./finnhub";
import { sectorFromFinnhubIndustry } from "./sectors";

const TICKER_DOC = v.object({
  _id: v.id("tickers"),
  _creationTime: v.number(),
  symbol: v.string(),
  name: v.string(),
  exchange: v.string(),
  sector: v.string(),
  accent: v.string(),
  lastPrice: v.number(),
  change: v.number(),
  changePct: v.number(),
  previousClose: v.number(),
  lastPriceAt: v.number(),
  marketCap: v.optional(v.number()),
  volume10d: v.optional(v.number()),
  peRatio: v.optional(v.number()),
  dividendYield: v.optional(v.number()),
  beta: v.optional(v.number()),
  profileAt: v.optional(v.number()),
});

export const listTickers = query({
  args: {},
  returns: v.array(TICKER_DOC),
  handler: async (ctx) => {
    return await ctx.db.query("tickers").withIndex("by_symbol").collect();
  },
});

export const getTicker = query({
  args: { symbol: v.string() },
  returns: v.union(TICKER_DOC, v.null()),
  handler: async (ctx, { symbol }) => {
    const row = await ctx.db
      .query("tickers")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .unique();
    return row;
  },
});

export const _listSymbols = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("tickers").collect();
    return rows.map((r) => r.symbol).sort();
  },
});

const QUOTE_PATCH = v.object({
  symbol: v.string(),
  lastPrice: v.number(),
  change: v.number(),
  changePct: v.number(),
  previousClose: v.number(),
  lastPriceAt: v.number(),
});

export const _patchQuotes = internalMutation({
  args: { quotes: v.array(QUOTE_PATCH) },
  returns: v.null(),
  handler: async (ctx, { quotes }) => {
    for (const q of quotes) {
      const row = await ctx.db
        .query("tickers")
        .withIndex("by_symbol", (idx) => idx.eq("symbol", q.symbol))
        .unique();
      if (!row) continue;
      await ctx.db.patch(row._id, {
        lastPrice: q.lastPrice,
        change: q.change,
        changePct: q.changePct,
        previousClose: q.previousClose,
        lastPriceAt: q.lastPriceAt,
      });
    }
    return null;
  },
});

function readApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new Error(
      "FINNHUB_API_KEY no configurada en Convex. Ejecuta: npx convex env set FINNHUB_API_KEY <valor>",
    );
  }
  return key;
}

export const refreshQuotes = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const apiKey = readApiKey();
    const symbols = await ctx.runQuery(internal.tickers._listSymbols, {});
    if (symbols.length === 0) return null;

    const results = await fetchAllQuotes(symbols, apiKey, { concurrency: 8 });
    const patches = results.flatMap((r) => {
      if (!r.ok) {
        console.error(`refreshQuotes failed for ${r.symbol}: ${r.error}`);
        return [];
      }
      return [{
        symbol: r.symbol,
        lastPrice: r.quote.c,
        change: r.quote.d,
        changePct: r.quote.dp,
        previousClose: r.quote.pc,
        lastPriceAt: r.quote.t * 1000,
      }];
    });

    if (patches.length > 0) {
      await ctx.runMutation(internal.tickers._patchQuotes, { quotes: patches });
    }
    return null;
  },
});

const FUNDAMENTALS_PATCH = v.object({
  symbol: v.string(),
  sector: v.optional(v.string()),
  name: v.optional(v.string()),
  marketCap: v.optional(v.number()),
  volume10d: v.optional(v.number()),
  peRatio: v.optional(v.number()),
  dividendYield: v.optional(v.number()),
  beta: v.optional(v.number()),
});

export const _patchFundamentals = internalMutation({
  args: FUNDAMENTALS_PATCH.fields,
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tickers")
      .withIndex("by_symbol", (idx) => idx.eq("symbol", args.symbol))
      .unique();
    if (!row) return null;
    const { symbol: _ignored, ...patch } = args;
    await ctx.db.patch(row._id, { ...patch, profileAt: Date.now() });
    return null;
  },
});

function toNumberOrUndefined(n: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return n;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const refreshFundamentalsAndNewsOneSymbol = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const apiKey = readApiKey();
    const symbols = await ctx.runQuery(internal.tickers._listSymbols, {});
    if (symbols.length === 0) return null;

    const idx = await ctx.runQuery(internal.ingest._currentIdx, {});
    const symbol = symbols[idx % symbols.length];

    let profile: Awaited<ReturnType<typeof fetchProfile>> | null = null;
    let metric: Awaited<ReturnType<typeof fetchMetric>> | null = null;
    let news: Awaited<ReturnType<typeof fetchCompanyNews>> | null = null;

    try {
      profile = await fetchProfile(symbol, apiKey);
    } catch (err) {
      console.error(`fetchProfile ${symbol}: ${(err as Error).message}`);
    }
    try {
      metric = await fetchMetric(symbol, apiKey);
    } catch (err) {
      console.error(`fetchMetric ${symbol}: ${(err as Error).message}`);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      news = await fetchCompanyNews(symbol, apiKey, toIsoDate(sevenDaysAgo), toIsoDate(now));
    } catch (err) {
      console.error(`fetchCompanyNews ${symbol}: ${(err as Error).message}`);
    }

    if (profile || metric) {
      await ctx.runMutation(internal.tickers._patchFundamentals, {
        symbol,
        sector: profile?.finnhubIndustry
          ? sectorFromFinnhubIndustry(profile.finnhubIndustry)
          : undefined,
        name: profile?.name && profile.name.length > 0 ? profile.name : undefined,
        marketCap: toNumberOrUndefined(profile?.marketCapitalization),
        volume10d: toNumberOrUndefined(metric?.metric?.["10DayAverageTradingVolume"]),
        peRatio: toNumberOrUndefined(metric?.metric?.peTTM),
        dividendYield: toNumberOrUndefined(metric?.metric?.currentDividendYieldTTM),
        beta: toNumberOrUndefined(metric?.metric?.beta),
      });
    }

    if (news) {
      const items = news
        .filter((n) => n.headline && n.url && typeof n.datetime === "number" && n.datetime > 0)
        .slice(0, 12)
        .map((n) => ({
          headline: n.headline,
          summary: n.summary ?? "",
          source: n.source ?? "",
          url: n.url,
          image: n.image && n.image.length > 0 ? n.image : undefined,
          category: n.category && n.category.length > 0 ? n.category : undefined,
          publishedAt: n.datetime * 1000,
        }));
      await ctx.runMutation(internal.news._replaceNewsForSymbol, { symbol, items });
    }

    await ctx.runMutation(internal.ingest._advanceCursor, { modulo: symbols.length });
    return null;
  },
});
