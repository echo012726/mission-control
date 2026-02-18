import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("blocked")),
    assigneeType: v.union(v.literal("user"), v.literal("agent")),
    assigneeId: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
  
  content: defineTable({
    title: v.string(),
    stage: v.union(v.literal("idea"), v.literal("scripting"), v.literal("thumbnail"), v.literal("filming"), v.literal("editing"), v.literal("published"), v.literal("archived")),
    script: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_stage", ["stage"]),

  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("cron_job"), v.literal("scheduled_task"), v.literal("reminder"), v.literal("meeting")),
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("completed"), v.literal("cancelled")),
    recurring: v.optional(v.boolean()),
  }),

  memories: defineTable({
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }),

  agents: defineTable({
    name: v.string(),
    role: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("idle"), v.literal("working"), v.literal("waiting")),
    currentTask: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_status", ["status"]),
});
