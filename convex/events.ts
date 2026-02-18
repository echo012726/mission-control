import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .filter((q) => q.gte(q.field("scheduledAt"), now))
      .collect();
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("cron_job"), v.literal("scheduled_task"), v.literal("reminder"), v.literal("meeting")),
    scheduledAt: v.number(),
    recurring: v.optional(v.boolean()),
    cronExpression: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("events", {
      ...args,
      status: "scheduled",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const completeEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});
