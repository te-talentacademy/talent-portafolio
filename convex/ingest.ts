import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const SINGLETON_KEY = "fundamentals";

export const _currentIdx = internalQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("ingestState")
      .withIndex("by_key", (q) => q.eq("key", SINGLETON_KEY))
      .unique();
    return row?.lastIdx ?? 0;
  },
});

export const _advanceCursor = internalMutation({
  args: { modulo: v.number() },
  returns: v.null(),
  handler: async (ctx, { modulo }) => {
    const row = await ctx.db
      .query("ingestState")
      .withIndex("by_key", (q) => q.eq("key", SINGLETON_KEY))
      .unique();
    const safeModulo = Number.isInteger(modulo) && modulo > 0 ? modulo : 1;
    const next = ((row?.lastIdx ?? 0) + 1) % safeModulo;
    if (row) {
      await ctx.db.patch(row._id, { lastIdx: next });
    } else {
      await ctx.db.insert("ingestState", { key: SINGLETON_KEY, lastIdx: next });
    }
    return null;
  },
});
