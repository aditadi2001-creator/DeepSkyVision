# DeepSkyVision

Static astrophotography site, hosted on Cloudflare Workers (static assets). Pushing to `main` deploys it.

```
wrangler.jsonc        Cloudflare config (serves ./public)
public/
  *.html              pages (index, gallery, gear, downloads, about, contact, 404)
  data/*.json         ALL the content that changes: site, gallery, gear, downloads
  images/gallery/     full-size images and thumbnails
  assets/             css, js, fonts
```

## How content is updated

| To change | Edit |
|---|---|
| Add a gallery image | Put the file in `public/images/gallery/`, add an item to `data/gallery.json` with `src` (and optional `thumb`). Delete the item's `sample` block. |
| Add or change gear / affiliate link | `data/gear.json` – set `url` and `store` on the item. Items with no `url` show no button. |
| Add a project file | `data/downloads.json` – set `status: "live"` and `driveId` (the long ID in the Google Drive share link). |
| Contact email, social links, Shop in the menu | `data/site.json` |

Keep images under 25 MiB each (Cloudflare limit). Use a ~1600 px wide JPEG/WebP as `thumb` and the full image as `src`.

## Google Drive downloads

Share the file as "Anyone with the link", copy the file ID from
`https://drive.google.com/file/d/<FILE_ID>/view`, and put it in `driveId`.
The site builds the download and "View on Drive" links from that.

## Notes

- Free address: `deepskyvision.<account>.workers.dev`. A custom domain (e.g. deepskyvision.com) needs the domain to be registered and its DNS on Cloudflare.
- "Sample frame" artwork is generated in the browser by `assets/js/skyart.js`; it is placeholder content, not photographs.
