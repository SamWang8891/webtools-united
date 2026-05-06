# webtools-united

A curated collection of small, single-purpose web tools — no login, no ads, no data collection.

Each tool is either an embedded app (built as a submodule and served from this site) or an external link with metadata. The registry is a flat directory of JSON files, one per tool, so contributors never touch shared code and PRs never conflict.

Live site: **[tools365.link](https://tools365.link)**

---

## Tools

<!-- BEGIN TOOLS -->
| Tool | Type | Description |
| --- | --- | --- |
| [Clippy](https://clippy.smashit.tw) | external | Clipboard utility for quick copy and share. |
| [Fastgoto](https://fastgoto.xyz) | external | Quick browser launcher and link organizer. |
| [QR Code Generator](/qrcode-generator/) | embedded | Make QR codes from text or URLs, right in the browser. |
| [Spinning Wheel](/wheel/) | embedded | Random pick wheel for decisions and giveaways. |
<!-- END TOOLS -->

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Bundler | Vite |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| Fuzzy search | Fuse.js |
| Hosting | Cloudflare Workers Static Assets |
| Prerender | Custom React SSR prerender (`scripts/prerender.mjs`) |

---

## Local development

```bash
git clone --recurse-submodules https://github.com/SamWang8891/webtools-united
cd webtools-united
npm install
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Validate, build submodules, fetch favicons, bundle, prerender, generate sitemap + README table |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all unit tests (Vitest) |

---

## Repo structure

```
webtools-united/
├── src/
│   ├── tools/          # One JSON file per tool (the registry)
│   ├── i18n/           # UI string translations (en.json, zh-Hant.json, …)
│   ├── components/     # Shared React components
│   └── pages/          # Page-level components
├── tools-vendored/     # Git submodules for embedded tools
├── public/
│   └── favicons/       # Static favicon overrides
├── scripts/            # Build-time Node scripts
└── worker/             # Cloudflare Worker entry point
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

To add a tool, drop a new JSON file under `src/tools/` — you never edit a shared registry, so PRs never conflict with each other.

---

## License

[MIT](./LICENSE)
