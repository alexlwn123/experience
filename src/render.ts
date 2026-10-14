import type { FunctionReturnType } from "convex/server";
import type { api } from "../convex/_generated/api";

export type Participant = FunctionReturnType<typeof api.participants.adminList>[number];

export type Actions = {
  setPresented: (participant: Participant, presented: boolean) => void;
  reorder: (ordered: Participant[]) => void;
  remove: (participant: Participant) => void;
};

type Child = Node | string | null | undefined | false;

export function el(tag: string, attrs: Record<string, string> = {}, children: Child[] = []): HTMLElement {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  children.filter(Boolean).forEach((child) => node.append(child as Node | string));
  return node;
}

function safeLink(url: string | undefined, label: string): Child {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, [label]);
}

function button(label: string, onClick: () => void, className = "", disabled = false): HTMLElement {
  const node = el("button", { type: "button", class: className }, [label]);
  if (disabled) node.setAttribute("disabled", "");
  node.addEventListener("click", onClick);
  return node;
}

export function timeAgo(timestamp: number, now: number): string {
  const minutes = Math.floor((now - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return [...items];
  const without = items.filter((_, i) => i !== from);
  return [...without.slice(0, to), items[from], ...without.slice(to)];
}

const slotOf = (p: Participant) => p.slot ?? p.submittedAt ?? 0;

export function splitParticipants(participants: Participant[]) {
  const ready = participants
    .filter((p) => p.submittedAt !== undefined)
    .sort((a, b) => slotOf(a) - slotOf(b));
  const hacking = participants
    .filter((p) => p.submittedAt === undefined)
    .sort((a, b) => a.registeredAt - b.registeredAt);
  return { ready, hacking };
}

function readyRow(ready: Participant[], index: number, actions: Actions): HTMLElement {
  const p = ready[index];
  const presented = p.presentedAt !== undefined;
  const move = (to: number) => actions.reorder(moveItem(ready, index, to));
  return el("li", { class: presented ? "ready presented" : "ready" }, [
    el("span", { class: "slot" }, [String(index + 1)]),
    el("div", { class: "who" }, [
      el("strong", {}, [p.name]),
      p.idea ? el("span", { class: "idea" }, [p.idea]) : null,
    ]),
    el("div", { class: "links" }, [safeLink(p.demoUrl, "Demo ↗"), safeLink(p.repoUrl, "Repo ↗")]),
    el("div", { class: "admin" }, [
      button("↑", () => move(index - 1), "move", index === 0),
      button("↓", () => move(index + 1), "move", index === ready.length - 1),
      button(presented ? "Undo" : "Presented ✓", () => actions.setPresented(p, !presented)),
      button("Remove", () => actions.remove(p), "danger"),
    ]),
  ]);
}

function hackingRow(p: Participant, now: number, actions: Actions): HTMLElement {
  return el("tr", {}, [
    el("td", {}, [p.name]),
    el("td", { class: "idea" }, [p.idea ?? "…"]),
    el("td", {}, [el("span", { class: `phase phase-${p.phase}` }, [p.phase])]),
    el("td", { class: "muted" }, [timeAgo(p.lastSeenAt, now)]),
    el("td", { class: "admin" }, [button("Remove", () => actions.remove(p), "danger")]),
  ]);
}

export function renderBoard(participants: Participant[], now: number, actions: Actions): HTMLElement {
  const { ready, hacking } = splitParticipants(participants);
  const presentedCount = ready.filter((p) => p.presentedAt !== undefined).length;

  return el("div", {}, [
    el("p", { class: "stats" }, [
      `${participants.length} registered · ${hacking.length} hacking · ${ready.length} ready · ${presentedCount} presented`,
    ]),
    el("h2", {}, ["Presentation order"]),
    ready.length
      ? el("ol", { class: "ready-list" }, ready.map((_, i) => readyRow(ready, i, actions)))
      : el("p", { class: "muted" }, ["Nobody has submitted yet."]),
    el("section", { class: "hacking" }, [
      el("h2", {}, ["Still hacking"]),
      hacking.length
        ? el("table", {}, [
            el("thead", {}, [
              el("tr", {}, ["Name", "Idea", "Phase", "Last update", ""].map((h) => el("th", {}, [h]))),
            ]),
            el("tbody", {}, hacking.map((p) => hackingRow(p, now, actions))),
          ])
        : el("p", { class: "muted" }, ["Nobody is hacking right now."]),
    ]),
  ]);
}
