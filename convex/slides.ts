import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { assertAdmin } from "./validate";

const FETCH_TIMEOUT_MS = 5_000;

// Returns the page's HTML, or null if it isn't a reachable 2xx HTML page.
async function fetchHtml(url: string, fetcher: typeof fetch): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetcher(url, { signal: controller.signal, headers: { accept: "text/html" } });
    const isHtml = response.headers.get("content-type")?.includes("text/html") ?? false;
    return response.ok && isHtml ? await response.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// The playbook has attendees serve slides at /slides on their demo site. Sites with a catch-all
// route answer every path, so /slides only counts if it differs from a made-up path's page.
export async function detectSlides(demoUrl: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  const { origin } = new URL(demoUrl);
  const slidesUrl = `${origin}/slides`;
  const [slides, nowhere] = await Promise.all([
    fetchHtml(slidesUrl, fetcher),
    fetchHtml(`${origin}/slides-check-${crypto.randomUUID()}`, fetcher),
  ]);
  return slides !== null && slides !== nowhere ? slidesUrl : null;
}

// Called by the dashboard while it's open, so checks stop when nobody's watching.
export const adminCheckSlides = action({
  args: { key: v.string() },
  handler: async (ctx, { key }): Promise<void> => {
    assertAdmin(key);
    const unchecked = await ctx.runQuery(internal.slides.withoutSlides, {});
    await Promise.all(
      unchecked.map(async ({ id, demoUrl }) => {
        const slidesUrl = await detectSlides(demoUrl);
        if (slidesUrl) await ctx.runMutation(internal.slides.saveSlides, { id, demoUrl, slidesUrl });
      }),
    );
  },
});

// Submitted participants who haven't presented and have no slides on record yet.
export const withoutSlides = internalQuery({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query("participants").collect();
    return participants.flatMap((p) =>
      p.demoUrl && !p.slidesUrl && p.presentedAt === undefined ? [{ id: p._id, demoUrl: p.demoUrl }] : [],
    );
  },
});

export const saveSlides = internalMutation({
  args: { id: v.id("participants"), demoUrl: v.string(), slidesUrl: v.string() },
  handler: async (ctx, { id, demoUrl, slidesUrl }) => {
    const participant = await ctx.db.get(id);
    // Skip it if they resubmitted a different URL while we were checking.
    if (participant?.demoUrl === demoUrl) await ctx.db.patch(id, { slidesUrl });
  },
});
