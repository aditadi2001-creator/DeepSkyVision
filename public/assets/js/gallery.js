import { loadJSON, el } from "./data.js";
import { paintSky } from "./skyart.js";

const ratioNum = (r) => {
  const [a, b] = String(r || "4 / 3").split("/").map(Number);
  const v = a / (b || 1);
  return Number.isFinite(v) && v > 0 ? v : 4 / 3;
};

// Paint sample canvases only when they scroll into view.
const io = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { io.unobserve(en.target); en.target._paint?.(); }
    }, { rootMargin: "300px" })
  : null;

function media(item, width, lazy = true) {
  if (item.src || item.thumb) {
    return el("img", { src: lazy ? item.thumb || item.src : item.src, alt: `${item.title}${item.target && !item.sample ? `, ${item.target}` : ""}`, loading: lazy ? "lazy" : null, decoding: "async" });
  }
  const r = ratioNum(item.ratio), h = Math.round(width / r);
  const c = el("canvas", { role: "img", "aria-label": `${item.title} (sample artwork)`, width, height: h });
  const paint = () => paintSky(c, { ...item.sample, width, height: h });
  if (lazy && io) { c._paint = paint; io.observe(c); } else paint();
  return c;
}

function tile(item, onOpen) {
  const btn = el("button", { class: "tile-btn", type: "button", "aria-label": `Open ${item.title}` },
    el("div", { class: "tile-media", style: `--ratio:${item.ratio || "4 / 3"}` }, media(item, 560)),
    item.sample ? el("span", { class: "badge" }, "Sample frame") : null,
    el("span", { class: "tile-cap" }, el("strong", {}, item.title), el("span", {}, [item.target && !item.sample ? item.target : null, item.category].filter(Boolean).join(" · "))));
  btn.addEventListener("click", () => onOpen(item));
  return el("li", { class: "tile" }, btn);
}

/* ---------- Lightbox ---------- */
const ICON = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
};
let box, stage, info, list = [], idx = 0;

function ensureBox() {
  if (box) return;
  const mk = (cls, label, svg, fn) => {
    const b = el("button", { class: `lb-btn ${cls}`, type: "button", "aria-label": label });
    b.innerHTML = svg; b.addEventListener("click", fn); return b;
  };
  stage = el("div", { class: "lb-stage" });
  info = el("aside", { class: "lb-info", "aria-live": "polite" });
  box = el("dialog", { class: "lightbox", "aria-label": "Image viewer" });
  stage.append(mk("lb-prev", "Previous image", ICON.prev, () => go(-1)), mk("lb-next", "Next image", ICON.next, () => go(1)));
  box.append(stage, info, mk("lb-close", "Close", ICON.close, () => box.close()));
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });
  box.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
    stage.querySelector("canvas, img")?.remove();
  });
  document.body.append(box);
}

function show() {
  const item = list[idx];
  stage.querySelector("canvas, img")?.remove();
  const m = media(item, 1400, false);
  stage.prepend(m);
  const facts = [["Target", item.sample ? null : item.target], ["Captured", item.date], ...Object.entries(item.acquisition || {})].filter(([, v]) => v);
  info.replaceChildren(
    el("span", { class: "tag" }, item.sample ? `Sample frame · ${item.category}` : item.category),
    el("h2", {}, item.title),
    item.description ? el("p", {}, item.description) : null,
    facts.length ? el("dl", { class: "facts" }, facts.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])) : null);
  history.replaceState(null, "", `#${item.id}`);
  const multi = list.length > 1;
  box.querySelector(".lb-prev").hidden = box.querySelector(".lb-next").hidden = !multi;
}

function go(d) { idx = (idx + d + list.length) % list.length; show(); }

function openBox(items, item) {
  ensureBox();
  list = items; idx = Math.max(0, items.indexOf(item));
  show();
  if (!box.open) box.showModal();
}

/* ---------- Pages ---------- */
export async function initGallery() {
  const mount = document.querySelector("[data-gallery]");
  const filters = document.querySelector("[data-filters]");
  if (!mount) return;
  const { items, categories } = await loadJSON("gallery");
  let current = "All";

  const render = () => {
    const shown = current === "All" ? items : items.filter((i) => i.category === current);
    mount.replaceChildren(...shown.map((i) => tile(i, (it) => openBox(shown, it))));
    if (!shown.length) mount.replaceChildren(el("li", { class: "empty" }, "Nothing here yet. New frames are added after each processing session."));
  };

  if (filters) {
    const cats = ["All", ...(categories || [...new Set(items.map((i) => i.category))]).filter((c) => items.some((i) => i.category === c))];
    filters.replaceChildren(...cats.map((c) => {
      const b = el("button", { class: "chip", type: "button", "aria-pressed": String(c === current) }, c);
      b.addEventListener("click", () => {
        current = c;
        filters.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        render();
      });
      return b;
    }));
  }
  render();

  const hash = decodeURIComponent(location.hash.slice(1));
  const hit = hash && items.find((i) => i.id === hash);
  if (hit) openBox(items, hit);
}

export async function initLatest() {
  const mount = document.querySelector("[data-latest]");
  if (!mount) return;
  const { items } = await loadJSON("gallery");
  const latest = items.slice(0, 3);
  mount.replaceChildren(...latest.map((i) => tile(i, (it) => openBox(latest, it))));
}
