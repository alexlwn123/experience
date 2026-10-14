import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import { LIMITS, READY_PHASE } from "./model";
import { assertAdmin } from "./validate";

const slotOf = (p: Doc<"participants">) => p.slot ?? p.submittedAt ?? Number.POSITIVE_INFINITY;

async function findByToken(ctx: QueryCtx, tokenHash: string) {
  return await ctx.db
    .query("participants")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
}

// ---- Called only from the public HTTP routes in http.ts ----

export const register = internalMutation({
  args: { name: v.string(), tokenHash: v.string() },
  handler: async (ctx, { name, tokenHash }) => {
    const existing = await ctx.db.query("participants").take(LIMITS.participants);
    if (existing.length >= LIMITS.participants) return null;
    const now = Date.now();
    return await ctx.db.insert("participants", {
      name,
      tokenHash,
      phase: "interview",
      registeredAt: now,
      lastSeenAt: now,
    });
  },
});

export const progress = internalMutation({
  args: { tokenHash: v.string(), phase: v.optional(v.string()), idea: v.optional(v.string()) },
  handler: async (ctx, { tokenHash, phase, idea }) => {
    const participant = await findByToken(ctx, tokenHash);
    if (!participant) return false;
    await ctx.db.patch(participant._id, {
      ...(phase && participant.phase !== READY_PHASE ? { phase } : {}),
      ...(idea ? { idea } : {}),
      lastSeenAt: Date.now(),
    });
    return true;
  },
});

export const submit = internalMutation({
  args: { tokenHash: v.string(), demoUrl: v.string(), repoUrl: v.optional(v.string()) },
  handler: async (ctx, { tokenHash, demoUrl, repoUrl }) => {
    const participant = await findByToken(ctx, tokenHash);
    if (!participant) return null;
    const now = Date.now();
    const everyone = await ctx.db.query("participants").collect();
    const others = everyone.filter((p) => p._id !== participant._id && p.submittedAt !== undefined);
    // New submitters go strictly last (even within the same millisecond); resubmitting keeps the current place.
    const lastSlot = Math.max(-1, ...others.map(slotOf));
    const slot = participant.submittedAt === undefined ? Math.max(now, lastSlot + 1) : slotOf(participant);
    await ctx.db.patch(participant._id, {
      demoUrl,
      repoUrl,
      // A new demo URL means new slides (if any); the dashboard looks again.
      ...(participant.demoUrl !== demoUrl ? { slidesUrl: undefined } : {}),
      phase: READY_PHASE,
      submittedAt: participant.submittedAt ?? now,
      slot,
      lastSeenAt: now,
    });
    const ahead = others.filter((p) => slotOf(p) < slot);
    return { position: ahead.length + 1 };
  },
});

// ---- Admin dashboard (requires ADMIN_KEY) ----

export const adminList = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    assertAdmin(key);
    const participants = await ctx.db.query("participants").collect();
    return participants.map(({ tokenHash: _omit, ...rest }) => rest);
  },
});

export const adminSetPresented = mutation({
  args: { key: v.string(), id: v.id("participants"), presented: v.boolean() },
  handler: async (ctx, { key, id, presented }) => {
    assertAdmin(key);
    await ctx.db.patch(id, { presentedAt: presented ? Date.now() : undefined });
  },
});

// Rewrites the presentation order. Ids that aren't submitted are ignored; anyone who
// submits afterwards keeps a timestamp slot, so they land at the end.
export const adminReorder = mutation({
  args: { key: v.string(), ids: v.array(v.id("participants")) },
  handler: async (ctx, { key, ids }) => {
    assertAdmin(key);
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    const ready = docs.filter((doc): doc is Doc<"participants"> => doc?.submittedAt !== undefined);
    await Promise.all(ready.map((doc, index) => ctx.db.patch(doc._id, { slot: index })));
  },
});

export const adminRemove = mutation({
  args: { key: v.string(), id: v.id("participants") },
  handler: async (ctx, { key, id }) => {
    assertAdmin(key);
    await ctx.db.delete(id);
  },
});
