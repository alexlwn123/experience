import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as board from "../experience/applib/participants.mjs";
import { LIMITS } from "../experience/applib/rules.mjs";
import { memorySql } from "./sql.mjs";

const agent = (n) => ({ id: `npub1agent${n}`, owner: `npub1person${n}` });

function fresh() {
  const sql = memorySql();
  board.createSchema(sql);
  return sql;
}

const byId = (sql) => Object.fromEntries(board.list(sql).map((p) => [p.id, p]));

describe("createSchema", () => {
  test("can run again on an existing database", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    board.createSchema(sql);
    assert.equal(board.list(sql).length, 1);
  });
});

describe("register", () => {
  test("adds the caller in interview", () => {
    const sql = fresh();
    const entry = board.register(sql, agent(1), 1000);
    assert.deepEqual(entry, { phase: "interview", idea: null, person: null, demoUrl: null, slidesUrl: null, position: null });
    assert.deepEqual(byId(sql).npub1agent1, {
      id: "npub1agent1",
      owner: "npub1person1",
      phase: "interview",
      idea: null,
      person: null,
      demoUrl: null,
      slidesUrl: null,
      registeredAt: 1000,
      lastSeenAt: 1000,
      submittedAt: null,
      slot: null,
      presentedAt: null,
    });
  });

  test("registering again keeps the entry and only marks it seen", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    board.progress(sql, agent(1), { phase: "build", idea: "Cat fortunes" }, 2000);
    const again = board.register(sql, agent(1), 3000);
    assert.equal(again.phase, "build");
    assert.equal(again.idea, "Cat fortunes");
    assert.equal(board.list(sql).length, 1);
    assert.equal(byId(sql).npub1agent1.lastSeenAt, 3000);
    assert.equal(byId(sql).npub1agent1.registeredAt, 1000);
  });

  test("refuses newcomers once the board is full, but not people already on it", () => {
    const sql = fresh();
    for (let n = 0; n < LIMITS.participants; n++) board.register(sql, agent(n), 1000);
    assert.throws(() => board.register(sql, agent("late"), 2000), /board is full/);
    assert.equal(board.register(sql, agent(0), 2000).phase, "interview");
  });
});

describe("progress", () => {
  test("updates phase and idea", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    const entry = board.progress(sql, agent(1), { phase: "build", idea: "  Cat fortunes " }, 2000);
    assert.equal(entry.phase, "build");
    assert.equal(entry.idea, "Cat fortunes");
    assert.equal(byId(sql).npub1agent1.lastSeenAt, 2000);
  });

  test("an idea alone keeps the phase", () => {
    const sql = fresh();
    board.progress(sql, agent(1), { phase: "plan" }, 1000);
    assert.equal(board.progress(sql, agent(1), { idea: "Dog radio" }, 2000).phase, "plan");
  });

  test("registers a caller it has not seen yet", () => {
    const sql = fresh();
    assert.equal(board.progress(sql, agent(1), { phase: "build" }, 1000).phase, "build");
    assert.equal(byId(sql).npub1agent1.registeredAt, 1000);
  });

  test("refuses unknown phases, long ideas, and empty updates", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    assert.throws(() => board.progress(sql, agent(1), { phase: "ready" }, 2000), /phase must be one of/);
    assert.throws(() => board.progress(sql, agent(1), { idea: "x".repeat(LIMITS.idea + 1) }, 2000), /at most/);
    assert.throws(() => board.progress(sql, agent(1), {}, 2000), /at least one of: phase, idea, person, demoUrl/);
    assert.throws(() => board.progress(sql, agent(1), { person: "x".repeat(LIMITS.person + 1) }, 2000), /at most/);
    assert.throws(() => board.progress(sql, agent(1), { demoUrl: "not a url" }, 2000), /valid URL/);
  });

  test("records the person's name and the app's link before submit", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    const entry = board.progress(sql, agent(1), { person: " Sam ", demoUrl: "https://app--k3x9.finite.place/" }, 2000);
    assert.equal(entry.person, "Sam");
    assert.equal(entry.demoUrl, "https://app--k3x9.finite.place/");
    assert.equal(entry.position, null);
    assert.equal(byId(sql).npub1agent1.submittedAt, null);
    assert.equal(board.progress(sql, agent(1), { phase: "build" }, 3000).demoUrl, "https://app--k3x9.finite.place/");
  });

  test("a new app link drops slides that belonged to the old one", () => {
    const sql = fresh();
    board.submit(sql, agent(1), { demoUrl: "https://one.example.com", slidesUrl: "https://one.example.com/slides/" }, 1000);
    assert.equal(board.progress(sql, agent(1), { demoUrl: "https://one.example.com" }, 2000).slidesUrl, "https://one.example.com/slides/");
    assert.equal(board.progress(sql, agent(1), { demoUrl: "https://two.example.com" }, 3000).slidesUrl, null);
  });

  test("a submitted entry stays ready", () => {
    const sql = fresh();
    board.submit(sql, agent(1), { demoUrl: "https://one.example.com" }, 1000);
    assert.equal(board.progress(sql, agent(1), { phase: "build" }, 2000).phase, "ready");
  });
});

