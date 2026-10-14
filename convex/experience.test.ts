import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { cleanPhase, cleanText, cleanUrl, safeEqual } from "./validate";

const modules = import.meta.glob("./**/*.ts");
const ADMIN_KEY = "test-admin-key";

const setup = () => convexTest(schema, modules);
type T = ReturnType<typeof setup>;

async function post(t: T, path: string, body: unknown) {
  const response = await t.fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function registered(t: T, name = "Satoshi") {
  const { body } = await post(t, "/api/register", { name });
  return body.data.token as string;
}

beforeEach(() => vi.stubEnv("ADMIN_KEY", ADMIN_KEY));
afterEach(() => vi.unstubAllEnvs());

describe("validate", () => {
  test("cleanText trims and enforces bounds", () => {
    expect(cleanText("  hi ", "name", 5)).toEqual({ ok: true, value: "hi" });
    expect(cleanText("   ", "name", 5).ok).toBe(false);
    expect(cleanText("toolong", "name", 5).ok).toBe(false);
    expect(cleanText(42, "name", 5).ok).toBe(false);
  });

  test("cleanUrl only accepts http(s)", () => {
    expect(cleanUrl("https://x.trycloudflare.com", "demoUrl")).toEqual({
      ok: true,
      value: "https://x.trycloudflare.com/",
    });
    expect(cleanUrl("javascript:alert(1)", "demoUrl").ok).toBe(false);
    expect(cleanUrl("not a url", "demoUrl").ok).toBe(false);
  });

  test("cleanPhase accepts known phases only", () => {
    expect(cleanPhase("build")).toEqual({ ok: true, value: "build" });
    expect(cleanPhase("ready").ok).toBe(false);
  });

  test("safeEqual", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});

describe("POST /api/register", () => {
  test("returns an id and a secret token", async () => {
    const t = setup();
    const { status, body } = await post(t, "/api/register", { name: "  Team Cats " });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toMatch(/^exp_[0-9a-f]{48}$/);
    const [participant] = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(participant).toMatchObject({ name: "Team Cats", phase: "interview" });
  });

  test("rejects a missing name and malformed JSON", async () => {
    const t = setup();
    expect((await post(t, "/api/register", {})).status).toBe(400);
    expect((await post(t, "/api/register", "{nope")).status).toBe(400);
    expect((await post(t, "/api/register", ["array"])).status).toBe(400);
  });
});

describe("POST /api/progress", () => {
  test("updates phase and idea", async () => {
    const t = setup();
    const token = await registered(t);
    const { status } = await post(t, "/api/progress", { token, phase: "build", idea: "Cat fortunes" });
    expect(status).toBe(200);
    const [participant] = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(participant).toMatchObject({ phase: "build", idea: "Cat fortunes" });
  });

  test("rejects unknown tokens, missing tokens, bad phases, and empty updates", async () => {
    const t = setup();
    const token = await registered(t);
    expect((await post(t, "/api/progress", { token: "exp_nope", phase: "build" })).status).toBe(404);
    expect((await post(t, "/api/progress", { phase: "build" })).status).toBe(401);
    expect((await post(t, "/api/progress", { token, phase: "ready" })).status).toBe(400);
    expect((await post(t, "/api/progress", { token })).status).toBe(400);
  });
});

describe("POST /api/submit", () => {
  test("marks the participant ready with their presentation position", async () => {
    const t = setup();
    const first = await registered(t, "First");
    const second = await registered(t, "Second");
    const a = await post(t, "/api/submit", { token: second, demoUrl: "https://a.trycloudflare.com", repoUrl: "https://github.com/x/y" });
    const b = await post(t, "/api/submit", { token: first, demoUrl: "https://b.trycloudflare.com" });
    expect(a.body.data).toEqual({ ready: true, position: 1 });
    expect(b.body.data).toEqual({ ready: true, position: 2 });
    const list = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(list.find((p) => p.name === "Second")).toMatchObject({ phase: "ready", repoUrl: "https://github.com/x/y" });
  });

  test("submissions in the same millisecond still get distinct positions", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-13T12:00:00Z"));
    try {
      const t = setup();
      const first = await registered(t, "First");
      const second = await registered(t, "Second");
      const a = await post(t, "/api/submit", { token: first, demoUrl: "https://a.example.com" });
      const b = await post(t, "/api/submit", { token: second, demoUrl: "https://b.example.com" });
      expect([a.body.data.position, b.body.data.position]).toEqual([1, 2]);
    } finally {
      vi.useRealTimers();
    }
  });

  test("resubmitting keeps the original position and later progress can't un-ready", async () => {
    const t = setup();
    const first = await registered(t, "First");
    const second = await registered(t, "Second");
    await post(t, "/api/submit", { token: first, demoUrl: "https://old.example.com" });
    await post(t, "/api/submit", { token: second, demoUrl: "https://two.example.com" });
    const again = await post(t, "/api/submit", { token: first, demoUrl: "https://new.example.com" });
    expect(again.body.data.position).toBe(1);
    await post(t, "/api/progress", { token: first, phase: "build" });
    const list = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(list.find((p) => p.name === "First")).toMatchObject({ phase: "ready", demoUrl: "https://new.example.com/" });
  });

  test("rejects bad URLs and unknown tokens", async () => {
    const t = setup();
    const token = await registered(t);
    expect((await post(t, "/api/submit", { token, demoUrl: "javascript:alert(1)" })).status).toBe(400);
    expect((await post(t, "/api/submit", { token, demoUrl: "https://ok.com", repoUrl: "ftp://x" })).status).toBe(400);
    expect((await post(t, "/api/submit", { token: "exp_nope", demoUrl: "https://ok.com" })).status).toBe(404);
  });
});

describe("admin", () => {
  test("rejects a wrong key and never returns token hashes", async () => {
    const t = setup();
    await registered(t);
    await expect(t.query(api.participants.adminList, { key: "wrong" })).rejects.toThrow("Unauthorized");
    const [participant] = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(participant).not.toHaveProperty("tokenHash");
  });

  test("reorders the presentation list; later submissions land at the end", async () => {
    const t = setup();
    const tokens = await Promise.all(["A", "B", "C"].map((name) => registered(t, name)));
    for (const token of tokens) await post(t, "/api/submit", { token, demoUrl: "https://demo.example.com" });
    const hacker = await registered(t, "Still hacking");
    const byName = async () => {
      const list = await t.query(api.participants.adminList, { key: ADMIN_KEY });
      return Object.fromEntries(list.map((p) => [p.name, p]));
    };
    const { A, B, C } = await byName();
    const hackerId = (await byName())["Still hacking"]._id;

    await expect(
      t.mutation(api.participants.adminReorder, { key: "wrong", ids: [C._id, A._id, B._id] }),
    ).rejects.toThrow("Unauthorized");
    await t.mutation(api.participants.adminReorder, { key: ADMIN_KEY, ids: [C._id, hackerId, A._id, B._id] });

    const after = await byName();
    expect([after.C.slot, after.A.slot, after.B.slot]).toEqual([0, 1, 2]);
    expect(after["Still hacking"].slot).toBeUndefined();

    // Resubmitting keeps the manual position; a new submitter goes last.
    const resubmit = await post(t, "/api/submit", { token: tokens[0], demoUrl: "https://new.example.com" });
    expect(resubmit.body.data.position).toBe(2);
    const late = await post(t, "/api/submit", { token: hacker, demoUrl: "https://late.example.com" });
    expect(late.body.data.position).toBe(4);
  });

  test("marks presented and removes participants", async () => {
    const t = setup();
    await registered(t);
    const [participant] = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    await t.mutation(api.participants.adminSetPresented, { key: ADMIN_KEY, id: participant._id, presented: true });
    const [presented] = await t.query(api.participants.adminList, { key: ADMIN_KEY });
    expect(presented.presentedAt).toBeTypeOf("number");
    await expect(
      t.mutation(api.participants.adminRemove, { key: "wrong", id: participant._id }),
    ).rejects.toThrow("Unauthorized");
    await t.mutation(api.participants.adminRemove, { key: ADMIN_KEY, id: participant._id });
    expect(await t.query(api.participants.adminList, { key: ADMIN_KEY })).toEqual([]);
  });
});
