import { loadJSON, el, isSafeUrl } from "./data.js";

export async function initGear() {
  const data = await loadJSON("gear");

  const glance = document.querySelector("[data-glance]");
  if (glance && data.glance?.length) {
    glance.replaceChildren(...data.glance.map((g) => el("div", {}, el("dt", {}, g.label), el("dd", {}, g.value))));
  }
  const disc = document.querySelector("[data-disclosure]");
  if (disc) disc.textContent = data.disclosure || "";

  const mount = document.querySelector("[data-gear]");
  if (!mount) return;
  mount.replaceChildren(...data.groups.map((g) =>
    el("section", { class: "gear-group", id: g.id, "aria-labelledby": `h-${g.id}` },
      el("header", {}, el("h2", { id: `h-${g.id}` }, g.title), g.blurb ? el("p", {}, g.blurb) : null),
      el("ul", { class: "gear-list" }, g.items.map((i) =>
        el("li", {},
          el("h3", {}, i.name, i.status === "planned" ? el("span", { class: "pill" }, "Planned") : null),
          i.spec ? el("p", { class: "spec" }, i.spec) : null,
          i.note ? el("p", { class: "note" }, i.note) : null,
          isSafeUrl(i.url)
            ? el("a", { class: "btn btn-ghost btn-sm buy", href: i.url, target: "_blank", rel: "noopener sponsored" }, i.store ? `Buy at ${i.store}` : "See price")
            : null))))));
}
