// Entry point: every page loads this. It sets up the shared header/footer,
// then loads the module for the current page (body[data-page]).
import { initLayout } from "./layout.js";

const page = document.body.dataset.page;
const pages = {
  home: async () => {
    const [{ initHero }, { initLatest }] = await Promise.all([import("./hero.js"), import("./gallery.js")]);
    initHero();
    initLatest();
  },
  gallery: async () => (await import("./gallery.js")).initGallery(),
  gear: async () => (await import("./gear.js")).initGear(),
  downloads: async () => (await import("./downloads.js")).initDownloads(),
  contact: async () => (await import("./contact.js")).initContact(),
};

initLayout().finally(() => {
  document.documentElement.classList.add("is-loaded");
  if (pages[page]) pages[page]().catch((e) => console.error(`[${page}]`, e));
});
