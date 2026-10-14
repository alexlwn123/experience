import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { detectSlides } from "./slides";

const modules = import.meta.glob("./**/*.ts");
const ADMIN_KEY = "test-admin-key";

type Route = { status?: number; type?: string; body?: string };

// A fake web: each host maps paths to responses; `*` is the host's catch-all.
const web = (hosts: Record<string, Record<string, Route>>) =>
  (async (input: RequestInfo | URL) => {
    const { host, pathname } = new URL(String(input));
    const routes = hosts[host] ?? {};
    const route = routes[pathname] ?? routes["*"];
    if (!route) return new Response("Not found", { status: 404 });
    return new Response(route.body ?? "", {
      status: route.status ?? 200,
      headers: { "content-type": route.type ?? "text/html; charset=utf-8" },
    });
  }) as typeof fetch;

describe("detectSlides", () => {
  test("finds slides at the site root's /slides route", async () => {
    const fetcher = web({ "x.example.com": { "/slides": { body: "<h1>Slides</h1>" } } });
    expect(await detectSlides("https://x.example.com/app/", fetcher)).toBe("https://x.example.com/slides");
  });

  test("no slides when the route is missing, not HTML, or the site is down", async () => {
    expect(await detectSlides("https://x.example.com/", web({}))).toBeNull();
    const json = web({ "x.example.com": { "/slides": { type: "application/json", body: "{}" } } });
    expect(await detectSlides("https://x.example.com/", json)).toBeNull();
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    expect(await detectSlides("https://x.example.com/", down)).toBeNull();
  });

  test("ignores catch-all routes that serve the same page for every path", async () => {
    const spa = web({ "x.example.com": { "*": { body: "<div id=app></div>" } } });
    expect(await detectSlides("https://x.example.com/", spa)).toBeNull();
    const spaWithSlides = web({
      "x.example.com": { "*": { body: "<div id=app></div>" }, "/slides": { body: "<h1>Slides</h1>" } },
    });
    expect(await detectSlides("https://x.example.com/", spaWithSlides)).toBe("https://x.example.com/slides");
  });
});

describe("adminCheckSlides", () => {
  const setup = () => convexTest(schema, modules);

  type T = ReturnType<typeof setup>;

  const post = async (t: T, path: string, body: unknown) =>
    await (
      await t.fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
    ).json();

  async function submitted(t: T, name: string, demoUrl: string) {
    const token = (await post(t, "/api/register", { name })).data.token as string;
    await post(t, "/api/submit", { token, demoUrl });
    return token;
  }

  beforeEach(() => {
    vi.stubEnv("ADMIN_KEY", ADMIN_KEY);
    vi.stubGlobal("fetch", web({ "a.example.com": { "/slides": { body: "<h1>Slides</h1>" } } }));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("saves slides for ready participants; a new demo URL clears them", async () => {
    const t = setup();
    const withSlides = await submitted(t, "With slides", "https://a.example.com");
    await submitted(t, "No slides", "https://b.example.com");

    await t.action(api.slides.adminCheckSlides, { key: ADMIN_KEY });
    const byName = async () =>
      Object.fromEntries((await t.query(api.participants.adminList, { key: ADMIN_KEY })).map((p) => [p.name, p]));
    const found = await byName();
    expect(found["With slides"].slidesUrl).toBe("https://a.example.com/slides");
    expect(found["No slides"].slidesUrl).toBeUndefined();

    await post(t, "/api/submit", { token: withSlides, demoUrl: "https://c.example.com" });
    expect((await byName())["With slides"].slidesUrl).toBeUndefined();
  });

  test("rejects a wrong key", async () => {
    const t = setup();
    await expect(t.action(api.slides.adminCheckSlides, { key: "wrong" })).rejects.toThrow("Unauthorized");
  });
});