describe("submit", () => {
  test("marks the entry ready with its presentation position", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    board.register(sql, agent(2), 1000);
    assert.deepEqual(board.submit(sql, agent(2), { demoUrl: "https://two.example.com" }, 2000), { ready: true, position: 1 });
    assert.deepEqual(board.submit(sql, agent(1), { demoUrl: "https://one.example.com" }, 3000), { ready: true, position: 2 });
    assert.equal(byId(sql).npub1agent2.phase, "ready");
    assert.equal(byId(sql).npub1agent2.demoUrl, "https://two.example.com/");
    assert.equal(board.entryOf(sql, "npub1agent1").position, 2);
  });

  test("submissions in the same millisecond still get distinct positions", () => {
    const sql = fresh();
    const a = board.submit(sql, agent(1), { demoUrl: "https://a.example.com" }, 5000);
    const b = board.submit(sql, agent(2), { demoUrl: "https://b.example.com" }, 5000);
    assert.deepEqual([a.position, b.position], [1, 2]);
  });

  test("resubmitting keeps the original position and updates the links", () => {
    const sql = fresh();
    board.submit(sql, agent(1), { demoUrl: "https://old.example.com" }, 1000);
    board.submit(sql, agent(2), { demoUrl: "https://two.example.com" }, 2000);
    assert.equal(board.submit(sql, agent(1), { demoUrl: "https://new.example.com" }, 3000).position, 1);
    assert.equal(byId(sql).npub1agent1.demoUrl, "https://new.example.com/");
    assert.equal(byId(sql).npub1agent1.submittedAt, 1000);
  });

  test("slides stay with their demo, and go when the demo moves", () => {
    const sql = fresh();
    board.submit(sql, agent(1), { demoUrl: "https://a.example.com" }, 1000);
    board.submit(sql, agent(1), { demoUrl: "https://a.example.com", slidesUrl: "https://a.example.com/slides" }, 2000);
    assert.equal(byId(sql).npub1agent1.slidesUrl, "https://a.example.com/slides");
    board.submit(sql, agent(1), { demoUrl: "https://a.example.com" }, 3000);
    assert.equal(byId(sql).npub1agent1.slidesUrl, "https://a.example.com/slides");
    board.submit(sql, agent(1), { demoUrl: "https://b.example.com" }, 4000);
    assert.equal(byId(sql).npub1agent1.slidesUrl, null);
  });

  test("refuses bad URLs", () => {
    const sql = fresh();
    assert.throws(() => board.submit(sql, agent(1), { demoUrl: "javascript:alert(1)" }, 1000), /http\(s\) URL/);
    assert.throws(() => board.submit(sql, agent(1), { demoUrl: "https://ok.com", slidesUrl: "ftp://x" }, 1000), /http\(s\) URL/);
    assert.equal(board.list(sql).length, 0);
  });
});

describe("entryOf", () => {
  test("answers null for someone not on the board", () => {
    assert.equal(board.entryOf(fresh(), "npub1nobody"), null);
  });
});

describe("admin", () => {
  test("reorders the presentation list; later submissions land at the end", () => {
    const sql = fresh();
    ["a", "b", "c"].forEach((n, i) => board.submit(sql, agent(n), { demoUrl: "https://demo.example.com" }, 1000 + i));
    board.register(sql, agent("hacker"), 1000);

    board.reorder(sql, { ids: ["npub1agentc", "npub1agenthacker", "npub1agenta", "npub1agentb", "npub1agentnobody"] });
    const after = byId(sql);
    assert.deepEqual([after.npub1agentc.slot, after.npub1agenta.slot, after.npub1agentb.slot], [0, 1, 2]);
    assert.equal(after.npub1agenthacker.slot, null);

    // Resubmitting keeps the manual position; a new submitter goes last.
    assert.equal(board.submit(sql, agent("a"), { demoUrl: "https://new.example.com" }, 5000).position, 2);
    assert.equal(board.submit(sql, agent("hacker"), { demoUrl: "https://late.example.com" }, 5000).position, 4);
  });

  test("marks presented and back", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    board.setPresented(sql, { id: "npub1agent1", presented: true }, 2000);
    assert.equal(byId(sql).npub1agent1.presentedAt, 2000);
    board.setPresented(sql, { id: "npub1agent1", presented: false }, 3000);
    assert.equal(byId(sql).npub1agent1.presentedAt, null);
  });

  test("removes an entry", () => {
    const sql = fresh();
    board.register(sql, agent(1), 1000);
    assert.deepEqual(board.remove(sql, { id: "npub1agent1" }), { removed: true });
    assert.deepEqual(board.remove(sql, { id: "npub1agent1" }), { removed: false });
    assert.deepEqual(board.list(sql), []);
  });
});
