import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction, type ActionCtx } from "./_generated/server";
import { LIMITS } from "./model";
import { cleanPhase, cleanText, cleanUrl } from "./validate";

type Body = Record<string, unknown>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const ok = (data: unknown) => json(200, { success: true, data });
const fail = (status: number, error: string) => json(status, { success: false, error });

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

const newToken = () => `exp_${toHex(crypto.getRandomValues(new Uint8Array(24)))}`;

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

async function readBody(request: Request): Promise<Body | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Body) : null;
  } catch {
    return null;
  }
}

// Wraps a handler with JSON body parsing and a generic error response that never leaks internals.
const jsonRoute = (handler: (ctx: ActionCtx, body: Body) => Promise<Response>) =>
  httpAction(async (ctx, request) => {
    const body = await readBody(request);
    if (!body) return fail(400, "Body must be a JSON object");
    try {
      return await handler(ctx, body);
    } catch (error) {
      console.error("experience api error:", error);
      return fail(500, "Something went wrong. Try again in a moment.");
    }
  });

async function tokenHashFrom(body: Body) {
  return typeof body.token === "string" && body.token.length > 0 ? await hashToken(body.token) : null;
}

const register = jsonRoute(async (ctx, body) => {
  const name = cleanText(body.name, "name", LIMITS.name);
  if (!name.ok) return fail(400, name.error);
  const token = newToken();
  const id = await ctx.runMutation(internal.participants.register, {
    name: name.value,
    tokenHash: await hashToken(token),
  });
  if (!id) return fail(503, "Registration is full. Find Alex.");
  return ok({ id, token });
});

const progress = jsonRoute(async (ctx, body) => {
  const tokenHash = await tokenHashFrom(body);
  if (!tokenHash) return fail(401, "token is required");
  const phase = body.phase === undefined ? undefined : cleanPhase(body.phase);
  if (phase && !phase.ok) return fail(400, phase.error);
  const idea = body.idea === undefined ? undefined : cleanText(body.idea, "idea", LIMITS.idea);
  if (idea && !idea.ok) return fail(400, idea.error);
  if (!phase && !idea) return fail(400, "Send at least one of: phase, idea");
  const found = await ctx.runMutation(internal.participants.progress, {
    tokenHash,
    phase: phase?.value,
    idea: idea?.value,
  });
  return found ? ok({ updated: true }) : fail(404, "Unknown token. Register again.");
});

const submit = jsonRoute(async (ctx, body) => {
  const tokenHash = await tokenHashFrom(body);
  if (!tokenHash) return fail(401, "token is required");
  const demoUrl = cleanUrl(body.demoUrl, "demoUrl");
  if (!demoUrl.ok) return fail(400, demoUrl.error);
  const repoUrl = body.repoUrl === undefined || body.repoUrl === "" ? undefined : cleanUrl(body.repoUrl, "repoUrl");
  if (repoUrl && !repoUrl.ok) return fail(400, repoUrl.error);
  const result = await ctx.runMutation(internal.participants.submit, {
    tokenHash,
    demoUrl: demoUrl.value,
    repoUrl: repoUrl?.value,
  });
  return result ? ok({ ready: true, position: result.position }) : fail(404, "Unknown token. Register again.");
});

const http = httpRouter();
http.route({ path: "/api/register", method: "POST", handler: register });
http.route({ path: "/api/progress", method: "POST", handler: progress });
http.route({ path: "/api/submit", method: "POST", handler: submit });
export default http;
