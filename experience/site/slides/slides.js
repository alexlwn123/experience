(() => {
  const STAGE_WIDTH = 1600;
  const STAGE_HEIGHT = 900;
  const IDLE_MS = 2000;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const FALL_TILT = [-14, 9, -6, 16, -10, 7, -12, 11]; // degrees each falling letter tips over

  const stage = document.getElementById("stage");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const pad = (n) => String(n).padStart(2, "0");

  // ---- Decorations ----

  function svgNode(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function buildSunburst(svg) {
    const rays = Array.from({ length: 72 }, (_, i) => {
      const angle = (i / 72) * Math.PI * 2;
      const inner = i % 2 === 0 ? 150 : 230;
      return svgNode("line", {
        x1: Math.cos(angle) * inner,
        y1: Math.sin(angle) * inner,
        x2: Math.cos(angle) * 500,
        y2: Math.sin(angle) * 500,
        stroke: "currentColor",
        "stroke-width": i % 2 === 0 ? 1.4 : 0.7,
      });
    });
    const rings = [110, 190, 330, 460].map((r, i) =>
      svgNode("circle", {
        r,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": i === 0 ? 2 : 1,
        "stroke-dasharray": i % 2 === 0 ? "none" : "2 10",
      }),
    );
    svg.append(...rays, ...rings);
  }

  function splitLetters(node) {
    const text = node.textContent.trim();
    const base = `${node.dataset.base ?? 300}ms`;
    node.setAttribute("aria-label", text);
    node.style.setProperty("--base", base);
    const letters = [...text].map((char, i) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--i", String(i));
      if ("fall" in node.dataset) span.style.setProperty("--r", `${FALL_TILT[i % FALL_TILT.length]}deg`);
      span.textContent = char === " " ? " " : char;
      return span;
    });
    node.replaceChildren(...letters);
  }

  function splitWords(node) {
    node.style.setProperty("--base", `${node.dataset.base ?? 400}ms`);
    const words = node.textContent.trim().split(/\s+/);
    const parts = words.flatMap((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--i", String(i));
      span.textContent = word;
      return i === 0 ? [span] : [document.createTextNode(" "), span];
    });
    node.replaceChildren(...parts);
  }

  const sun = document.getElementById("sun");
  buildSunburst(sun);
  document.querySelector(".final-sun").append(sun.cloneNode(true));
  document.querySelectorAll("[data-split]").forEach(splitLetters);
  document.querySelectorAll("[data-words]").forEach(splitWords);

  // ---- Scale the 16:9 stage to the screen ----

  function fit() {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    stage.style.setProperty("--scale", String(scale));
  }

  // ---- Navigation ----

  let current = -1;

  function show(target) {
    const next = Math.max(0, Math.min(slides.length - 1, target));
    if (next === current) return;
    current = next;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === next);
      slide.classList.toggle("is-past", i < next);
      slide.setAttribute("aria-hidden", String(i !== next));
    });
    document.body.dataset.slide = String(next + 1);
    counter.textContent = `${pad(next + 1)} / ${pad(slides.length)}`;
    progress.style.setProperty("--progress", String((next + 1) / slides.length));
    history.replaceState(null, "", `#${next + 1}`);
  }

  const fromHash = () => (Number.parseInt(location.hash.slice(1), 10) || 1) - 1;

  function toggleFullscreen() {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    request.catch(() => {}); // Fullscreen can be refused (e.g. iframe); the deck still works.
  }

  const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"]);
  const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p"]);

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (NEXT_KEYS.has(event.key)) show(current + 1);
    else if (PREV_KEYS.has(event.key)) show(current - 1);
    else if (event.key === "Home") show(0);
    else if (event.key === "End") show(slides.length - 1);
    else if (event.key === "f" || event.key === "F") toggleFullscreen();
    else return;
    event.preventDefault();
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    show(event.clientX > window.innerWidth * 0.3 ? current + 1 : current - 1);
  });

  let touchStartX = null;
  document.addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
    touchStartX = null;
  });

  let idleTimer = 0;
  document.addEventListener("mousemove", () => {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add("idle"), IDLE_MS);
  });

  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => show(fromHash()));

  fit();
  show(fromHash());
})();
