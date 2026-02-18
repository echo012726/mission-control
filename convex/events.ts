import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getEvents = query({ args: {}, handler: async (ctx) => ctx.db.query("events").collect() });

export const createEvent = mutation({
  args: { title: v.string(), description: v.optional(v.string()), type: v.union(v.literal("cron_job"), v.literal("scheduled_task"), v.literal("reminder"), v.literal("meeting")), scheduledAt: v.number(), recurring: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", { ...args, status: "scheduled" });
  },
});
