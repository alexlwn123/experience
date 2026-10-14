import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { renderBoard, type Actions, type Participant } from "./render";

declare const CONVEX_URL: string; // injected at build time by esbuild

const KEY_STORAGE = "experience-admin-key";
const REFRESH_MS = 30_000;

const client = new ConvexClient(CONVEX_URL);
const gate = document.getElementById("gate") as HTMLFormElement;
const keyInput = document.getElementById("key") as HTMLInputElement;
const gateError = document.getElementById("gate-error") as HTMLElement;
const board = document.getElementById("board") as HTMLElement;
const projector = document.getElementById("projector") as HTMLButtonElement;

let unsubscribe: (() => void) | null = null;
let latest: Participant[] = [];
let currentKey: string | null = null;

function report(message: string) {
  gateError.textContent = message;
}

function actionsFor(key: string): Actions {
  return {
    setPresented: (p, presented) =>
      client
        .mutation(api.participants.adminSetPresented, { key, id: p._id, presented })
        .catch(() => report("Couldn't update. Check your connection.")),
    reorder: (ordered) =>
      client
        .mutation(api.participants.adminReorder, { key, ids: ordered.map((p) => p._id) })
        .catch(() => report("Couldn't reorder. Check your connection.")),
    remove: (p) => {
      if (!window.confirm(`Remove ${p.name}? Their agent will need to register again.`)) return;
      client
        .mutation(api.participants.adminRemove, { key, id: p._id })
        .catch(() => report("Couldn't remove. Check your connection."));
    },
  };
}

// Looks for slides at each submitted demo's /slides route; found ones arrive via the live list.
// A failed check is simply retried on the next refresh.
function checkSlides(key: string) {
  client.action(api.slides.adminCheckSlides, { key }).catch(() => undefined);
}

function draw(key: string) {
  board.replaceChildren(renderBoard(latest, Date.now(), actionsFor(key)));
}

function signOut(message: string) {
  unsubscribe?.();
  unsubscribe = null;
  currentKey = null;
  localStorage.removeItem(KEY_STORAGE);
  board.replaceChildren();
  gate.hidden = false;
  report(message);
}

function connect(key: string) {
  unsubscribe?.();
  currentKey = key;
  report("");
  unsubscribe = client.onUpdate(
    api.participants.adminList,
    { key },
    (participants) => {
      localStorage.setItem(KEY_STORAGE, key);
      const firstUpdate = !gate.hidden;
      gate.hidden = true;
      latest = participants;
      draw(key);
      if (firstUpdate) checkSlides(key);
    },
    () => signOut("That key didn't work."),
  );
}

// Keeps the "last update" column fresh between live updates, and picks up newly added slides.
setInterval(() => {
  if (!currentKey || !gate.hidden) return;
  draw(currentKey);
  checkSlides(currentKey);
}, REFRESH_MS);

gate.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = keyInput.value.trim();
  if (key) connect(key);
});

projector.addEventListener("click", () => document.body.classList.toggle("projector"));

const saved = localStorage.getItem(KEY_STORAGE);
if (saved) connect(saved);
