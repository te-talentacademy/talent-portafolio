import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tickers: defineTable({
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
  }).index("by_symbol", ["symbol"]),

  holdings: defineTable({
    symbol: v.string(),
    qty: v.number(),
    avgCost: v.number(),
    addedAt: v.number(),
  }).index("by_symbol", ["symbol"]),

  news: defineTable({
    symbol: v.string(),
    headline: v.string(),
    summary: v.string(),
    source: v.string(),
    url: v.string(),
    image: v.optional(v.string()),
    category: v.optional(v.string()),
    publishedAt: v.number(),
  }).index("by_symbol_published", ["symbol", "publishedAt"]),

  ingestState: defineTable({
    key: v.string(),
    lastIdx: v.number(),
  }).index("by_key", ["key"]),
});
