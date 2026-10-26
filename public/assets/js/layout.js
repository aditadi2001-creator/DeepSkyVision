// Shared header + footer, driven by /data/site.json.
import { loadJSON, el, isSafeUrl } from "./data.js";

const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#070a13"/><path d="M32 9a23 23 0 1 0 22.6 27.4" fill="none" stroke="#e9a94b" stroke-width="4.5" stroke-linecap="round"/><path d="M32 20c1.2 7.4 3.6 9.8 11 11-7.4 1.2-9.8 3.6-11 11-1.2-7.4-3.6-9.8-11-11 7.4-1.2 9.8-3.6 11-11z" fill="#e8ebf3"/><circle cx="51" cy="14" r="3" fill="#3bbfae"/></svg>`;

const norm = (p) => p.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/(.)\/$/, "$1") || "/";

export async function initLayout() {
  let site;
  try { site = await loadJSON("site"); } catch (e) { console.error(e); site = { name: "DeepSkyVision", nav: [], social: [] }; }

  const nav = [...(site.nav || [])];
  if (site.shop?.enabled && isSafeUrl(site.shop.url)) nav.push({ label: "Shop", href: site.shop.url, external: true });
  const here = norm(location.pathname);

  const header = document.querySelector("[data-site-header]");
  if (header) {
    header.className = "site-header";
    header.innerHTML = "";
    const links = el("nav", { class: "nav", id: "site-nav", "aria-label": "Main" },
      nav.map((n) => el("a", { href: n.href, "aria-current": !n.external && norm(n.href) === here ? "page" : null, rel: n.external ? "noopener" : null }, n.label)));
    const btn = el("button", { class: "menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "site-nav" }, "Menu");
    btn.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Close" : "Menu";
    });
    const brand = el("a", { class: "brand", href: "/", "aria-label": `${site.name} home` });
    brand.innerHTML = `${LOGO}<span class="brand-name">Deep<b>Sky</b>Vision</span>`;
    header.append(el("div", { class: "wrap" }, brand, links, btn));
    const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    links.addEventListener("click", (e) => { if (e.target.tagName === "A") { links.classList.remove("is-open"); btn.textContent = "Menu"; btn.setAttribute("aria-expanded", "false"); } });
  }

  const footer = document.querySelector("[data-site-footer]");
  if (footer) {
    footer.className = "site-footer";
    const social = (site.social || []).filter((s) => isSafeUrl(s.url));
    const brand = el("div", {}, el("a", { class: "brand", href: "/" }, ""), el("p", {}, `${site.tagline || ""}.`));
    brand.firstChild.innerHTML = `${LOGO}<span class="brand-name">Deep<b>Sky</b>Vision</span>`;
    const explore = el("div", {}, el("h2", {}, "Explore"), el("ul", {}, nav.map((n) => el("li", {}, el("a", { href: n.href }, n.label)))));
    const follow = el("div", {}, el("h2", {}, "Follow"),
      social.length
        ? el("ul", {}, social.map((s) => el("li", {}, el("a", { href: s.url, rel: "noopener me", target: "_blank" }, s.label))))
        : el("p", {}, "Social links are coming soon."));
    footer.append(el("div", { class: "wrap" },
      el("div", { class: "footer-grid" }, brand, explore, follow),
      el("div", { class: "fine" },
        el("span", {}, `© ${new Date().getFullYear()} ${site.name}. Images and files are © their author unless noted.`),
        el("span", {}, site.location || ""))));
  }
}
