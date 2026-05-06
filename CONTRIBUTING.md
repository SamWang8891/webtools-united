# Contributing to webtools-united

## What kinds of tools belong here

- Web tools (converters, generators, utilities, etc.)
- **Submodule (embedded) tools must be frontend-only** — they run inside the browser. If a tool needs a backend, it must be a backend the tool itself owns and operates; this site has no server, so it cannot host backends for you. Tools that require a server we'd have to run should be added as **external links** instead.
- The target of an external link must not be a malicious, deceptive, or otherwise harmful site.

If your tool fits those constraints, it belongs here.

---

## Where to send PRs

**All PRs must target the `dev` branch, not `main`.** `main` is the deployed branch; `dev` is where contributions land and get integrated before promotion.

---

## The contribution model — one file per tool

The registry is a flat directory of JSON files (`src/tools/`), one per tool. There is no shared registry file to edit. You add one file and open a PR. Because two contributors can never touch the same file at the same time, merge conflicts are structurally impossible.

---

## Adding an external-link tool

An external tool links out to a tool hosted elsewhere. You supply the metadata; the site renders a card with title, description, tags, and favicon.

**Steps:**

1. Create `src/tools/<your-slug>.json` using the template below.
2. Open a PR. CI validates the JSON against the schema and runs a full build.
3. After CI passes, comment `/regen-seo` on the PR — the bot fetches the favicon, regenerates the sitemap, and updates the README tools table. Merge when ready.

```json
{
  "slug": "your-tool",
  "type": "external",
  "path": null,
  "url": "https://your-tool.example.com",
  "repo": "https://github.com/you/your-tool",
  "icon": null,
  "i18n": {
    "en": { "title": "Your Tool", "description": "One sentence about what it does." },
    "zh-Hant": { "title": "你的工具", "description": "一句話描述這個工具的用途。" }
  },
  "tags": ["category", "keyword"]
}
```

The `slug` must be lowercase kebab-case and match the filename (without `.json`). Tags must also be lowercase kebab-case.

---

## Adding a submodule (embedded) tool

An embedded tool is a separate Git repo that gets built and served as part of this site.

**Steps:**

1. Add the submodule:
   ```bash
   git submodule add https://github.com/you/your-tool tools-vendored/your-tool
   ```
2. Create `src/tools/<your-slug>.json` with `"type": "submodule"` and `"path": "/your-tool"`. Everything else is the same as an external tool.
3. Open a PR and comment `/regen-seo` after CI passes.

Your tool repo must expose a `npm run build` script that outputs a static site to `dist/`. The build pipeline runs `npm run build` in each submodule directory and copies `dist/` into the final bundle.

---

## Translations — what's required vs optional

**English (`en`) `title` and `description` are required for every tool.**

Other languages (currently only Traditional Chinese `zh-Hant`) are **optional** but encouraged.

When a translation is missing, the site falls back **per-string** to English — there is no "missing translation" indicator shown to users. You do not need to provide Chinese (or any other language) to get your tool listed.

The `i18n-coverage` CI check posts a friendly comment listing what's missing per language. **It never fails the build.**

Minimal valid tool JSON (English only — fully accepted by CI):

```json
{
  "slug": "your-tool",
  "type": "external",
  "path": null,
  "url": "https://your-tool.example.com",
  "repo": "https://github.com/you/your-tool",
  "icon": null,
  "i18n": {
    "en": { "title": "Your Tool", "description": "One sentence about what it does." }
  },
  "tags": ["category", "keyword"]
}
```

---

## Adding or improving translations

Translation PRs are welcome independently of adding a new tool.

- **UI strings** (navigation, search placeholder, footer, etc.) — edit `src/i18n/<lang>.json`.
- **Tool strings** — add or update the `zh-Hant` block (or any other language block) inside an existing tool's JSON file in `src/tools/`.

You do not need to touch any code or rebuild anything — the site picks up JSON changes automatically.

---

## Icon override

By default, if `"icon"` is `null` and `"type"` is `"external"`, the build script auto-fetches the favicon from the tool URL at build time.

To use a custom icon instead, choose one of two approaches:

1. **Public directory (preferred for production):** Drop a square PNG (minimum 64×64 px) at `public/favicons/<filename>.png` and set `"icon": "<filename>.png"` in your tool JSON. The card resolves `/favicons/<icon>` directly at runtime.

2. **Source icons (build-time copy):** Drop the PNG at `src/tools/icons/<filename>.png`. The build script copies it to `public/favicons/` during the build. Set `"icon": "<filename>.png"` in your tool JSON the same way.

---

## What CI checks

**Required (blocking — build fails if any of these fail):**

| Check | What it verifies |
| --- | --- |
| JSON schema validation | Every `src/tools/*.json` file conforms to `tool.schema.json` |
| Full build | Submodules build, Vite bundles, prerender succeeds |
| TypeScript typecheck | No type errors |
| Tests | All Vitest tests pass |

**Informational (non-blocking — posted as PR comments, never fail the build):**

| Check | What it reports |
| --- | --- |
| `i18n-coverage` | Lists which tool strings are missing per language |
| Auto-SEO | Prompts maintainer to run `/regen-seo` if favicon/sitemap is stale |

---

## Style notes

- `slug` must be **lowercase kebab-case** and must exactly match the filename without `.json`.
- Tags must be **lowercase kebab-case** (e.g., `"text-processing"`, not `"TextProcessing"`).
- Keep `description` to one sentence. It appears as the card subtitle and in the sitemap.
