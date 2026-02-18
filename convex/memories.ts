import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMemories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("memories").collect();
  },
});

export const searchMemories = query({
  args: { search: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("memories").collect();
    const searchLower = args.search.toLowerCase();
    return all.filter(
      (m) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.content.toLowerCase().includes(searchLower) ||
        m.tags.some((t) => t.toLowerCase().includes(searchLower))
    );
  },
});

export const createMemory = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("memories", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const updateMemory = mutation({
  args: {
    id: v.id("memories"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
