import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { displayName, moveItem, splitParticipants, timeAgo } from "../experience/site/dashboard/board.js";

const participant = (overrides) => ({
  id: "npub1someone",
  owner: null,
  phase: "build",
  idea: null,
  demoUrl: null,
  slidesUrl: null,
  registeredAt: 0,
  lastSeenAt: 0,
  submittedAt: null,
  slot: null,
  presentedAt: null,
  ...overrides,
});

describe("timeAgo", () => {
  test("formats minutes and hours", () => {
    assert.equal(timeAgo(0, 30_000), "just now");
    assert.equal(timeAgo(0, 5 * 60_000), "5m ago");
    assert.equal(timeAgo(0, 75 * 60_000), "1h 15m ago");
  });
});

describe("splitParticipants", () => {
  test("orders ready by submission time and hacking by registration time", () => {
    const { ready, hacking } = splitParticipants([
      participant({ id: "late", submittedAt: 20 }),
      participant({ id: "b", registeredAt: 2 }),
      participant({ id: "early", submittedAt: 10 }),
      participant({ id: "a", registeredAt: 1 }),
    ]);
    assert.deepEqual(ready.map((p) => p.id), ["early", "late"]);
    assert.deepEqual(hacking.map((p) => p.id), ["a", "b"]);
  });

  test("does not mutate its input", () => {
    const input = [participant({ id: "x", submittedAt: 2 }), participant({ id: "y", submittedAt: 1 })];
    splitParticipants(input);
    assert.deepEqual(input.map((p) => p.id), ["x", "y"]);
  });

  test("a manual slot overrides submission time", () => {
    const { ready } = splitParticipants([
      participant({ id: "first-submitted", submittedAt: 10, slot: 1 }),
      participant({ id: "moved-up", submittedAt: 20, slot: 0 }),
      participant({ id: "unmoved", submittedAt: 5 }),
    ]);
    assert.deepEqual(ready.map((p) => p.id), ["moved-up", "first-submitted", "unmoved"]);
  });
});

describe("moveItem", () => {
  test("moves an item without mutating the input", () => {
    const input = ["a", "b", "c", "d"];
    assert.deepEqual(moveItem(input, 0, 1), ["b", "a", "c", "d"]);
    assert.deepEqual(moveItem(input, 3, 2), ["a", "b", "d", "c"]);
    assert.deepEqual(moveItem(input, 3, 0), ["d", "a", "b", "c"]);
    assert.deepEqual(input, ["a", "b", "c", "d"]);
  });

  test("ignores out-of-range moves", () => {
    assert.deepEqual(moveItem(["a", "b"], 0, -1), ["a", "b"]);
    assert.deepEqual(moveItem(["a", "b"], 1, 2), ["a", "b"]);
  });
});

describe("displayName", () => {
  test("prefers an agent's title, then its name", () => {
    assert.equal(displayName({ kind: "agent", title: "Juniper", name: "juniper--k3x9" }, "npub1abc"), "Juniper");
    assert.equal(displayName({ kind: "agent", name: "juniper--k3x9" }, "npub1abc"), "juniper--k3x9");
  });

  test("falls back to a short id while the profile is unknown", () => {
    assert.equal(displayName(undefined, "npub1abcdefghijklmnop"), "npub1abcdefg…");
  });
});
