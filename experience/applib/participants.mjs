// The board: who is hacking, what they're building, and the order they
// present in. Each function takes the app's SQL handle (`ctx.storage.sql`),
// so the same code runs in the fragment and in the tests.
import { LIMITS, READY, cleanPhase, cleanText, cleanUrl, refuse } from "./rules.mjs";

const COLUMNS = `id, owner, phase, idea, demo_url, slides_url, registered_at, last_seen_at, submitted_at, slot, presented_at`;

export function createSchema(sql) {
  sql.exec(`CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    owner TEXT,
    phase TEXT NOT NULL,
    idea TEXT,
    demo_url TEXT,
    slides_url TEXT,
    registered_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    submitted_at INTEGER,
    slot REAL,
    presented_at INTEGER
  )`);
}

const toParticipant = (row) => ({
  id: row.id,
  owner: row.owner,
  phase: row.phase,
  idea: row.idea,
  demoUrl: row.demo_url,
  slidesUrl: row.slides_url,
  registeredAt: row.registered_at,
  lastSeenAt: row.last_seen_at,
  submittedAt: row.submitted_at,
  // The presentation order: the submit time at first, 0..n once Alex reorders.
  slot: row.slot,
  presentedAt: row.presented_at,
});

function find(sql, id) {
  const [row] = sql.exec(`SELECT ${COLUMNS} FROM participants WHERE id = ?`, id).toArray();
  return row ? toParticipant(row) : null;
}

export function list(sql) {
  return sql.exec(`SELECT ${COLUMNS} FROM participants`).toArray().map(toParticipant);
}

function submitted(sql) {
  return sql.exec(`SELECT id, slot FROM participants WHERE submitted_at IS NOT NULL`).toArray();
}

function positionOf(sql, participant) {
  if (participant.submittedAt === null) return null;
  return submitted(sql).filter((p) => p.id !== participant.id && p.slot < participant.slot).length + 1;
}

const view = (sql, p) => ({
  phase: p.phase,
  idea: p.idea,
  demoUrl: p.demoUrl,
  slidesUrl: p.slidesUrl,
  position: positionOf(sql, p),
});

// What the caller's agent sees of its own entry, or null when it has none.
export function entryOf(sql, id) {
  const participant = find(sql, id);
  return participant ? view(sql, participant) : null;
}

// The caller's entry, made in `interview` on first sight; else just marked seen.
function ensure(sql, { id, owner }, now) {
  const existing = find(sql, id);
  if (existing) {
    sql.exec(`UPDATE participants SET owner = ?, last_seen_at = ? WHERE id = ?`, owner, now, id);
    return { ...existing, owner, lastSeenAt: now };
  }
  const { count } = sql.exec(`SELECT COUNT(*) AS count FROM participants`).one();
  if (count >= LIMITS.participants) refuse("The board is full. Find Alex.");
  sql.exec(
    `INSERT INTO participants (id, owner, phase, registered_at, last_seen_at) VALUES (?, ?, 'interview', ?, ?)`,
    id,
    owner,
    now,
    now,
  );
  return find(sql, id);
}

export function register(sql, who, now) {
  return view(sql, ensure(sql, who, now));
}

export function progress(sql, who, input, now) {
  const phase = input.phase === undefined ? null : cleanPhase(input.phase);
  const idea = input.idea === undefined ? null : cleanText(input.idea, "idea", LIMITS.idea);
  if (phase === null && idea === null) refuse("Send at least one of: phase, idea");
  const participant = ensure(sql, who, now);
  const next = {
    ...participant,
    phase: phase !== null && participant.phase !== READY ? phase : participant.phase,
    idea: idea ?? participant.idea,
  };
  sql.exec(`UPDATE participants SET phase = ?, idea = ? WHERE id = ?`, next.phase, next.idea, who.id);
  return view(sql, next);
}

export function submit(sql, who, input, now) {
  const demoUrl = cleanUrl(input.demoUrl, "demoUrl");
  const slidesUrl = input.slidesUrl === undefined ? null : cleanUrl(input.slidesUrl, "slidesUrl");
  const participant = ensure(sql, who, now);
  const others = submitted(sql).filter((p) => p.id !== who.id);
  // A first submit goes strictly last (even within the same millisecond);
  // a resubmit keeps its place.
  const lastSlot = Math.max(-1, ...others.map((p) => p.slot));
  const firstTime = participant.submittedAt === null;
  const slot = firstTime ? Math.max(now, lastSlot + 1) : participant.slot;
  // Slides belong to a demo: a new demo URL drops the old slides, unless new ones come with it.
  const keptSlides = participant.demoUrl === demoUrl ? participant.slidesUrl : null;
  sql.exec(
    `UPDATE participants SET phase = ?, demo_url = ?, slides_url = ?, submitted_at = ?, slot = ? WHERE id = ?`,
    READY,
    demoUrl,
    slidesUrl ?? keptSlides,
    firstTime ? now : participant.submittedAt,
    slot,
    who.id,
  );
  return { ready: true, position: others.filter((p) => p.slot < slot).length + 1 };
}

// ---- Alex's dashboard (editors) ----

export function setPresented(sql, { id, presented }, now) {
  sql.exec(`UPDATE participants SET presented_at = ? WHERE id = ?`, presented ? now : null, id);
  return { presented };
}

// Rewrites the presentation order. Ids that aren't submitted are ignored; anyone who
// submits afterwards keeps a timestamp slot, so they land at the end.
export function reorder(sql, { ids }) {
  const ready = new Set(submitted(sql).map((p) => p.id));
  const ordered = ids.filter((id) => ready.has(id));
  ordered.forEach((id, index) => sql.exec(`UPDATE participants SET slot = ? WHERE id = ?`, index, id));
  return { ordered: ordered.length };
}

export function remove(sql, { id }) {
  const removed = find(sql, id) !== null;
  sql.exec(`DELETE FROM participants WHERE id = ?`, id);
  return { removed };
}
