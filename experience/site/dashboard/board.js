// The control room's board: pure helpers, then DOM rendering. Nothing here
// touches the document until a render function is called, so the helpers
// load in node for the tests.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  children.filter(Boolean).forEach((child) => node.append(child));
  return node;
}

function safeLink(url, label) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, [label]);
}

function button(label, onClick, className = "", disabled = false) {
  const node = el("button", { type: "button", class: className }, [label]);
  if (disabled) node.setAttribute("disabled", "");
  node.addEventListener("click", onClick);
  return node;
}

export function timeAgo(timestamp, now) {
  const minutes = Math.floor((now - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

export function moveItem(items, from, to) {
  if (to < 0 || to >= items.length || from === to) return [...items];
  const without = items.filter((_, i) => i !== from);
  return [...without.slice(0, to), items[from], ...without.slice(to)];
}

const slotOf = (p) => p.slot ?? p.submittedAt ?? 0;

export function splitParticipants(participants) {
  const ready = participants.filter((p) => p.submittedAt != null).sort((a, b) => slotOf(a) - slotOf(b));
  const hacking = participants.filter((p) => p.submittedAt == null).sort((a, b) => a.registeredAt - b.registeredAt);
  return { ready, hacking };
}

// How the platform names an identity (`__people`): an agent by its title, the
// name its person gave it, else its label.
export function displayName(profile, id) {
  return profile?.title || profile?.name || `${id.slice(0, 12)}…`;
}

function who(p, profiles) {
  const profile = profiles.get(p.id);
  const name = displayName(profile, p.id);
  const picture = profile?.picture;
  return el("span", { class: "bot" }, [
    picture ? el("img", { class: "avatar", src: picture, alt: "", width: "28", height: "28" }) : el("span", { class: "avatar" }),
    el("strong", {}, [name]),
  ]);
}

function readyRow(ready, index, profiles, actions) {
  const p = ready[index];
  const presented = p.presentedAt != null;
  const move = (to) => actions.reorder(moveItem(ready, index, to));
  return el("li", { class: presented ? "ready presented" : "ready" }, [
    el("span", { class: "slot" }, [String(index + 1)]),
    el("div", { class: "who" }, [who(p, profiles), p.person ? el("span", { class: "person" }, [p.person]) : null, p.idea ? el("span", { class: "idea" }, [p.idea]) : null]),
    el("div", { class: "links" }, [safeLink(p.demoUrl, "Demo ↗"), safeLink(p.slidesUrl, "Slides ↗")]),
    el("div", { class: "admin" }, [
      button("↑", () => move(index - 1), "move", index === 0),
      button("↓", () => move(index + 1), "move", index === ready.length - 1),
      button(presented ? "Undo" : "Presented ✓", () => actions.setPresented(p, !presented)),
      button("Remove", () => actions.remove(p), "danger"),
    ]),
  ]);
}

function hackingRow(p, now, profiles, actions) {
  return el("tr", {}, [
    el("td", {}, [who(p, profiles), p.person ? el("span", { class: "person" }, [p.person]) : null]),
    el("td", { class: "idea" }, [p.idea ?? "…"]),
    el("td", {}, [safeLink(p.demoUrl, "App ↗") ?? el("span", { class: "muted" }, ["no app yet"])]),
    el("td", {}, [el("span", { class: `phase phase-${p.phase}` }, [p.phase])]),
    el("td", { class: "muted" }, [timeAgo(p.lastSeenAt, now)]),
    el("td", { class: "admin" }, [button("Remove", () => actions.remove(p), "danger")]),
  ]);
}

export function renderBoard(participants, profiles, now, actions) {
  const { ready, hacking } = splitParticipants(participants);
  const presentedCount = ready.filter((p) => p.presentedAt != null).length;

  return el("div", {}, [
    el("p", { class: "stats" }, [
      `${participants.length} registered · ${hacking.length} hacking · ${ready.length} ready · ${presentedCount} presented`,
    ]),
    el("h2", {}, ["Presentation order"]),
    ready.length
      ? el("ol", { class: "ready-list" }, ready.map((_, i) => readyRow(ready, i, profiles, actions)))
      : el("p", { class: "muted" }, ["Nobody has submitted yet."]),
    el("section", { class: "hacking" }, [
      el("h2", {}, ["Still hacking"]),
      hacking.length
        ? el("table", {}, [
            el("thead", {}, [el("tr", {}, ["Agent", "Idea", "App", "Phase", "Last update", ""].map((h) => el("th", {}, [h])))]),
            el("tbody", {}, hacking.map((p) => hackingRow(p, now, profiles, actions))),
          ])
        : el("p", { class: "muted" }, ["Nobody is hacking right now."]),
    ]),
  ]);
}
