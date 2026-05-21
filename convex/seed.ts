import { mutation } from "./_generated/server";
import { v } from "convex/values";

type SeedTicker = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  accent: string;
};

const SEED_TICKERS: SeedTicker[] = [
  { symbol: "AAPL",  name: "Apple Inc.",            exchange: "NASDAQ", sector: "Tecnología",        accent: "#c8ff1f" },
  { symbol: "MSFT",  name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Tecnología",        accent: "#2bd8e6" },
  { symbol: "NVDA",  name: "NVIDIA Corporation",    exchange: "NASDAQ", sector: "Tecnología",        accent: "#5cffaa" },
  { symbol: "GOOGL", name: "Alphabet Inc.",         exchange: "NASDAQ", sector: "Comunicaciones",    accent: "#9b5cff" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",       exchange: "NASDAQ", sector: "Consumo cíclico",   accent: "#ff8a3d" },
  { symbol: "META",  name: "Meta Platforms Inc.",   exchange: "NASDAQ", sector: "Comunicaciones",    accent: "#ffd84d" },
  { symbol: "TSLA",  name: "Tesla Inc.",            exchange: "NASDAQ", sector: "Automoción",        accent: "#ff4d7a" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",  exchange: "NYSE",   sector: "Financiero",        accent: "#bdc1ff" },
];

const SEED_HOLDINGS = ["AAPL", "NVDA", "META", "JPM"];

export const seedTickers = mutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;
    const now = Date.now();
    for (const t of SEED_TICKERS) {
      const existing = await ctx.db
        .query("tickers")
        .withIndex("by_symbol", (q) => q.eq("symbol", t.symbol))
        .unique();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("tickers", {
        ...t,
        lastPrice: 0,
        change: 0,
        changePct: 0,
        previousClose: 0,
        lastPriceAt: now,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

export const seedHoldings = mutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;
    const now = Date.now();
    for (const symbol of SEED_HOLDINGS) {
      const existing = await ctx.db
        .query("holdings")
        .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
        .unique();
      if (existing) {
        skipped++;
        continue;
      }
      const ticker = await ctx.db
        .query("tickers")
        .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
        .unique();
      if (!ticker || !(ticker.lastPrice > 0)) {
        // Skip seeding this holding until the ticker exists and has a real price
        skipped++;
        continue;
      }
      await ctx.db.insert("holdings", {
        symbol,
        qty: 1,
        avgCost: ticker.lastPrice,
        addedAt: now,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

export const seedIngestState = mutation({
  args: {},
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("ingestState")
      .withIndex("by_key", (q) => q.eq("key", "fundamentals"))
      .unique();
    if (row) return { created: false };
    await ctx.db.insert("ingestState", { key: "fundamentals", lastIdx: 0 });
    return { created: true };
  },
});
