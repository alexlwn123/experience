// The control room. Whoever may edit this fragment (Alex and co-hosts, added
// in its share sheet) sees the board live: `board` re-runs after every
// check-in. Each agent shows by the name and picture the platform knows it by.
import * as fragment from "/__fragment.js";
import { renderBoard } from "/dashboard/board.js";

const REFRESH_MS = 30_000; // "last update" times, and names or pictures changed mid-event
const PEOPLE_BATCH = 64; // the most ids one `__people` request takes
const HELLO_WAIT_MS = 15_000; // the live socket's hello says who we are; past this, say so

const gate = document.getElementById("gate");
const gateMessage = document.getElementById("gate-message");
const signIn = document.getElementById("sign-in");
const errorLine = document.getElementById("error");
const boardNode = document.getElementById("board");
const projector = document.getElementById("projector");

let participants = [];
let profiles = new Map();

const report = (message) => (errorLine.textContent = message);

function shut(message, offerSignIn) {
  gateMessage.textContent = message;
  signIn.hidden = !offerSignIn;
  gate.hidden = false;
  boardNode.replaceChildren();
}

const chunks = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

async function lookUp(batch) {
  const query = batch.map((id) => `id=${encodeURIComponent(id)}`).join("&");
  const response = await fetch(`/__people?${query}`);
  if (!response.ok) throw new Error(`__people answered ${response.status}`);
  return (await response.json()).profiles;
}

// Names and pictures: the ids not looked up yet, or every id when refreshing.
// A batch that fails is asked again next time; the others are kept.
async function learnProfiles(ids, { refresh = false } = {}) {
  const wanted = refresh ? ids : ids.filter((id) => !profiles.has(id));
  if (wanted.length === 0) return;
  const answers = await Promise.allSettled(chunks(wanted, PEOPLE_BATCH).map(lookUp));
  const found = answers.flatMap((a) => (a.status === "fulfilled" ? Object.entries(a.value) : []));
  profiles = new Map([...profiles, ...found]);
  if (answers.some((a) => a.status === "rejected")) report("Couldn't load some agent names. Trying again shortly.");
}

const actions = {
  setPresented: (p, presented) =>
    fragment.call("set_presented", { id: p.id, presented }).catch(() => report("Couldn't update. Check your connection.")),
  reorder: (ordered) =>
    fragment.call("reorder", { ids: ordered.map((p) => p.id) }).catch(() => report("Couldn't reorder. Check your connection.")),
  remove: (p) => {
    const name = profiles.get(p.id)?.title || profiles.get(p.id)?.name || "this entry";
    if (!window.confirm(`Remove ${name}? Their agent will need to register again.`)) return;
    fragment.call("remove", { id: p.id }).catch(() => report("Couldn't remove. Check your connection."));
  },
};

function draw() {
  boardNode.replaceChildren(renderBoard(participants, profiles, Date.now(), actions));
}

const helloOrTimeout = () =>
  Promise.race([
    fragment.me(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("no hello")), HELLO_WAIT_MS)),
  ]);

async function open() {
  const { principal, role } = await helloOrTimeout();
  if (role !== "editor" && role !== "owner") {
    const signedOut = principal.startsWith("anon:");
    return shut(
      signedOut ? "The control room is for Alex and co-hosts. Sign in to open it." : "Ask Alex to add you as an editor of this fragment.",
      signedOut,
    );
  }
  fragment.live(
    "board",
    {},
    (result) => {
      participants = result.participants;
      report("");
      draw();
      learnProfiles(participants.map((p) => p.id)).then(draw);
    },
    (error) =>
      error.status === 401 || error.status === 403
        ? shut("You can no longer open the control room. Reload to sign in again.", false)
        : report("Lost the board. Reconnecting…"),
  );
  setInterval(() => {
    draw();
    learnProfiles(participants.map((p) => p.id), { refresh: true }).then(draw);
  }, REFRESH_MS);
}

projector.addEventListener("click", () => document.body.classList.toggle("projector"));

// The socket closed for good: access revoked (4003) or the fragment deleted (4004).
fragment.closed(() => shut("The control room closed. Reload to try again.", false));

open().catch(() => shut("Couldn't reach the board. Reload to try again.", false));
