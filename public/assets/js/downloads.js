import { loadJSON, el, isSafeUrl } from "./data.js";

const driveDownload = (id) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const driveView = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

export async function initDownloads() {
  const mount = document.querySelector("[data-downloads]");
  if (!mount) return;
  const data = await loadJSON("downloads");

  const note = document.querySelector("[data-dl-note]");
  if (note) note.textContent = data.note || "";

  mount.replaceChildren(...data.items.map((d) => {
    const live = d.status === "live" && (d.driveId || isSafeUrl(d.url));
    const dl = d.driveId ? driveDownload(d.driveId) : d.url;
    const view = d.viewUrl || (d.driveId ? driveView(d.driveId) : "");
    return el("article", { class: "dl" },
      el("div", {},
        el("span", { class: `status ${live ? "live" : "soon"}` }, live ? "Available" : "Coming soon"),
        el("h2", {}, d.title),
        d.summary ? el("p", {}, d.summary) : null,
        d.details ? el("p", {}, d.details) : null,
        d.meta ? el("div", { class: "meta" }, Object.entries(d.meta).map(([k, v]) => el("span", {}, `${k}: `, el("strong", {}, v)))) : null),
      el("div", { class: "dl-actions" },
        live
          ? [el("a", { class: "btn btn-primary", href: dl, rel: "noopener", target: "_blank" }, "Download"),
             isSafeUrl(view) ? el("a", { class: "btn btn-ghost btn-sm", href: view, rel: "noopener", target: "_blank" }, "View on Drive") : null]
          : el("span", { class: "btn btn-ghost", "aria-disabled": "true" }, "In preparation")));
  }));
}
