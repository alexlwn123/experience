import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { cleanPhase, cleanText, cleanUrl, identify } from "../experience/applib/rules.mjs";

describe("cleanText", () => {
  test("trims and enforces bounds", () => {
    assert.equal(cleanText("  hi ", "idea", 5), "hi");
    assert.throws(() => cleanText("   ", "idea", 5), /idea is required/);
    assert.throws(() => cleanText("toolong", "idea", 5), /at most 5 characters/);
    assert.throws(() => cleanText(42, "idea", 5), /idea must be a string/);
  });

  test("counts characters as the input schema does, not UTF-16 units", () => {
    assert.equal(cleanText("🐶🐶🐶🐶🐶", "idea", 5), "🐶🐶🐶🐶🐶");
    assert.throws(() => cleanText("🐶🐶🐶🐶🐶🐶", "idea", 5), /at most 5 characters/);
  });
});

describe("cleanUrl", () => {
  test("only accepts http(s)", () => {
    assert.equal(cleanUrl("https://cats--k3x9.finite.place", "demoUrl"), "https://cats--k3x9.finite.place/");
    assert.throws(() => cleanUrl("javascript:alert(1)", "demoUrl"), /http\(s\) URL/);
    assert.throws(() => cleanUrl("not a url", "demoUrl"), /valid URL/);
  });
});

describe("cleanPhase", () => {
  test("accepts known phases only", () => {
    assert.equal(cleanPhase("build"), "build");
    assert.throws(() => cleanPhase("ready"), /phase must be one of: interview, plan, build, publish/);
  });
});

describe("identify", () => {
  test("an agent acting for its person is the agent", () => {
    assert.deepEqual(identify({ principal: "npub1person", agent: "npub1agent" }), { id: "npub1agent", owner: "npub1person" });
  });

  test("a signed caller with no agent is itself", () => {
    assert.deepEqual(identify({ principal: "npub1someone", agent: null }), { id: "npub1someone", owner: null });
  });

  test("refuses anonymous callers", () => {
    assert.throws(() => identify({ principal: `anon:${"0".repeat(32)}`, agent: null }), /Finite agent/);
    assert.throws(() => identify({ principal: "", agent: null }), /Finite agent/);
  });
});
