import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAgents = query({ args: {}, handler: async (ctx) => ctx.db.query("agents").collect() });

export const createAgent = mutation({
  args: { name: v.string(), role: v.string(), description: v.optional(v.string()), avatar: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agents", { ...args, status: "idle", createdAt: now, lastActiveAt: now });
  },
});

export const updateAgentStatus = mutation({
  args: { id: v.id("agents"), status: v.union(v.literal("idle"), v.literal("working"), v.literal("waiting")), currentTask: v.optional(v.string()) },
  handler: async (ctx, args) => { const { id, ...updates } = args; await ctx.db.patch(id, { ...updates, lastActiveAt: Date.now() }); },
});
