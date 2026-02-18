import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("content").collect();
  },
});

export const getContentByStage = query({
  args: { stage: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("stage"), args.stage))
      .collect();
  },
});

export const createContent = mutation({
  args: {
    title: v.string(),
    stage: v.union(
      v.literal("idea"),
      v.literal("scripting"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published"),
      v.literal("archived")
    ),
    script: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("content", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const updateContentStage = mutation({
  args: {
    id: v.id("content"),
    stage: v.union(
      v.literal("idea"),
      v.literal("scripting"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      stage: args.stage,
      updatedAt: Date.now(),
    });
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("content"),
    title: v.optional(v.string()),
    script: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});
