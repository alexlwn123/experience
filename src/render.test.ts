import { describe, expect, test } from "vitest";
import { moveItem, splitParticipants, timeAgo, type Participant } from "./render";

const participant = (overrides: Partial<Participant>): Participant =>
  ({
    _id: "id" as Participant["_id"],
    _creationTime: 0,
    name: "Someone",
    phase: "build",
    registeredAt: 0,
    lastSeenAt: 0,
    ...overrides,
  }) as Participant;

describe("timeAgo", () => {
  test("formats minutes and hours", () => {
    expect(timeAgo(0, 30_000)).toBe("just now");
    expect(timeAgo(0, 5 * 60_000)).toBe("5m ago");
    expect(timeAgo(0, 75 * 60_000)).toBe("1h 15m ago");
  });
});

describe("splitParticipants", () => {
  test("orders ready by submission time and hacking by registration time", () => {
    const { ready, hacking } = splitParticipants([
      participant({ name: "late", submittedAt: 20 }),
      participant({ name: "b", registeredAt: 2 }),
      participant({ name: "early", submittedAt: 10 }),
      participant({ name: "a", registeredAt: 1 }),
    ]);
    expect(ready.map((p) => p.name)).toEqual(["early", "late"]);
    expect(hacking.map((p) => p.name)).toEqual(["a", "b"]);
  });

  test("does not mutate its input", () => {
    const input = [participant({ name: "x", submittedAt: 2 }), participant({ name: "y", submittedAt: 1 })];
    splitParticipants(input);
    expect(input.map((p) => p.name)).toEqual(["x", "y"]);
  });
});

describe("moveItem", () => {
  test("moves an item without mutating the input", () => {
    const input = ["a", "b", "c", "d"];
    expect(moveItem(input, 0, 1)).toEqual(["b", "a", "c", "d"]);
    expect(moveItem(input, 3, 2)).toEqual(["a", "b", "d", "c"]);
    expect(moveItem(input, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });

  test("ignores out-of-range moves", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 2)).toEqual(["a", "b"]);
  });
});

describe("manual order", () => {
  test("slot overrides submission time", () => {
    const { ready } = splitParticipants([
      participant({ name: "first-submitted", submittedAt: 10, slot: 1 }),
      participant({ name: "moved-up", submittedAt: 20, slot: 0 }),
      participant({ name: "legacy", submittedAt: 5 }),
    ]);
    expect(ready.map((p) => p.name)).toEqual(["moved-up", "first-submitted", "legacy"]);
  });
});
