import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMemories = query({ args: {}, handler: async (ctx) => ctx.db.query("memories").collect() });

export const createMemory = mutation({
  args: { title: v.string(), content: v.string(), tags: v.array(v.string()), source: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", { ...args, createdAt: Date.now() });
  },
});
