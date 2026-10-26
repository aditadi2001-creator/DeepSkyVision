// Hero: drag to compare one raw 60 s frame with the stacked, processed result.
import { paintSky } from "./skyart.js";

export function initHero() {
  const box = document.querySelector("[data-compare]");
  if (!box) return;
  const fin = box.querySelector(".final");
  const raw = box.querySelector(".raw");
  const handle = box.querySelector(".handle");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pos = 0, userTouched = false, raf = 0;

  const set = (p) => {
    pos = Math.max(0, Math.min(100, p));
    box.style.setProperty("--pos", pos + "%");
    handle.setAttribute("aria-valuenow", String(Math.round(pos)));
  };
  set(0);

  const fromEvent = (e) => {
    const r = box.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };
  const stopSweep = () => { userTouched = true; cancelAnimationFrame(raf); };

  box.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a")) return;
    stopSweep();
    box.setPointerCapture(e.pointerId);
    box.dataset.drag = "1";
    fromEvent(e);
  });
  box.addEventListener("pointermove", (e) => { if (box.dataset.drag) fromEvent(e); });
  const end = (e) => { delete box.dataset.drag; if (box.hasPointerCapture?.(e.pointerId)) box.releasePointerCapture(e.pointerId); };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 10 : 2;
    const k = e.key;
    if (k === "ArrowLeft" || k === "ArrowDown") set(pos - step);
    else if (k === "ArrowRight" || k === "ArrowUp") set(pos + step);
    else if (k === "Home") set(0);
    else if (k === "End") set(100);
    else return;
    stopSweep();
    e.preventDefault();
  });

  const sweep = () => {
    const target = 34;
    if (reduce) { set(target); return; }
    const t0 = performance.now() + 700, dur = 2000;
    const tick = (now) => {
      if (userTouched) return;
      const t = Math.max(0, Math.min(1, (now - t0) / dur));
      set(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  // Paint after first paint so the page appears instantly.
  const W = 1600, H = 900;
  requestAnimationFrame(() => setTimeout(() => {
    paintSky(fin, { seed: 7, kind: "nebula", width: W, height: H, mode: "final" });
    paintSky(raw, { seed: 7, kind: "nebula", width: W, height: H, mode: "raw" });
    box.classList.add("is-ready");
    sweep();
  }, 30));
}
