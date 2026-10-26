import { loadJSON, el, isSafeUrl } from "./data.js";

export async function initContact() {
  const mount = document.querySelector("[data-contact]");
  if (!mount) return;
  const site = await loadJSON("site");
  const rows = [];
  if (site.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site.email)) {
    rows.push(el("li", {}, el("span", { class: "k" }, "Email"), el("a", { href: `mailto:${site.email}` }, site.email)));
  }
  for (const s of site.social || []) {
    if (isSafeUrl(s.url)) rows.push(el("li", {}, el("span", { class: "k" }, s.label), el("a", { href: s.url, target: "_blank", rel: "noopener me" }, s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))));
  }
  if (site.location) rows.push(el("li", {}, el("span", { class: "k" }, "Based in"), el("span", {}, site.location)));
  mount.replaceChildren(...rows);
  if (!site.email && !(site.social || []).some((s) => isSafeUrl(s.url))) {
    mount.after(el("p", { class: "muted", style: "margin-top:20px" }, "Contact details are coming soon."));
  }
}
