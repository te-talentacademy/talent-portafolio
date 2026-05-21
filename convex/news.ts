import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const NEWS_ITEM = v.object({
  _id: v.id("news"),
  _creationTime: v.number(),
  symbol: v.string(),
  headline: v.string(),
  summary: v.string(),
  source: v.string(),
  url: v.string(),
  image: v.optional(v.string()),
  category: v.optional(v.string()),
  publishedAt: v.number(),
});

export const listNewsForTicker = query({
  args: { symbol: v.string(), limit: v.optional(v.number()) },
  returns: v.array(NEWS_ITEM),
  handler: async (ctx, { symbol, limit }) => {
    const q = ctx.db
      .query("news")
      .withIndex("by_symbol_published", (idx) => idx.eq("symbol", symbol))
      .order("desc");
    return await q.take(limit ?? 6);
  },
});

const NEWS_INPUT = v.object({
  headline: v.string(),
  summary: v.string(),
  source: v.string(),
  url: v.string(),
  image: v.optional(v.string()),
  category: v.optional(v.string()),
  publishedAt: v.number(),
});

export const _replaceNewsForSymbol = internalMutation({
  args: {
    symbol: v.string(),
    items: v.array(NEWS_INPUT),
  },
  returns: v.null(),
  handler: async (ctx, { symbol, items }) => {
    const existing = await ctx.db
      .query("news")
      .withIndex("by_symbol_published", (idx) => idx.eq("symbol", symbol))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    for (const item of items) {
      await ctx.db.insert("news", { symbol, ...item });
    }
    return null;
  },
});
