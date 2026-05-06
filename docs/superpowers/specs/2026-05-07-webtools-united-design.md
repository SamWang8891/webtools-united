# webtools-united — Design Spec

**Date:** 2026-05-07
**Status:** Approved (pending user review of written spec)
**Domain:** https://tools365.link
**Repo:** https://github.com/SamWang8891/webtools-united

## 1. Goals

- A clean, productive-looking directory of small web tools, hosted on a single Cloudflare-Workers domain.
- Bilingual (English + Traditional Chinese) with first-class SEO in both languages.
- Tools may be **embedded** (vendored as git submodules and built into the same domain) or **external** (linked out). Both render as cards with the same look.
- Adding a tool via PR must never produce merge conflicts with concurrent PRs.
- Dark / light / auto theme. Mobile-friendly. Minimal animation.

## 2. Non-goals

- User accounts, comments, ratings, analytics dashboards.
- Server-side personalization (no per-user state).
- A category/filter UI (search-only — keep the surface simple; tags exist in data but aren't shown as chips).
- Heavy animation or page transitions.

## 3. Architecture overview

Static-Site-Generated (SSG) React app built with Vite + `vite-ssg`, deployed to Cloudflare Workers Static Assets. A thin Worker handles two runtime concerns: first-visit language redirect and external-tool slug redirects. Embedded tools are vendored as git submodules under `tools-vendored/` and each one's `dist/` is mounted at `/<slug>/` during the main build.

```
tools365.link/                       (SSG: en homepage)
tools365.link/zh-Hant/               (SSG: zh-Hant homepage)
tools365.link/wheel/                 (submodule build output)
tools365.link/qrcode-generator/      (submodule build output)
tools365.link/fastgoto               (Worker: 302 → https://fastgoto.xyz)
tools365.link/clippy                 (Worker: 302 → https://clippy.smashit.tw)
tools365.link/sitemap.xml
tools365.link/robots.txt
```

## 4. Repo structure

```
webtools-united/
├── src/
│   ├── tools/                  # one JSON per tool (PR conflict-free)
│   │   ├── wheel.json
│   │   ├── qrcode-generator.json
│   │   ├── fastgoto.json
│   │   ├── clippy.json
│   │   └── icons/              # optional contributor-supplied icon overrides
│   │       └── wheel.png
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── SearchBar.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   └── Home.tsx            # rendered per-language by vite-ssg
│   ├── i18n/
│   │   ├── en.json
│   │   ├── zh-Hant.json
│   │   └── index.ts            # loader + per-string fallback to en
│   ├── lib/
│   │   ├── tool-loader.ts      # import.meta.glob('../tools/*.json')
│   │   ├── search.ts           # Fuse.js setup
│   │   └── theme.ts
│   ├── styles/
│   │   └── tailwind.css
│   ├── main.tsx
│   └── App.tsx
├── tools-vendored/             # git submodules
│   ├── wheel/                  # ← git@github.com:SamWang8891/wheel
│   └── qrcode-generator/       # ← git@github.com:SamWang8891/qrcode-generator
├── public/
│   └── favicons/               # auto-fetched at build, committed to git (cache)
├── scripts/
│   ├── validate-tools.mjs      # JSON-Schema validation
│   ├── build-submodules.mjs    # builds each submodule, copies dist → /<slug>/
│   ├── fetch-favicons.mjs      # populates public/favicons/<slug>.png
│   ├── generate-sitemap.mjs    # writes sitemap.xml + robots.txt
│   ├── check-i18n.mjs          # missing-translation-key reporter
│   └── update-readme-tools.mjs # regenerates README tool table between markers
├── worker/
│   └── index.ts                # Accept-Language redirect + external-tool redirects
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── i18n-coverage.yml
│   │   ├── auto-seo.yml
│   │   ├── auto-seo-dispatch.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
│       └── tool-suggestion.md
├── wrangler.toml
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE                     # MIT
```

## 5. Tool data model

### 5.1 Per-tool JSON schema

One file per tool in `src/tools/*.json`. Auto-discovered at build time via `import.meta.glob('../tools/*.json', { eager: true })` from `src/lib/tool-loader.ts`. **One file per PR → no merge conflicts.**

```json
{
  "slug": "wheel",
  "type": "submodule",
  "path": "/wheel/",
  "url": null,
  "repo": "https://github.com/SamWang8891/wheel",
  "icon": null,
  "i18n": {
    "en":      { "title": "Spinning Wheel",  "description": "Random pick wheel for decisions and giveaways." },
    "zh-Hant": { "title": "輪盤抽選",          "description": "隨機決定、抽獎用的轉盤工具。" }
  },
  "tags": ["random", "decision", "wheel"]
}
```

External-tool example:

```json
{
  "slug": "fastgoto",
  "type": "external",
  "path": null,
  "url": "https://fastgoto.xyz",
  "repo": "https://github.com/SamWang8891/pika",
  "icon": null,
  "i18n": {
    "en":      { "title": "Fastgoto",  "description": "Quick browser launcher and link organizer." },
    "zh-Hant": { "title": "Fastgoto",  "description": "快速瀏覽器啟動器與書籤工具。" }
  },
  "tags": ["productivity", "launcher"]
}
```

### 5.2 Schema rules (enforced by `scripts/validate-tools.mjs`)

- `slug` must match filename, lowercase kebab-case, unique.
- `type` is `"submodule"` or `"external"`.
- If `type === "submodule"`: `path` required, `url` must be `null`. The matching directory `tools-vendored/<slug>/` must exist with a buildable package.
- If `type === "external"`: `url` required (must be `https://`), `path` must be `null`.
- `i18n` must have at least an `en` entry. `zh-Hant` is encouraged but not required (partial fallback handles missing keys).
- `icon` is either `null` (auto-fetch) or a filename under `src/tools/icons/`.
- `tags` is an array of lowercase strings (used by search ranking; not shown as UI filters).

### 5.3 Initial tool set (seed)

| slug | type | source |
|---|---|---|
| `wheel` | submodule | git@github.com:SamWang8891/wheel.git |
| `qrcode-generator` | submodule | git@github.com:SamWang8891/qrcode-generator.git |
| `fastgoto` | external | https://fastgoto.xyz |
| `clippy` | external | https://clippy.smashit.tw |

## 6. URL & routing

- `/` → English homepage (SSG)
- `/zh-Hant/` → Traditional Chinese homepage (SSG)
- `/<slug>/` → submodule tool (static assets from `tools-vendored/<slug>/dist/`)
- `/<slug>` (external slug, no trailing path beyond root) → 302 redirect to the tool's `url` (Worker)
- `/sitemap.xml` and `/robots.txt` → generated at build time
- `/api/*`, `/_*` → reserved (404)

### 6.1 First-visit language detection

The Worker, on a request to `/` from a client without a `wt-lang` cookie:
1. Reads `Accept-Language`.
2. If primary language matches `zh*`, redirects to `/zh-Hant/` and sets `wt-lang=zh-Hant`.
3. Otherwise, sets `wt-lang=en` and serves `/` normally.

User clicking the language switcher overwrites the cookie and writes to `localStorage` so future visits respect the override regardless of `Accept-Language`.

### 6.2 hreflang

Both SSG'd HTMLs include reciprocal hreflang tags:

```html
<link rel="alternate" hreflang="en"      href="https://tools365.link/" />
<link rel="alternate" hreflang="zh-Hant" href="https://tools365.link/zh-Hant/" />
<link rel="alternate" hreflang="x-default" href="https://tools365.link/" />
```

## 7. i18n strategy

Two layers, same partial-fallback rule:

- **UI strings** in `src/i18n/{en,zh-Hant}.json` — header text, search placeholder, footer label, empty-state, etc.
- **Tool strings** in each tool's `i18n` object.

`getString(lang, key)` returns the value at `key` for `lang`, falling back to `en` if missing, and ultimately to the key itself (rare, schema-validated against). No "missing translation" indicator shown to users.

`scripts/check-i18n.mjs` walks both layers and reports missing keys per language. Used by the `i18n-coverage.yml` workflow to post a non-blocking sticky PR comment.

## 8. SEO

### 8.1 What's pre-rendered

- `/` and `/zh-Hant/` rendered to full HTML by `vite-ssg` with title, meta description, Open Graph, Twitter card, canonical, and reciprocal hreflang.
- JSON-LD `ItemList` structured data is embedded on each homepage listing every tool — improves Google understanding and surfacing of individual tools in SERPs even though they don't have their own pages.
- `sitemap.xml` lists `/` and `/zh-Hant/` only (the embedded submodule tools are *not* in the sitemap; they're separate apps that may have their own SEO setup, and we don't want to claim them as our content).
- `robots.txt`: allow all, points at the sitemap.

### 8.2 Per-tool SEO (deliberately deferred)

Per-tool detail pages were considered and rejected (Q3b option B was picked). Future option open if SEO needs grow.

## 9. Search

- **Library:** Fuse.js (~3KB gzipped).
- **Index:** title + description in *both* languages + tags. So a query in either language matches across all tools regardless of the current UI language.
- **Weights:** title 0.6, description 0.3, tags 0.1. Threshold 0.4 (mild fuzzy).
- **Debounce:** 150ms.
- **Empty state:** "No tools match. [Suggest one →]" links to a GitHub issue template.
- **URL state:** the search input mirrors `#q=...` so refresh and share preserve results.

## 10. Theme

- Three explicit states: `light`, `dark`, `auto`. Default `auto`.
- `auto` follows `prefers-color-scheme` and listens to changes live (responds when the OS toggles at sunset).
- Manual choice persists in `localStorage` under `wt-theme`.
- An inline `<script>` in the SSG'd `<head>` reads localStorage and the media query, and sets `data-theme="light|dark"` on `<html>` *before* paint, eliminating flash-of-wrong-theme.
- Tailwind dark mode configured as `darkMode: ['selector', '[data-theme="dark"]']`.
- Theme toggle is a three-state button cycling sun → moon → auto.

## 11. UI/UX

### 11.1 Layout

- **Header**: site title + tagline (i18n'd) on the left; on the right: search input, language switcher (`EN | 繁中`), three-state theme toggle.
- **Body**: responsive card grid — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Each card shows favicon (left), title + description (center), and a small badge top-right: 🔗 for external, 📦 for embedded submodule.
- **Card behavior**: whole card is a clickable link. External tools open in a new tab (`target="_blank" rel="noopener noreferrer"`). Submodule tools navigate same-tab.
- **Footer**: thin, single line. `© 2026 webtools-united · github.com/SamWang8891/webtools-united · MIT`.

### 11.2 Responsive

Tailwind defaults: 1-up below 640px, 2-up at 640px+, 3-up at 1024px+. Search bar collapses to full width on phone.

### 11.3 Animation

Intentionally minimal:
- Card hover: `translateY(-2px)` + shadow change, 150ms.
- Theme switch: 200ms color crossfade on root.
- No page transitions, no scroll-driven animation, no parallax, no skeleton shimmer (cards render instantly from preloaded JSON).

## 12. Build pipeline

`npm run build` runs in this order. Each step is its own script and can run independently for debugging.

1. **Validate tool JSON** (`scripts/validate-tools.mjs`) — JSON-Schema, hard fail.
2. **Build submodules** (`scripts/build-submodules.mjs`) — for each `tools-vendored/<slug>/`: `npm ci && npm run build`, copy `dist/` to `dist/<slug>/`. Failure aborts the entire build.
3. **Resolve favicons** (`scripts/fetch-favicons.mjs`) — for each tool: if `icon` set, copy from `src/tools/icons/`. If `null`, fetch from origin (parse `<link rel="icon">`, fallback to `/favicon.ico`), download largest available. Cache + commit results in `public/favicons/<slug>.png` so subsequent builds are no-ops unless the tool URL or icon field changes.
4. **SSG** — `vite-ssg build` renders `/` and `/zh-Hant/`.
5. **Generate SEO files** (`scripts/generate-sitemap.mjs`) — write `dist/sitemap.xml` and `dist/robots.txt`.
6. **Update README tool table** (`scripts/update-readme-tools.mjs`) — regenerates the table between `<!-- BEGIN TOOLS -->` / `<!-- END TOOLS -->` markers.

## 13. CI workflows

### 13.1 `ci.yml` (required check, blocking)

Triggers: PR to `main`, push to `main`.
- Checkout with submodules.
- `npm ci`.
- `npm run validate` (step 1).
- `npm run build` (steps 1–6).
- Type-check.

### 13.2 `i18n-coverage.yml` (informational, non-blocking)

Triggers: PR to `main`.
- Runs `scripts/check-i18n.mjs`.
- Posts/updates a sticky comment listing missing translation keys per language. Never fails.

### 13.3 `auto-seo.yml` (interactive)

Triggers: PR to `main`.
- Detects: any `src/tools/*.json` changed, or any tool added; AND `dist/sitemap.xml` / `public/favicons/*.png` not regenerated for the new content.
- Posts a sticky comment: *"This PR adds/changes a tool. Reply with `/regen-seo` and I'll generate the sitemap, favicon, and README table for you."*
- Does **not** push anything on its own.

### 13.4 `auto-seo-dispatch.yml` (comment-triggered)

Triggers: `issue_comment` on a PR.
- If comment body starts with `/regen-seo` AND author is the PR author OR a repo collaborator: checks out the PR branch, runs step 1 (validate) as a safety guard, then steps 3, 5, 6, commits and pushes back. Updates the sticky comment to *"Done — pushed `<sha>`."* If validation fails, posts the error and pushes nothing.
- All other comments ignored. Authorization checked via `gh api` — non-collaborator non-author replies get a polite "you can't trigger this" reaction (`👎`) and no action.

### 13.5 `deploy.yml`

Triggers: push to `main` (after `ci.yml` passes).
- `wrangler deploy` to Cloudflare Workers Static Assets.

## 14. Cloudflare Workers deployment

`wrangler.toml`:

```toml
name = "tools365"
main = "worker/index.ts"
compatibility_date = "2026-05-01"

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "404-page"
```

The Worker (`worker/index.ts`) handles:
- `GET /<external-slug>` (and `/<external-slug>/`) → 302 redirect to the tool's URL (built into the Worker bundle from `src/tools/*.json` at build time as a static map).
- `GET /` with no `wt-lang` cookie and `Accept-Language` starting with `zh` → 302 to `/zh-Hant/`, set `wt-lang=zh-Hant`.
- All other requests → fall through to `env.ASSETS.fetch(request)`.

PR preview deployments enabled via Cloudflare's GitHub integration; each PR gets a preview URL commented automatically.

## 15. Documentation

### 15.1 README.md

Audience: a stranger landing on the GitHub repo. Sections:

1. **What this is** — one paragraph.
2. **Tools currently included** — auto-generated table between markers.
3. **Tech stack** — Vite + React, Tailwind, vite-ssg, Fuse.js, Cloudflare Workers Static Assets.
4. **Local development** — `git clone --recurse-submodules`, `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
5. **Repo structure** — short tree.
6. **Contributing** — link to `CONTRIBUTING.md`.
7. **License** — MIT.

### 15.2 CONTRIBUTING.md

Audience: someone who wants to add a tool. Sections:

1. **What kinds of tools belong here** — small, single-purpose, no logins, no ads, no data collection.
2. **Add an external-link tool** — copy-paste JSON template + 3 steps.
3. **Add a submodule tool** — same plus `git submodule add` step. Tool repo must produce static output via `npm run build` → `dist/`.
4. **Translate** — copy keys between `src/i18n/*.json`. Translation-coverage workflow comments missing keys on every PR.
5. **Icon override** — drop a square PNG (≥64×64) in `src/tools/icons/` and reference from JSON.
6. **What CI checks** — schema, build, translation coverage (informational).
7. **Why one-file-per-tool** — short note on the no-merge-conflict design.

## 16. Open / deferred

- Per-tool detail pages (`/tools/<slug>`) — deferred. Easy to add later by adding routes to vite-ssg config.
- Search filter chips by tag — deferred. Tags are stored, just not surfaced.
- Analytics — none in v1. If added later, prefer a privacy-respecting choice (Cloudflare Web Analytics, no cookies).
- More languages — schema already supports it; add a third entry to `i18n` in tools and an `src/i18n/<lang>.json`, plus a route.

## 17. Decisions log (from brainstorming)

| Question | Choice |
|---|---|
| Submodule integration strategy | A — build-time integration, mounted under same domain |
| Tool data format | A — one JSON per tool |
| SEO rendering | A — SSG with `vite-ssg` |
| Per-tool detail pages | B — directory only |
| Language URL strategy | A — language-prefixed paths (`/`, `/zh-Hant/`) |
| Favicon source | A1 default + A2 (committed file) override |
| Search | B1 — Fuse.js |
| Cloudflare deployment | C2 — Workers Static Assets |
| Submodule build failure | Fail entire deploy |
| Auto-SEO commits | Interactive — bot prompts, only acts on `/regen-seo` from PR author/collaborator |
| Translation-coverage check | Non-blocking; comment-only |
| Partial i18n fallback | Per-string fallback to English; no missing-translation indicator |
