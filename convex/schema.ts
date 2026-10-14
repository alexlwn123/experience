import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  participants: defineTable({
    name: v.string(),
    tokenHash: v.string(),
    phase: v.string(),
    idea: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    registeredAt: v.number(),
    lastSeenAt: v.number(),
    submittedAt: v.optional(v.number()),
    // Presentation order sort key; starts as the submit time, rewritten when Alex reorders.
    slot: v.optional(v.number()),
    presentedAt: v.optional(v.number()),
  }).index("by_tokenHash", ["tokenHash"]),
});
