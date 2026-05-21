import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listHoldings = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("holdings"),
      _creationTime: v.number(),
      symbol: v.string(),
      qty: v.number(),
      avgCost: v.number(),
      addedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("holdings").collect();
  },
});

export const addHolding = mutation({
  args: { symbol: v.string() },
  returns: v.object({ added: v.boolean() }),
  handler: async (ctx, { symbol }) => {
    const existing = await ctx.db
      .query("holdings")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .unique();
    if (existing) return { added: false };

    const ticker = await ctx.db
      .query("tickers")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .unique();
    if (!ticker) {
      throw new Error(`Ticker ${symbol} no encontrado en la tabla tickers`);
    }

    await ctx.db.insert("holdings", {
      symbol,
      qty: 1,
      avgCost: ticker.lastPrice || 0,
      addedAt: Date.now(),
    });
    return { added: true };
  },
});

export const removeHolding = mutation({
  args: { symbol: v.string() },
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, { symbol }) => {
    const existing = await ctx.db
      .query("holdings")
      .withIndex("by_symbol", (q) => q.eq("symbol", symbol))
      .unique();
    if (!existing) return { removed: false };
    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});
