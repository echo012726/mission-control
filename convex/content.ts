import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContent = query({ args: {}, handler: async (ctx) => ctx.db.query("content").collect() });

export const createContent = mutation({
  args: { title: v.string(), stage: v.union(v.literal("idea"), v.literal("scripting"), v.literal("thumbnail"), v.literal("filming"), v.literal("editing"), v.literal("published"), v.literal("archived")), script: v.optional(v.string()), thumbnailUrl: v.optional(v.string()), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("content", { ...args, createdAt: now, updatedAt: now });
  },
});

export const updateContentStage = mutation({
  args: { id: v.id("content"), stage: v.union(v.literal("idea"), v.literal("scripting"), v.literal("thumbnail"), v.literal("filming"), v.literal("editing"), v.literal("published"), v.literal("archived")) },
  handler: async (ctx, args) => { await ctx.db.patch(args.id, { stage: args.stage, updatedAt: Date.now() }); },
});
