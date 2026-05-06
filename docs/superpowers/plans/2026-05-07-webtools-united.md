# webtools-united Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the webtools-united directory site at https://tools365.link — a SSG'd, bilingual (EN/zh-Hant), themable React site that lists embedded (submodule) and external web tools as searchable cards, deployed to Cloudflare Workers Static Assets.

**Architecture:** Vite + React + TypeScript SSG'd via `vite-ssg`. Tool metadata is one JSON file per tool (PR conflict-free) auto-discovered with `import.meta.glob`. Embedded tools are git submodules built during the main build and mounted at `/<slug>/`. External tools render as cards that open in a new tab; visiting `/<external-slug>` directly hits a Cloudflare Worker that 302s to the real URL. The same Worker handles `Accept-Language`-based first-visit language redirects.

**Tech Stack:** Vite 5+, React 18+, TypeScript 5+, Tailwind CSS, `vite-ssg`, Fuse.js, Vitest + @testing-library/react, Cloudflare Workers Static Assets (`wrangler` 4+), GitHub Actions.

---

## File Structure

**Created:**
- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `wrangler.toml`, `.gitmodules`, `.editorconfig`, `.nvmrc`, `LICENSE`
- `src/main.tsx`, `src/App.tsx`, `src/styles/tailwind.css`
- `src/pages/Home.tsx`
- `src/components/Card.tsx`, `Header.tsx`, `SearchBar.tsx`, `LanguageSwitcher.tsx`, `ThemeToggle.tsx`, `Footer.tsx`
- `src/lib/tool-loader.ts`, `src/lib/search.ts`, `src/lib/theme.ts`, `src/lib/types.ts`
- `src/i18n/en.json`, `src/i18n/zh-Hant.json`, `src/i18n/index.ts`, `src/i18n/index.test.ts`
- `src/tools/wheel.json`, `src/tools/qrcode-generator.json`, `src/tools/fastgoto.json`, `src/tools/clippy.json`
- `src/tools/tool.schema.json`
- `scripts/validate-tools.mjs`, `scripts/validate-tools.test.mjs`
- `scripts/fetch-favicons.mjs`, `scripts/fetch-favicons.test.mjs`
- `scripts/build-submodules.mjs`
- `scripts/generate-sitemap.mjs`, `scripts/generate-sitemap.test.mjs`
- `scripts/check-i18n.mjs`, `scripts/check-i18n.test.mjs`
- `scripts/update-readme-tools.mjs`, `scripts/update-readme-tools.test.mjs`
- `worker/index.ts`, `worker/index.test.ts`
- `.github/workflows/ci.yml`, `i18n-coverage.yml`, `auto-seo.yml`, `auto-seo-dispatch.yml`, `deploy.yml`
- `.github/ISSUE_TEMPLATE/tool-suggestion.md`
- `README.md`, `CONTRIBUTING.md`
- `tools-vendored/wheel/` (submodule), `tools-vendored/qrcode-generator/` (submodule)
- `public/favicons/.gitkeep`

**Modified:**
- `.gitignore`

**File responsibilities:**
- `src/lib/tool-loader.ts` — single place that reads all `src/tools/*.json` and types them. Everything else uses this.
- `src/lib/search.ts` — Fuse.js wrapper exposing `search(query, lang)`.
- `src/lib/theme.ts` — `getInitialTheme()`, `applyTheme()`, the inline script source string.
- `src/i18n/index.ts` — `t(lang, key)` with per-string EN fallback.
- `worker/index.ts` — request handler: external-slug redirects + first-visit Accept-Language redirect, falls through to assets.
- Components are presentational and consume hooks/lib functions; no fetching inside components.

---

## Conventions

- Indent: 2 spaces. Quotes: double in TS/TSX, single in JSON-incompatible places.
- Lint: ESLint default for TS+React. Format: Prettier defaults.
- Tests live next to source as `*.test.ts(x)`. Scripts use `*.test.mjs`.
- Run tests: `npm test` (vitest + node test runner via npm script).
- Commit messages: Conventional Commits — `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `ci:`.
- **Never** add a `Co-Authored-By: Claude` trailer. (User's global preference.)

---

## Task 1: Scaffold Vite + React + TS + Tailwind + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `index.html`, `.editorconfig`, `.nvmrc`, `.gitignore` (modify), `src/main.tsx`, `src/App.tsx`, `src/styles/tailwind.css`, `src/vite-env.d.ts`

- [ ] **Step 1.1: Initialize package.json**

Create `/Users/samwang/webtools-united/package.json`:

```json
{
  "name": "webtools-united",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run validate && npm run build:submodules && npm run build:favicons && vite-ssg build && npm run build:seo && npm run build:readme",
    "build:submodules": "node scripts/build-submodules.mjs",
    "build:favicons": "node scripts/fetch-favicons.mjs",
    "build:seo": "node scripts/generate-sitemap.mjs",
    "build:readme": "node scripts/update-readme-tools.mjs",
    "build:worker": "esbuild worker/index.ts --bundle --format=esm --platform=neutral --target=es2022 --outfile=dist-worker/index.js",
    "validate": "node scripts/validate-tools.mjs",
    "check:i18n": "node scripts/check-i18n.mjs",
    "preview": "vite preview",
    "test": "vitest run && node --test scripts/*.test.mjs",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "deploy": "npm run build && npm run build:worker && wrangler deploy"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "ajv": "^8.17.0",
    "autoprefixer": "^10.4.0",
    "esbuild": "^0.25.0",
    "happy-dom": "^15.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-ssg": "^0.24.0",
    "vitest": "^2.1.0",
    "wrangler": "^4.0.0"
  }
}
```

- [ ] **Step 1.2: Create TypeScript configs**

`/Users/samwang/webtools-united/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": false,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "worker"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`/Users/samwang/webtools-united/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 1.3: Create Vite + Vitest configs**

`/Users/samwang/webtools-united/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    script: "async",
    formatting: "minify",
    crittersOptions: false,
  },
});
```

`/Users/samwang/webtools-united/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

`/Users/samwang/webtools-united/src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 1.4: Create Tailwind + PostCSS configs**

`/Users/samwang/webtools-united/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
    },
  },
};
```

`/Users/samwang/webtools-united/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`/Users/samwang/webtools-united/src/styles/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: 250 250 250;
  --fg: 24 24 27;
  --muted: 113 113 122;
  --card: 255 255 255;
  --border: 228 228 231;
  --accent: 59 130 246;
}

[data-theme="dark"] {
  --bg: 9 9 11;
  --fg: 244 244 245;
  --muted: 161 161 170;
  --card: 24 24 27;
  --border: 39 39 42;
  --accent: 96 165 250;
}

html {
  background: rgb(var(--bg));
  color: rgb(var(--fg));
}

* {
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}
```

- [ ] **Step 1.5: Create entry files**

`/Users/samwang/webtools-united/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tools365 — webtools united</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`/Users/samwang/webtools-united/src/main.tsx`:

```tsx
import { ViteSSG } from "vite-ssg/single-page";
import App from "./App";
import "./styles/tailwind.css";

export const createApp = ViteSSG(App);
```

`/Users/samwang/webtools-united/src/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">webtools-united</h1>
    </div>
  );
}
```

`/Users/samwang/webtools-united/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`/Users/samwang/webtools-united/.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

`/Users/samwang/webtools-united/.nvmrc`:

```
20
```

- [ ] **Step 1.6: Update .gitignore**

Replace `/Users/samwang/webtools-united/.gitignore` with:

```
.idea/
.claude/
node_modules/
dist/
dist-worker/
.wrangler/
.DS_Store
*.log
.env
.env.local
```

- [ ] **Step 1.7: Install and verify build runs**

```bash
cd /Users/samwang/webtools-united && npm install
```

Expected: completes without error. Will warn about peer deps from vite-ssg — that's normal.

```bash
cd /Users/samwang/webtools-united && npm run typecheck
```

Expected: PASS, zero errors.

- [ ] **Step 1.8: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "chore: scaffold vite + react + ts + tailwind + vitest"
```

---

## Task 2: Tool JSON schema + `validate-tools` script (TDD)

**Files:**
- Create: `src/tools/tool.schema.json`, `src/lib/types.ts`, `scripts/validate-tools.mjs`, `scripts/validate-tools.test.mjs`, `scripts/_fixtures/valid-tool.json`, `scripts/_fixtures/invalid-tool.json`

- [ ] **Step 2.1: Write the failing test**

`/Users/samwang/webtools-united/scripts/validate-tools.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateToolFile, validateAll } from "./validate-tools.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

test("accepts a valid submodule tool", () => {
  const result = validateToolFile(path.join(here, "_fixtures/valid-tool.json"));
  assert.equal(result.ok, true);
});

test("rejects when slug missing", () => {
  const result = validateToolFile(path.join(here, "_fixtures/invalid-tool.json"));
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /slug/);
});

test("rejects when slug does not match filename", () => {
  const result = validateToolFile(
    path.join(here, "_fixtures/valid-tool.json"),
    { expectedSlug: "wrong-slug" }
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /filename/);
});

test("rejects external tool with non-https url", () => {
  const result = validateToolFile(path.join(here, "_fixtures/valid-tool.json"), {
    overrideContent: { type: "external", url: "http://example.com", path: null },
  });
  assert.equal(result.ok, false);
});

test("validateAll returns map of file→result", () => {
  const result = validateAll(path.join(here, "_fixtures"));
  assert.ok("valid-tool.json" in result);
});
```

`/Users/samwang/webtools-united/scripts/_fixtures/valid-tool.json`:

```json
{
  "slug": "valid-tool",
  "type": "submodule",
  "path": "/valid-tool/",
  "url": null,
  "repo": "https://github.com/test/valid-tool",
  "icon": null,
  "i18n": {
    "en": { "title": "Valid Tool", "description": "A valid tool description." }
  },
  "tags": ["test"]
}
```

`/Users/samwang/webtools-united/scripts/_fixtures/invalid-tool.json`:

```json
{
  "type": "submodule",
  "i18n": { "en": { "title": "Missing slug", "description": "" } }
}
```

- [ ] **Step 2.2: Run the test to confirm it fails**

```bash
cd /Users/samwang/webtools-united && node --test scripts/validate-tools.test.mjs
```

Expected: FAIL — "Cannot find module './validate-tools.mjs'".

- [ ] **Step 2.3: Create the schema**

`/Users/samwang/webtools-united/src/tools/tool.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["slug", "type", "path", "url", "repo", "icon", "i18n"],
  "additionalProperties": false,
  "properties": {
    "slug": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" },
    "type": { "enum": ["submodule", "external"] },
    "path": { "type": ["string", "null"], "pattern": "^/[a-z0-9-]+/$" },
    "url": { "type": ["string", "null"], "pattern": "^https://" },
    "repo": { "type": "string", "pattern": "^https://" },
    "icon": { "type": ["string", "null"] },
    "i18n": {
      "type": "object",
      "required": ["en"],
      "additionalProperties": {
        "type": "object",
        "required": ["title", "description"],
        "properties": {
          "title": { "type": "string", "minLength": 1 },
          "description": { "type": "string", "minLength": 1 }
        },
        "additionalProperties": false
      }
    },
    "tags": { "type": "array", "items": { "type": "string", "pattern": "^[a-z0-9-]+$" } }
  },
  "allOf": [
    {
      "if": { "properties": { "type": { "const": "submodule" } } },
      "then": {
        "properties": {
          "path": { "type": "string" },
          "url": { "type": "null" }
        }
      }
    },
    {
      "if": { "properties": { "type": { "const": "external" } } },
      "then": {
        "properties": {
          "url": { "type": "string" },
          "path": { "type": "null" }
        }
      }
    }
  ]
}
```

- [ ] **Step 2.4: Implement validate-tools.mjs**

`/Users/samwang/webtools-united/scripts/validate-tools.mjs`:

```js
import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const schemaPath = path.join(repoRoot, "src/tools/tool.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export function validateToolFile(filePath, opts = {}) {
  const errors = [];
  let content;
  try {
    content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`parse error: ${e.message}`] };
  }
  if (opts.overrideContent) {
    content = { ...content, ...opts.overrideContent };
  }
  if (!validate(content)) {
    for (const err of validate.errors) {
      errors.push(`${err.instancePath || "/"} ${err.message}`);
    }
  }
  const expectedSlug = opts.expectedSlug ?? path.basename(filePath, ".json");
  if (content.slug !== expectedSlug) {
    errors.push(`slug "${content.slug}" must match filename "${expectedSlug}"`);
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateAll(toolsDir) {
  const out = {};
  const entries = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_") && f !== "tool.schema.json");
  for (const entry of entries) {
    out[entry] = validateToolFile(path.join(toolsDir, entry));
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const toolsDir = path.join(repoRoot, "src/tools");
  const results = validateAll(toolsDir);
  let bad = 0;
  for (const [file, result] of Object.entries(results)) {
    if (!result.ok) {
      bad++;
      console.error(`✖ ${file}`);
      for (const err of result.errors) console.error(`  - ${err}`);
    } else {
      console.log(`✓ ${file}`);
    }
  }
  process.exit(bad > 0 ? 1 : 0);
}
```

- [ ] **Step 2.5: Run the test to confirm it passes**

```bash
cd /Users/samwang/webtools-united && node --test scripts/validate-tools.test.mjs
```

Expected: PASS, 5/5 tests passing.

- [ ] **Step 2.6: Create the shared TS types**

`/Users/samwang/webtools-united/src/lib/types.ts`:

```ts
export type Lang = "en" | "zh-Hant";

export interface ToolI18n {
  title: string;
  description: string;
}

export interface Tool {
  slug: string;
  type: "submodule" | "external";
  path: string | null;
  url: string | null;
  repo: string;
  icon: string | null;
  i18n: Partial<Record<Lang, ToolI18n>> & { en: ToolI18n };
  tags?: string[];
}
```

- [ ] **Step 2.7: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: tool json schema + validator script"
```

---

## Task 3: i18n loader with partial English fallback (TDD)

**Files:**
- Create: `src/i18n/en.json`, `src/i18n/zh-Hant.json`, `src/i18n/index.ts`, `src/i18n/index.test.ts`

- [ ] **Step 3.1: Write the failing test**

`/Users/samwang/webtools-united/src/i18n/index.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { t, getToolStrings } from "./index";

describe("t()", () => {
  it("returns the requested-language string when present", () => {
    expect(t("en", "header.tagline")).toMatch(/web tools/i);
  });

  it("falls back to en when zh-Hant key missing", () => {
    expect(t("zh-Hant", "__nonexistent_key__")).toBe(t("en", "__nonexistent_key__"));
  });

  it("returns the key itself when missing in both", () => {
    expect(t("en", "__nonexistent_key__")).toBe("__nonexistent_key__");
  });
});

describe("getToolStrings()", () => {
  const tool = {
    slug: "x",
    type: "external" as const,
    path: null,
    url: "https://x",
    repo: "https://github.com/x/x",
    icon: null,
    i18n: { en: { title: "EN Title", description: "EN desc" } },
  };

  it("returns en when zh-Hant missing", () => {
    const out = getToolStrings(tool, "zh-Hant");
    expect(out.title).toBe("EN Title");
    expect(out.description).toBe("EN desc");
  });

  it("returns zh-Hant when present", () => {
    const t2 = {
      ...tool,
      i18n: { en: tool.i18n.en, "zh-Hant": { title: "中文", description: "中描述" } },
    };
    const out = getToolStrings(t2, "zh-Hant");
    expect(out.title).toBe("中文");
  });

  it("falls back per-key when partial", () => {
    const t2 = {
      ...tool,
      i18n: { en: tool.i18n.en, "zh-Hant": { title: "中文", description: "" } },
    };
    const out = getToolStrings(t2, "zh-Hant");
    expect(out.title).toBe("中文");
    expect(out.description).toBe("EN desc");
  });
});
```

- [ ] **Step 3.2: Run the test to confirm it fails**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/i18n
```

Expected: FAIL — "Cannot find module './index'".

- [ ] **Step 3.3: Create UI string files**

`/Users/samwang/webtools-united/src/i18n/en.json`:

```json
{
  "header.title": "tools365",
  "header.tagline": "A united directory of small web tools.",
  "search.placeholder": "Search tools…",
  "search.empty": "No tools match.",
  "search.suggest": "Suggest one →",
  "lang.label": "Language",
  "lang.en": "English",
  "lang.zh-Hant": "繁中",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.auto": "Auto",
  "theme.label": "Theme",
  "card.external": "External tool",
  "card.embedded": "Embedded tool",
  "footer.repo": "Source"
}
```

`/Users/samwang/webtools-united/src/i18n/zh-Hant.json`:

```json
{
  "header.title": "tools365",
  "header.tagline": "集結各式小工具的網站。",
  "search.placeholder": "搜尋工具…",
  "search.empty": "沒有符合的工具。",
  "search.suggest": "推薦一個 →",
  "lang.label": "語言",
  "lang.en": "English",
  "lang.zh-Hant": "繁中",
  "theme.light": "淺色",
  "theme.dark": "深色",
  "theme.auto": "自動",
  "theme.label": "主題",
  "card.external": "外部工具",
  "card.embedded": "內建工具",
  "footer.repo": "原始碼"
}
```

- [ ] **Step 3.4: Implement i18n/index.ts**

`/Users/samwang/webtools-united/src/i18n/index.ts`:

```ts
import en from "./en.json";
import zhHant from "./zh-Hant.json";
import type { Lang, Tool, ToolI18n } from "../lib/types";

const tables: Record<Lang, Record<string, string>> = {
  en,
  "zh-Hant": zhHant,
};

export function t(lang: Lang, key: string): string {
  return tables[lang][key] ?? tables.en[key] ?? key;
}

export function getToolStrings(tool: Tool, lang: Lang): ToolI18n {
  const wanted = tool.i18n[lang];
  const fallback = tool.i18n.en;
  return {
    title: wanted?.title || fallback.title,
    description: wanted?.description || fallback.description,
  };
}

export const SUPPORTED_LANGS: Lang[] = ["en", "zh-Hant"];
```

- [ ] **Step 3.5: Run the test to confirm it passes**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/i18n
```

Expected: PASS, all tests green.

- [ ] **Step 3.6: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: i18n loader with partial english fallback"
```

---

## Task 4: Tool loader (TDD)

**Files:**
- Create: `src/lib/tool-loader.ts`, `src/lib/tool-loader.test.ts`

- [ ] **Step 4.1: Write the failing test**

`/Users/samwang/webtools-united/src/lib/tool-loader.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadAllTools } from "./tool-loader";

describe("loadAllTools", () => {
  it("returns at least one tool when tool JSONs exist", () => {
    const tools = loadAllTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it("returns tools sorted by slug", () => {
    const tools = loadAllTools();
    const slugs = tools.map((t) => t.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  it("guarantees every tool has en i18n", () => {
    const tools = loadAllTools();
    for (const t of tools) {
      expect(t.i18n.en).toBeDefined();
      expect(t.i18n.en.title).toBeTruthy();
    }
  });
});
```

- [ ] **Step 4.2: Run the test to confirm it fails**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/tool-loader
```

Expected: FAIL — "Cannot find module './tool-loader'".

- [ ] **Step 4.3: Implement tool-loader.ts**

`/Users/samwang/webtools-united/src/lib/tool-loader.ts`:

```ts
import type { Tool } from "./types";

const modules = import.meta.glob("../tools/*.json", { eager: true }) as Record<
  string,
  { default: Tool }
>;

const tools: Tool[] = Object.entries(modules)
  .filter(([k]) => !k.endsWith("tool.schema.json"))
  .map(([, m]) => m.default)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function loadAllTools(): Tool[] {
  return tools;
}
```

- [ ] **Step 4.4: Add a placeholder tool JSON so the test has data**

We'll replace this with the real seed JSONs in Task 17. For now, create a single fixture:

`/Users/samwang/webtools-united/src/tools/wheel.json`:

```json
{
  "slug": "wheel",
  "type": "submodule",
  "path": "/wheel/",
  "url": null,
  "repo": "https://github.com/SamWang8891/wheel",
  "icon": null,
  "i18n": {
    "en": { "title": "Spinning Wheel", "description": "Random pick wheel for decisions and giveaways." },
    "zh-Hant": { "title": "輪盤抽選", "description": "隨機決定、抽獎用的轉盤工具。" }
  },
  "tags": ["random", "decision", "wheel"]
}
```

- [ ] **Step 4.5: Run the test to confirm it passes**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/tool-loader
```

Expected: PASS.

- [ ] **Step 4.6: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: tool loader via import.meta.glob"
```

---

## Task 5: Search wrapper around Fuse.js (TDD)

**Files:**
- Create: `src/lib/search.ts`, `src/lib/search.test.ts`

- [ ] **Step 5.1: Write the failing test**

`/Users/samwang/webtools-united/src/lib/search.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createSearcher } from "./search";
import type { Tool } from "./types";

const tools: Tool[] = [
  {
    slug: "wheel",
    type: "submodule",
    path: "/wheel/",
    url: null,
    repo: "https://github.com/x/wheel",
    icon: null,
    i18n: {
      en: { title: "Spinning Wheel", description: "Random picker." },
      "zh-Hant": { title: "輪盤抽選", description: "隨機選擇器。" },
    },
    tags: ["random"],
  },
  {
    slug: "qrcode-generator",
    type: "submodule",
    path: "/qrcode-generator/",
    url: null,
    repo: "https://github.com/x/qrcode-generator",
    icon: null,
    i18n: {
      en: { title: "QR Code Generator", description: "Make QR codes from text." },
    },
    tags: ["qr", "code"],
  },
];

describe("createSearcher", () => {
  it("returns all tools when query is empty", () => {
    const search = createSearcher(tools);
    expect(search("")).toHaveLength(2);
  });

  it("matches in English title", () => {
    const search = createSearcher(tools);
    const results = search("wheel");
    expect(results[0].slug).toBe("wheel");
  });

  it("matches in zh-Hant title regardless of UI lang", () => {
    const search = createSearcher(tools);
    const results = search("輪盤");
    expect(results[0].slug).toBe("wheel");
  });

  it("matches in tags", () => {
    const search = createSearcher(tools);
    const results = search("qr");
    expect(results.map((r) => r.slug)).toContain("qrcode-generator");
  });

  it("is fuzzy/typo-tolerant", () => {
    const search = createSearcher(tools);
    const results = search("whee");
    expect(results.map((r) => r.slug)).toContain("wheel");
  });
});
```

- [ ] **Step 5.2: Run the test to confirm it fails**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/search
```

Expected: FAIL — "Cannot find module './search'".

- [ ] **Step 5.3: Implement search.ts**

`/Users/samwang/webtools-united/src/lib/search.ts`:

```ts
import Fuse from "fuse.js";
import type { Tool } from "./types";

interface IndexedTool extends Tool {
  _searchTitle: string;
  _searchDescription: string;
  _searchTags: string;
}

function indexTool(tool: Tool): IndexedTool {
  const titles: string[] = [];
  const descriptions: string[] = [];
  for (const lang of Object.keys(tool.i18n)) {
    const block = tool.i18n[lang as keyof typeof tool.i18n];
    if (block?.title) titles.push(block.title);
    if (block?.description) descriptions.push(block.description);
  }
  return {
    ...tool,
    _searchTitle: titles.join(" "),
    _searchDescription: descriptions.join(" "),
    _searchTags: (tool.tags ?? []).join(" "),
  };
}

export function createSearcher(tools: Tool[]): (query: string) => Tool[] {
  const indexed = tools.map(indexTool);
  const fuse = new Fuse(indexed, {
    keys: [
      { name: "_searchTitle", weight: 0.6 },
      { name: "_searchDescription", weight: 0.3 },
      { name: "_searchTags", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: false,
  });
  return (query: string) => {
    if (!query.trim()) return tools;
    return fuse.search(query).map((r) => {
      const { _searchTitle, _searchDescription, _searchTags, ...rest } = r.item;
      return rest as Tool;
    });
  };
}
```

- [ ] **Step 5.4: Run the test to confirm it passes**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/search
```

Expected: PASS, 5/5.

- [ ] **Step 5.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: fuse.js search wrapper indexing all languages"
```

---

## Task 6: Theme system + anti-flash inline script (TDD)

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`

- [ ] **Step 6.1: Write the failing test**

`/Users/samwang/webtools-united/src/lib/theme.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveTheme, applyTheme, getStoredPreference, INLINE_SCRIPT } from "./theme";

describe("resolveTheme", () => {
  it("returns the explicit choice when not auto", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows prefers-color-scheme when auto", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets data-theme on <html>", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("getStoredPreference", () => {
  beforeEach(() => localStorage.clear());

  it("returns auto when nothing stored", () => {
    expect(getStoredPreference()).toBe("auto");
  });

  it("returns the stored preference if valid", () => {
    localStorage.setItem("wt-theme", "dark");
    expect(getStoredPreference()).toBe("dark");
  });

  it("returns auto for invalid stored value", () => {
    localStorage.setItem("wt-theme", "rainbow");
    expect(getStoredPreference()).toBe("auto");
  });
});

describe("INLINE_SCRIPT", () => {
  it("includes localStorage and matchMedia logic", () => {
    expect(INLINE_SCRIPT).toContain("wt-theme");
    expect(INLINE_SCRIPT).toContain("prefers-color-scheme");
  });
});
```

- [ ] **Step 6.2: Run the test to confirm it fails**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/theme
```

Expected: FAIL — module not found.

- [ ] **Step 6.3: Implement theme.ts**

`/Users/samwang/webtools-united/src/lib/theme.ts`:

```ts
export type ThemePreference = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "wt-theme";

export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (pref === "auto") return prefersDark ? "dark" : "light";
  return pref;
}

export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function getStoredPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "auto";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "auto") return v;
  return "auto";
}

export function setStoredPreference(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, pref);
}

// Inlined into <head> before paint to prevent flash-of-wrong-theme.
export const INLINE_SCRIPT = `
(function(){
  try {
    var p = localStorage.getItem('wt-theme');
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = (p === 'light' || p === 'dark') ? p : (dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', resolved);
  } catch(e) {}
})();
`.trim();
```

- [ ] **Step 6.4: Run the test to confirm it passes**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/theme
```

Expected: PASS.

- [ ] **Step 6.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: theme system with anti-flash inline script"
```

---

## Task 7: Components — Card, Header, SearchBar, LanguageSwitcher, ThemeToggle, Footer

**Files:**
- Create: `src/components/Card.tsx`, `Card.test.tsx`, `Header.tsx`, `SearchBar.tsx`, `LanguageSwitcher.tsx`, `ThemeToggle.tsx`, `Footer.tsx`

- [ ] **Step 7.1: Write Card test (failing)**

`/Users/samwang/webtools-united/src/components/Card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";
import type { Tool } from "../lib/types";

const submodule: Tool = {
  slug: "wheel",
  type: "submodule",
  path: "/wheel/",
  url: null,
  repo: "https://github.com/x/wheel",
  icon: null,
  i18n: { en: { title: "Spinning Wheel", description: "Random picker." } },
};

const external: Tool = {
  slug: "fastgoto",
  type: "external",
  path: null,
  url: "https://fastgoto.xyz",
  repo: "https://github.com/x/p",
  icon: null,
  i18n: { en: { title: "Fastgoto", description: "Quick launcher." } },
};

describe("Card", () => {
  it("renders title and description in given language", () => {
    render(<Card tool={submodule} lang="en" />);
    expect(screen.getByText("Spinning Wheel")).toBeInTheDocument();
    expect(screen.getByText("Random picker.")).toBeInTheDocument();
  });

  it("links to internal path for submodule tools", () => {
    render(<Card tool={submodule} lang="en" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/wheel/");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens external tools in new tab with safe rel", () => {
    render(<Card tool={external} lang="en" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://fastgoto.xyz");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
```

- [ ] **Step 7.2: Run to confirm it fails**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/components/Card
```

Expected: FAIL — module not found.

- [ ] **Step 7.3: Implement Card**

`/Users/samwang/webtools-united/src/components/Card.tsx`:

```tsx
import type { Tool, Lang } from "../lib/types";
import { getToolStrings, t } from "../i18n";

interface Props {
  tool: Tool;
  lang: Lang;
}

export function Card({ tool, lang }: Props) {
  const { title, description } = getToolStrings(tool, lang);
  const isExternal = tool.type === "external";
  const href = isExternal ? tool.url! : tool.path!;
  const badge = isExternal ? "🔗" : "📦";
  const badgeLabel = isExternal ? t(lang, "card.external") : t(lang, "card.embedded");
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group relative flex gap-4 rounded-lg border border-border bg-card p-4 hover:-translate-y-0.5 hover:shadow-md transition-transform"
    >
      <img
        src={`/favicons/${tool.slug}.png`}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-md object-contain bg-bg flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold truncate">{title}</h2>
        <p className="text-sm text-muted line-clamp-2">{description}</p>
      </div>
      <span
        title={badgeLabel}
        aria-label={badgeLabel}
        className="absolute right-3 top-3 text-xs"
      >
        {badge}
      </span>
    </a>
  );
}
```

- [ ] **Step 7.4: Run to confirm test passes**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/components/Card
```

Expected: PASS.

- [ ] **Step 7.5: Implement Header (no test — pure composition)**

`/Users/samwang/webtools-united/src/components/Header.tsx`:

```tsx
import type { Lang } from "../lib/types";
import { t } from "../i18n";
import { SearchBar } from "./SearchBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  lang: Lang;
  query: string;
  onQueryChange: (q: string) => void;
}

export function Header({ lang, query, onQueryChange }: Props) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3">
        <a href={lang === "en" ? "/" : "/zh-Hant/"} className="flex flex-col leading-tight mr-auto">
          <span className="font-bold text-lg">{t(lang, "header.title")}</span>
          <span className="text-xs text-muted hidden sm:inline">{t(lang, "header.tagline")}</span>
        </a>
        <SearchBar lang={lang} value={query} onChange={onQueryChange} />
        <LanguageSwitcher lang={lang} />
        <ThemeToggle lang={lang} />
      </div>
    </header>
  );
}
```

- [ ] **Step 7.6: Implement SearchBar**

`/Users/samwang/webtools-united/src/components/SearchBar.tsx`:

```tsx
import type { Lang } from "../lib/types";
import { t } from "../i18n";

interface Props {
  lang: Lang;
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ lang, value, onChange }: Props) {
  return (
    <input
      type="search"
      role="searchbox"
      aria-label={t(lang, "search.placeholder")}
      placeholder={t(lang, "search.placeholder")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-64 rounded-md border border-border bg-bg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}
```

- [ ] **Step 7.7: Implement LanguageSwitcher**

`/Users/samwang/webtools-united/src/components/LanguageSwitcher.tsx`:

```tsx
import type { Lang } from "../lib/types";
import { t } from "../i18n";

const ROUTES: Record<Lang, string> = {
  en: "/",
  "zh-Hant": "/zh-Hant/",
};

interface Props {
  lang: Lang;
}

export function LanguageSwitcher({ lang }: Props) {
  function go(target: Lang) {
    try {
      document.cookie = `wt-lang=${target}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
    location.href = ROUTES[target];
  }
  return (
    <div role="group" aria-label={t(lang, "lang.label")} className="text-sm flex rounded-md border border-border overflow-hidden">
      {(["en", "zh-Hant"] as Lang[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => go(opt)}
          aria-current={lang === opt ? "true" : undefined}
          className={`px-2.5 py-1 ${lang === opt ? "bg-accent text-white" : "hover:bg-bg"}`}
        >
          {t(lang, `lang.${opt}`)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7.8: Implement ThemeToggle**

`/Users/samwang/webtools-united/src/components/ThemeToggle.tsx`:

```tsx
import { useEffect, useState } from "react";
import type { Lang } from "../lib/types";
import { t } from "../i18n";
import {
  type ThemePreference,
  applyTheme,
  getStoredPreference,
  resolveTheme,
  setStoredPreference,
} from "../lib/theme";

const ICON: Record<ThemePreference, string> = {
  light: "☀",
  dark: "☾",
  auto: "◐",
};

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

interface Props {
  lang: Lang;
}

export function ThemeToggle({ lang }: Props) {
  const [pref, setPref] = useState<ThemePreference>("auto");

  useEffect(() => {
    setPref(getStoredPreference());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(resolveTheme(pref, mq.matches));
    update();
    if (pref === "auto") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, [pref]);

  function cycle() {
    const next = NEXT[pref];
    setPref(next);
    setStoredPreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t(lang, "theme.label")}: ${t(lang, `theme.${pref}`)}`}
      title={t(lang, `theme.${pref}`)}
      className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-bg"
    >
      <span aria-hidden="true">{ICON[pref]}</span>
    </button>
  );
}
```

- [ ] **Step 7.9: Implement Footer**

`/Users/samwang/webtools-united/src/components/Footer.tsx`:

```tsx
import type { Lang } from "../lib/types";
import { t } from "../i18n";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>© 2026 webtools-united</span>
        <a
          href="https://github.com/SamWang8891/webtools-united"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-fg"
        >
          {t(lang, "footer.repo")}: SamWang8891/webtools-united
        </a>
        <span className="ml-auto">MIT</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 7.10: Run all component tests**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/components
```

Expected: PASS.

- [ ] **Step 7.11: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: card, header, search, language, theme, footer components"
```

---

## Task 8: Home page composing everything

**Files:**
- Create: `src/pages/Home.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 8.1: Implement Home**

`/Users/samwang/webtools-united/src/pages/Home.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../lib/types";
import { loadAllTools } from "../lib/tool-loader";
import { createSearcher } from "../lib/search";
import { t } from "../i18n";
import { Header } from "../components/Header";
import { Card } from "../components/Card";
import { Footer } from "../components/Footer";

interface Props {
  lang: Lang;
}

const DEBOUNCE_MS = 150;

export function Home({ lang }: Props) {
  const tools = useMemo(() => loadAllTools(), []);
  const search = useMemo(() => createSearcher(tools), [tools]);
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof location !== "undefined" && location.hash.startsWith("#q=")) {
      const initial = decodeURIComponent(location.hash.slice(3));
      setRaw(initial);
      setQuery(initial);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setQuery(raw), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  useEffect(() => {
    if (typeof history === "undefined") return;
    const newHash = query ? `#q=${encodeURIComponent(query)}` : "";
    if (location.hash !== newHash) {
      history.replaceState(null, "", `${location.pathname}${location.search}${newHash}`);
    }
  }, [query]);

  const results = search(query);

  return (
    <div className="min-h-screen flex flex-col">
      <Header lang={lang} query={raw} onQueryChange={setRaw} />
      <main className="mx-auto max-w-6xl w-full px-4 py-6 flex-1">
        {results.length === 0 ? (
          <div className="text-center text-muted py-12">
            <p>{t(lang, "search.empty")}</p>
            <a
              href="https://github.com/SamWang8891/webtools-united/issues/new?template=tool-suggestion.md"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(lang, "search.suggest")}
            </a>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((tool) => (
              <li key={tool.slug}>
                <Card tool={tool} lang={lang} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
```

- [ ] **Step 8.2: Delete the placeholder App.tsx (replaced by multi-route main.tsx in next step)**

```bash
rm /Users/samwang/webtools-united/src/App.tsx
```

- [ ] **Step 8.3: Update main.tsx for vite-ssg multi-route**

`/Users/samwang/webtools-united/src/main.tsx`:

```tsx
import { ViteSSG } from "vite-ssg";
import type { Lang } from "./lib/types";
import { Home } from "./pages/Home";
import "./styles/tailwind.css";

const routes = [
  { path: "/", component: () => <Home lang="en" /> },
  { path: "/zh-Hant/", component: () => <Home lang="zh-Hant" /> },
];

export const createApp = ViteSSG(
  () => null,
  { routes: routes.map((r) => ({ path: r.path, component: r.component })) },
  ({ app, router }) => {
    // hook for hreflang/title injection later
  }
);
```

> **Note:** `vite-ssg`'s router-driven mode is the right fit for two prerendered routes. If the API surface differs from the version installed, prefer the official `vite-ssg` README for the installed version.

- [ ] **Step 8.4: Run dev server and visit both routes (smoke test, manual)**

```bash
cd /Users/samwang/webtools-united && npm run dev
```

Open `http://localhost:5173/` and `http://localhost:5173/zh-Hant/` in a browser. Confirm both render with the wheel card. Stop the server.

- [ ] **Step 8.5: Run typecheck**

```bash
cd /Users/samwang/webtools-united && npm run typecheck
```

Expected: PASS.

- [ ] **Step 8.6: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: home page with search, debounce, hash-state, empty state"
```

---

## Task 9: SSG hreflang + JSON-LD ItemList + meta tags

**Files:**
- Modify: `src/main.tsx`, `index.html`
- Create: `src/lib/seo.ts`, `src/lib/seo.test.ts`

- [ ] **Step 9.1: Write the failing test**

`/Users/samwang/webtools-united/src/lib/seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildItemListJsonLd, buildHreflangLinks, getPageMeta } from "./seo";

describe("buildItemListJsonLd", () => {
  it("emits a valid ItemList for a list of tools", () => {
    const tools = [
      {
        slug: "x",
        type: "external" as const,
        path: null,
        url: "https://x",
        repo: "https://github.com/x/x",
        icon: null,
        i18n: { en: { title: "X", description: "Y" } },
      },
    ];
    const json = buildItemListJsonLd(tools, "en", "https://tools365.link");
    expect(json["@type"]).toBe("ItemList");
    expect(json.itemListElement[0]).toMatchObject({ "@type": "ListItem", position: 1 });
  });
});

describe("buildHreflangLinks", () => {
  it("includes both langs and x-default", () => {
    const links = buildHreflangLinks("https://tools365.link");
    const langs = links.map((l) => l.hreflang);
    expect(langs).toContain("en");
    expect(langs).toContain("zh-Hant");
    expect(langs).toContain("x-default");
  });
});

describe("getPageMeta", () => {
  it("returns en title and description for en", () => {
    const meta = getPageMeta("en");
    expect(meta.title).toMatch(/tools365/);
    expect(meta.description).toBeTruthy();
    expect(meta.lang).toBe("en");
  });
});
```

- [ ] **Step 9.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/seo
```

Expected: FAIL.

- [ ] **Step 9.3: Implement seo.ts**

`/Users/samwang/webtools-united/src/lib/seo.ts`:

```ts
import type { Lang, Tool } from "./types";
import { getToolStrings, t } from "../i18n";

export const SITE_ORIGIN = "https://tools365.link";

const PATH_BY_LANG: Record<Lang, string> = {
  en: "/",
  "zh-Hant": "/zh-Hant/",
};

export function buildHreflangLinks(origin: string = SITE_ORIGIN) {
  return [
    { hreflang: "en", href: `${origin}/` },
    { hreflang: "zh-Hant", href: `${origin}/zh-Hant/` },
    { hreflang: "x-default", href: `${origin}/` },
  ];
}

export function getPageMeta(lang: Lang) {
  return {
    lang,
    title: `${t(lang, "header.title")} — ${t(lang, "header.tagline")}`,
    description: t(lang, "header.tagline"),
    canonical: `${SITE_ORIGIN}${PATH_BY_LANG[lang]}`,
  };
}

export function buildItemListJsonLd(tools: Tool[], lang: Lang, origin: string = SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t(lang, "header.title"),
    itemListElement: tools.map((tool, i) => {
      const { title, description } = getToolStrings(tool, lang);
      const url = tool.type === "external" ? tool.url! : `${origin}${tool.path}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: title,
        description,
        url,
      };
    }),
  };
}
```

- [ ] **Step 9.4: Run, confirm pass**

```bash
cd /Users/samwang/webtools-united && npx vitest run src/lib/seo
```

Expected: PASS.

- [ ] **Step 9.5: Wire SEO into vite-ssg**

`/Users/samwang/webtools-united/src/main.tsx`:

```tsx
import { ViteSSG } from "vite-ssg";
import type { Lang } from "./lib/types";
import { Home } from "./pages/Home";
import { loadAllTools } from "./lib/tool-loader";
import { buildHreflangLinks, buildItemListJsonLd, getPageMeta, SITE_ORIGIN } from "./lib/seo";
import { INLINE_SCRIPT } from "./lib/theme";
import "./styles/tailwind.css";

const ROUTES: { path: string; lang: Lang }[] = [
  { path: "/", lang: "en" },
  { path: "/zh-Hant/", lang: "zh-Hant" },
];

export const createApp = ViteSSG(
  () => null,
  {
    routes: ROUTES.map((r) => ({
      path: r.path,
      component: () => <Home lang={r.lang} />,
      meta: { lang: r.lang },
    })),
  },
  ({ router, isClient, initialState }) => {
    if (isClient) return;
    router.afterEach((to) => {
      const lang = (to.meta?.lang as Lang) ?? "en";
      const meta = getPageMeta(lang);
      const tools = loadAllTools();
      const headTags: { tag: string; attrs?: Record<string, string>; content?: string }[] = [
        { tag: "title", content: meta.title },
        { tag: "meta", attrs: { name: "description", content: meta.description } },
        { tag: "meta", attrs: { name: "viewport", content: "width=device-width, initial-scale=1" } },
        { tag: "link", attrs: { rel: "canonical", href: meta.canonical } },
        ...buildHreflangLinks().map((h) => ({
          tag: "link",
          attrs: { rel: "alternate", hreflang: h.hreflang, href: h.href },
        })),
        { tag: "meta", attrs: { property: "og:title", content: meta.title } },
        { tag: "meta", attrs: { property: "og:description", content: meta.description } },
        { tag: "meta", attrs: { property: "og:url", content: meta.canonical } },
        { tag: "meta", attrs: { property: "og:type", content: "website" } },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary" } },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify(buildItemListJsonLd(tools, lang, SITE_ORIGIN)),
        },
        { tag: "script", content: INLINE_SCRIPT },
      ];
      if (initialState) initialState.head = { lang, tags: headTags };
    });
  }
);
```

> **Note:** the way `vite-ssg` injects per-route head tags depends on the version. The exact API may use `useHead`, `Head`, or transform options. Adapt the wiring above to whichever the installed `vite-ssg` exposes — the important thing is that the SSG'd HTML for `/` and `/zh-Hant/` ends up with the title, description, hreflang `<link>`s, the JSON-LD `<script>`, and the theme inline script in `<head>`. If the installed version has a simpler integration (e.g. a per-route hook), use that instead.

- [ ] **Step 9.6: Build and inspect output HTML**

```bash
cd /Users/samwang/webtools-united && npx vite-ssg build
```

Expected: builds without error. Inspect `dist/index.html` and `dist/zh-Hant/index.html` — both contain the relevant `<title>`, hreflang `<link>`s, and JSON-LD.

```bash
grep -l "ItemList" /Users/samwang/webtools-united/dist/*.html /Users/samwang/webtools-united/dist/zh-Hant/*.html
```

Expected: both files listed.

- [ ] **Step 9.7: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: ssg meta tags, hreflang, json-ld itemlist"
```

---

## Task 10: Sitemap + robots generator (TDD)

**Files:**
- Create: `scripts/generate-sitemap.mjs`, `scripts/generate-sitemap.test.mjs`

- [ ] **Step 10.1: Write the failing test**

`/Users/samwang/webtools-united/scripts/generate-sitemap.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSitemap, buildRobotsTxt } from "./generate-sitemap.mjs";

test("buildSitemap emits both languages", () => {
  const xml = buildSitemap("https://tools365.link");
  assert.match(xml, /<loc>https:\/\/tools365\.link\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/tools365\.link\/zh-Hant\/<\/loc>/);
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
});

test("buildRobotsTxt allows all and references sitemap", () => {
  const txt = buildRobotsTxt("https://tools365.link");
  assert.match(txt, /User-agent: \*/);
  assert.match(txt, /Allow: \//);
  assert.match(txt, /Sitemap: https:\/\/tools365\.link\/sitemap\.xml/);
});
```

- [ ] **Step 10.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && node --test scripts/generate-sitemap.test.mjs
```

Expected: FAIL.

- [ ] **Step 10.3: Implement generate-sitemap.mjs**

`/Users/samwang/webtools-united/scripts/generate-sitemap.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const ORIGIN = "https://tools365.link";

export function buildSitemap(origin = ORIGIN) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${origin}/`, lang: "en", alt: `${origin}/zh-Hant/` },
    { loc: `${origin}/zh-Hant/`, lang: "zh-Hant", alt: `${origin}/` },
  ];
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <xhtml:link rel="alternate" hreflang="${u.lang === "en" ? "zh-Hant" : "en"}" href="${u.alt}" />
    <xhtml:link rel="alternate" hreflang="${u.lang}" href="${u.loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

export function buildRobotsTxt(origin = ORIGIN) {
  return `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = path.join(repoRoot, "dist");
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, "sitemap.xml"), buildSitemap());
  fs.writeFileSync(path.join(dist, "robots.txt"), buildRobotsTxt());
  console.log("✓ sitemap.xml and robots.txt written");
}
```

- [ ] **Step 10.4: Run, confirm pass**

```bash
cd /Users/samwang/webtools-united && node --test scripts/generate-sitemap.test.mjs
```

Expected: PASS.

- [ ] **Step 10.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: sitemap.xml and robots.txt generator"
```

---

## Task 11: Favicon fetcher (TDD)

**Files:**
- Create: `scripts/fetch-favicons.mjs`, `scripts/fetch-favicons.test.mjs`, `public/favicons/.gitkeep`

- [ ] **Step 11.1: Write the failing test**

`/Users/samwang/webtools-united/scripts/fetch-favicons.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveFaviconUrl, originOf } from "./fetch-favicons.mjs";

test("originOf returns the origin of an https url", () => {
  assert.equal(originOf("https://example.com/path"), "https://example.com");
});

test("resolveFaviconUrl picks a <link rel=icon> when present", () => {
  const html = `<html><head><link rel="icon" href="/icons/me.png" sizes="64x64"></head></html>`;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://example.com/icons/me.png",
  );
});

test("resolveFaviconUrl handles absolute href", () => {
  const html = `<link rel="icon" href="https://cdn.example.com/i.png">`;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://cdn.example.com/i.png",
  );
});

test("resolveFaviconUrl falls back to /favicon.ico when none found", () => {
  assert.equal(resolveFaviconUrl("<html></html>", "https://example.com"), "https://example.com/favicon.ico");
});

test("resolveFaviconUrl prefers larger size when multiple present", () => {
  const html = `
    <link rel="icon" href="/small.png" sizes="16x16">
    <link rel="icon" href="/big.png" sizes="180x180">
  `;
  assert.equal(
    resolveFaviconUrl(html, "https://example.com"),
    "https://example.com/big.png",
  );
});
```

- [ ] **Step 11.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && node --test scripts/fetch-favicons.test.mjs
```

Expected: FAIL.

- [ ] **Step 11.3: Implement fetch-favicons.mjs**

`/Users/samwang/webtools-united/scripts/fetch-favicons.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const ICONS_OVERRIDE_DIR = path.join(TOOLS_DIR, "icons");
const OUT_DIR = path.join(repoRoot, "public/favicons");

export function originOf(url) {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function resolveFaviconUrl(html, origin) {
  const links = [...html.matchAll(/<link[^>]*rel=["']?(?:shortcut )?icon["']?[^>]*>/gi)].map(
    (m) => m[0],
  );
  if (links.length === 0) return `${origin}/favicon.ico`;
  let best = null;
  let bestSize = -1;
  for (const tag of links) {
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const sizesAttr = (tag.match(/sizes=["']([^"']+)["']/i) || [])[1];
    const size = sizesAttr ? parseInt(sizesAttr.split("x")[0], 10) || 0 : 0;
    if (size > bestSize) {
      bestSize = size;
      best = href;
    }
  }
  if (!best) return `${origin}/favicon.ico`;
  return new URL(best, origin).toString();
}

async function fetchBuf(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function targetUrlForTool(tool) {
  if (tool.type === "external") return tool.url;
  // submodule tools — use the production deployment as a reasonable fallback.
  return tool.repo.replace("github.com", "raw.githubusercontent.com");
}

async function processTool(tool) {
  const outFile = path.join(OUT_DIR, `${tool.slug}.png`);
  if (tool.icon) {
    const src = path.join(ICONS_OVERRIDE_DIR, tool.icon);
    if (!fs.existsSync(src)) throw new Error(`icon override missing: ${src}`);
    fs.copyFileSync(src, outFile);
    return { slug: tool.slug, source: "override" };
  }
  if (fs.existsSync(outFile) && process.env.FORCE_REFETCH !== "1") {
    return { slug: tool.slug, source: "cached" };
  }
  if (tool.type !== "external") {
    if (!fs.existsSync(outFile)) {
      console.warn(`⚠ ${tool.slug}: submodule with no icon override and no cached favicon — leaving blank`);
    }
    return { slug: tool.slug, source: "skipped" };
  }
  const origin = originOf(tool.url);
  let html = "";
  try {
    const res = await fetch(origin, { redirect: "follow" });
    html = await res.text();
  } catch (e) {
    console.warn(`⚠ ${tool.slug}: failed to fetch HTML (${e.message}), trying /favicon.ico`);
  }
  const iconUrl = resolveFaviconUrl(html, origin);
  try {
    const buf = await fetchBuf(iconUrl);
    fs.writeFileSync(outFile, buf);
    return { slug: tool.slug, source: "fetched", url: iconUrl };
  } catch (e) {
    console.warn(`⚠ ${tool.slug}: ${e.message}`);
    return { slug: tool.slug, source: "failed" };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  for (const tool of tools) {
    const r = await processTool(tool);
    console.log(`${r.source === "failed" ? "✖" : "✓"} ${r.slug} (${r.source})`);
  }
}
```

`/Users/samwang/webtools-united/public/favicons/.gitkeep`: empty file.

- [ ] **Step 11.4: Run, confirm pass**

```bash
cd /Users/samwang/webtools-united && node --test scripts/fetch-favicons.test.mjs
```

Expected: PASS, 5/5.

- [ ] **Step 11.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: favicon fetcher with override + cache"
```

---

## Task 12: Submodule build script

**Files:**
- Create: `scripts/build-submodules.mjs`

- [ ] **Step 12.1: Implement build-submodules.mjs**

`/Users/samwang/webtools-united/scripts/build-submodules.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const VENDOR_DIR = path.join(repoRoot, "tools-vendored");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const DIST_DIR = path.join(repoRoot, "dist");

function readSubmoduleTools() {
  return fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")))
    .filter((t) => t.type === "submodule");
}

function buildOne(tool) {
  const dir = path.join(VENDOR_DIR, tool.slug);
  if (!fs.existsSync(dir)) {
    throw new Error(`submodule not checked out: ${dir} (run \`git submodule update --init\`)`);
  }
  console.log(`▶ building ${tool.slug}…`);
  execSync("npm ci", { cwd: dir, stdio: "inherit" });
  execSync("npm run build", { cwd: dir, stdio: "inherit" });
  const srcDist = path.join(dir, "dist");
  if (!fs.existsSync(srcDist)) {
    throw new Error(`${tool.slug}: build did not produce dist/`);
  }
  const target = path.join(DIST_DIR, tool.slug);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(srcDist, target, { recursive: true });
  console.log(`✓ ${tool.slug} → dist/${tool.slug}/`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  const tools = readSubmoduleTools();
  for (const tool of tools) {
    buildOne(tool);
  }
  console.log(`done — built ${tools.length} submodule tool(s)`);
}
```

- [ ] **Step 12.2: Smoke-test script signature**

```bash
cd /Users/samwang/webtools-united && node -e "import('./scripts/build-submodules.mjs').then(()=>console.log('imported ok'))"
```

Expected: prints `imported ok`. (Submodules aren't added yet so the build itself won't run until Task 17.)

- [ ] **Step 12.3: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: submodule build script"
```

---

## Task 13: README tool table updater (TDD)

**Files:**
- Create: `scripts/update-readme-tools.mjs`, `scripts/update-readme-tools.test.mjs`

- [ ] **Step 13.1: Write the failing test**

`/Users/samwang/webtools-united/scripts/update-readme-tools.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildToolsTable, replaceMarkers } from "./update-readme-tools.mjs";

const tools = [
  {
    slug: "wheel",
    type: "submodule",
    path: "/wheel/",
    url: null,
    repo: "https://github.com/x/wheel",
    icon: null,
    i18n: { en: { title: "Wheel", description: "Random pick." } },
  },
  {
    slug: "fastgoto",
    type: "external",
    path: null,
    url: "https://fastgoto.xyz",
    repo: "https://github.com/x/p",
    icon: null,
    i18n: { en: { title: "Fastgoto", description: "Quick launcher." } },
  },
];

test("buildToolsTable produces a markdown table", () => {
  const table = buildToolsTable(tools);
  assert.match(table, /\| Tool \| Type \| Description \|/);
  assert.match(table, /\[Wheel\]\(\/wheel\/\)/);
  assert.match(table, /\[Fastgoto\]\(https:\/\/fastgoto\.xyz\)/);
  assert.match(table, /embedded/);
  assert.match(table, /external/);
});

test("replaceMarkers substitutes the marker block", () => {
  const original = `# Title\n<!-- BEGIN TOOLS -->\nold content\n<!-- END TOOLS -->\nfooter`;
  const out = replaceMarkers(original, "NEW");
  assert.match(out, /<!-- BEGIN TOOLS -->\nNEW\n<!-- END TOOLS -->/);
  assert.match(out, /^# Title/);
  assert.match(out, /footer$/);
});

test("replaceMarkers leaves file unchanged when markers absent", () => {
  const original = "# Title\nno markers";
  assert.equal(replaceMarkers(original, "NEW"), original);
});
```

- [ ] **Step 13.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && node --test scripts/update-readme-tools.test.mjs
```

Expected: FAIL.

- [ ] **Step 13.3: Implement update-readme-tools.mjs**

`/Users/samwang/webtools-united/scripts/update-readme-tools.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const README = path.join(repoRoot, "README.md");

const BEGIN = "<!-- BEGIN TOOLS -->";
const END = "<!-- END TOOLS -->";

export function buildToolsTable(tools) {
  const lines = ["| Tool | Type | Description |", "| --- | --- | --- |"];
  const sorted = [...tools].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const t of sorted) {
    const href = t.type === "external" ? t.url : t.path;
    const title = t.i18n.en.title;
    const desc = t.i18n.en.description.replace(/\|/g, "\\|");
    const type = t.type === "external" ? "external" : "embedded";
    lines.push(`| [${title}](${href}) | ${type} | ${desc} |`);
  }
  return lines.join("\n");
}

export function replaceMarkers(content, replacement) {
  const re = new RegExp(`(${BEGIN})[\\s\\S]*?(${END})`);
  if (!re.test(content)) return content;
  return content.replace(re, `$1\n${replacement}\n$2`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(README)) {
    console.log("README.md not found, skipping");
    process.exit(0);
  }
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  const original = fs.readFileSync(README, "utf8");
  const updated = replaceMarkers(original, buildToolsTable(tools));
  if (updated === original) {
    console.log("README.md: no markers found or no change");
  } else {
    fs.writeFileSync(README, updated);
    console.log("✓ README.md tools table updated");
  }
}
```

- [ ] **Step 13.4: Run, confirm pass**

```bash
cd /Users/samwang/webtools-united && node --test scripts/update-readme-tools.test.mjs
```

Expected: PASS.

- [ ] **Step 13.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: readme tools table auto-updater"
```

---

## Task 14: i18n coverage checker (TDD)

**Files:**
- Create: `scripts/check-i18n.mjs`, `scripts/check-i18n.test.mjs`

- [ ] **Step 14.1: Write the failing test**

`/Users/samwang/webtools-united/scripts/check-i18n.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { findMissingUiKeys, findMissingToolKeys, formatReport } from "./check-i18n.mjs";

test("findMissingUiKeys reports keys in en but not zh-Hant", () => {
  const en = { a: "A", b: "B" };
  const zh = { a: "甲" };
  const missing = findMissingUiKeys(en, zh);
  assert.deepEqual(missing, ["b"]);
});

test("findMissingUiKeys returns [] when full coverage", () => {
  const en = { a: "A" };
  const zh = { a: "甲" };
  assert.deepEqual(findMissingUiKeys(en, zh), []);
});

test("findMissingToolKeys reports per-tool missing fields", () => {
  const tools = [
    { slug: "x", i18n: { en: { title: "X", description: "Y" } } },
    { slug: "y", i18n: { en: { title: "Y", description: "Z" }, "zh-Hant": { title: "尾", description: "" } } },
  ];
  const out = findMissingToolKeys(tools, "zh-Hant");
  assert.deepEqual(out, [
    { slug: "x", missing: ["title", "description"] },
    { slug: "y", missing: ["description"] },
  ]);
});

test("formatReport produces a markdown summary", () => {
  const md = formatReport({
    ui: { "zh-Hant": ["foo"] },
    tools: { "zh-Hant": [{ slug: "x", missing: ["title"] }] },
  });
  assert.match(md, /Translation coverage/);
  assert.match(md, /foo/);
  assert.match(md, /x/);
});

test("formatReport says all-clear when nothing missing", () => {
  const md = formatReport({ ui: {}, tools: {} });
  assert.match(md, /All translations present/);
});
```

- [ ] **Step 14.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && node --test scripts/check-i18n.test.mjs
```

Expected: FAIL.

- [ ] **Step 14.3: Implement check-i18n.mjs**

`/Users/samwang/webtools-united/scripts/check-i18n.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const I18N_DIR = path.join(repoRoot, "src/i18n");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const BASE_LANG = "en";

export function findMissingUiKeys(base, other) {
  return Object.keys(base).filter((k) => !(k in other) || other[k] === "");
}

export function findMissingToolKeys(tools, lang) {
  const out = [];
  for (const tool of tools) {
    const block = tool.i18n[lang];
    const missing = [];
    if (!block || !block.title) missing.push("title");
    if (!block || !block.description) missing.push("description");
    if (missing.length > 0) out.push({ slug: tool.slug, missing });
  }
  return out;
}

export function formatReport({ ui, tools }) {
  const empty =
    Object.values(ui).every((arr) => arr.length === 0) &&
    Object.values(tools).every((arr) => arr.length === 0);
  if (empty) return "## Translation coverage\n\n✅ All translations present.";
  const parts = ["## Translation coverage", ""];
  for (const [lang, keys] of Object.entries(ui)) {
    if (keys.length === 0) continue;
    parts.push(`**UI strings missing in \`${lang}\`:**`);
    for (const k of keys) parts.push(`- \`${k}\``);
    parts.push("");
  }
  for (const [lang, items] of Object.entries(tools)) {
    if (items.length === 0) continue;
    parts.push(`**Tool strings missing in \`${lang}\`:**`);
    for (const item of items) parts.push(`- **${item.slug}**: ${item.missing.join(", ")}`);
    parts.push("");
  }
  parts.push("_This is informational — the build will not fail._");
  return parts.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const enUi = JSON.parse(fs.readFileSync(path.join(I18N_DIR, "en.json"), "utf8"));
  const otherLangs = fs
    .readdirSync(I18N_DIR)
    .filter((f) => f.endsWith(".json") && f !== "en.json")
    .map((f) => ({ lang: f.replace(/\.json$/, ""), data: JSON.parse(fs.readFileSync(path.join(I18N_DIR, f), "utf8")) }));
  const tools = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
    .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")));
  const ui = {};
  const toolReport = {};
  for (const { lang, data } of otherLangs) {
    ui[lang] = findMissingUiKeys(enUi, data);
    toolReport[lang] = findMissingToolKeys(tools, lang);
  }
  const report = formatReport({ ui, tools: toolReport });
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `report<<EOF\n${report}\nEOF\n`);
  }
  console.log(report);
}
```

- [ ] **Step 14.4: Run, confirm pass**

```bash
cd /Users/samwang/webtools-united && node --test scripts/check-i18n.test.mjs
```

Expected: PASS.

- [ ] **Step 14.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: i18n coverage reporter"
```

---

## Task 15: Cloudflare Worker (TDD)

**Files:**
- Create: `worker/index.ts`, `worker/index.test.ts`, `worker/redirects.gen.ts` (will be generated by build), `scripts/generate-worker-redirects.mjs`

- [ ] **Step 15.1: Write the failing test**

`/Users/samwang/webtools-united/worker/index.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "./index.ts";

const REDIRECTS = { fastgoto: "https://fastgoto.xyz", clippy: "https://clippy.smashit.tw" };
const fakeAssets = { fetch: async () => new Response("asset", { status: 200 }) };

test("redirects /fastgoto to its url", async () => {
  const res = await handle(new Request("https://tools365.link/fastgoto"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://fastgoto.xyz");
});

test("redirects /fastgoto/ (trailing slash) too", async () => {
  const res = await handle(new Request("https://tools365.link/fastgoto/"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
});

test("first visit to / with zh Accept-Language redirects", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "zh-TW,zh;q=0.9,en;q=0.5" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/zh-Hant/");
  assert.match(res.headers.get("set-cookie") || "", /wt-lang=zh-Hant/);
});

test("first visit to / with en Accept-Language sets cookie and serves asset", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "en-US,en;q=0.9" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("set-cookie") || "", /wt-lang=en/);
});

test("second visit (cookie present) does not redirect", async () => {
  const req = new Request("https://tools365.link/", {
    headers: { "accept-language": "zh", cookie: "wt-lang=en" },
  });
  const res = await handle(req, { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
});

test("unknown path falls through to assets", async () => {
  const res = await handle(new Request("https://tools365.link/unknown"), { ASSETS: fakeAssets } as any, REDIRECTS);
  assert.equal(res.status, 200);
});
```

- [ ] **Step 15.2: Run, confirm fail**

```bash
cd /Users/samwang/webtools-united && node --test --import tsx/esm worker/index.test.ts
```

Expected: FAIL — module not present.

> If `tsx` isn't installed: `npm install -D tsx`. Add it to `devDependencies` in `package.json`.

- [ ] **Step 15.3: Implement worker/index.ts**

`/Users/samwang/webtools-united/worker/index.ts`:

```ts
import { REDIRECTS } from "./redirects.gen";

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export async function handle(
  request: Request,
  env: Env,
  redirects: Record<string, string> = REDIRECTS,
): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, "");
  if (slug && redirects[slug]) {
    return Response.redirect(redirects[slug], 302);
  }
  if (url.pathname === "/" || url.pathname === "") {
    const cookie = parseCookie(request.headers.get("cookie") || "");
    if (!cookie["wt-lang"]) {
      const accept = (request.headers.get("accept-language") || "").toLowerCase();
      const wantsZh = /^zh\b|[, ]zh\b/.test(accept) && !/^en\b/.test(accept);
      const lang = wantsZh ? "zh-Hant" : "en";
      const headers = new Headers({
        "set-cookie": `wt-lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
      });
      if (wantsZh) {
        headers.set("location", "/zh-Hant/");
        return new Response(null, { status: 302, headers });
      }
      const upstream = await env.ASSETS.fetch(request);
      const merged = new Headers(upstream.headers);
      merged.append("set-cookie", headers.get("set-cookie")!);
      return new Response(upstream.body, { status: upstream.status, headers: merged });
    }
  }
  return env.ASSETS.fetch(request);
}

function parseCookie(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = rest.join("=");
  }
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
```

`/Users/samwang/webtools-united/worker/redirects.gen.ts`:

```ts
// Generated by scripts/generate-worker-redirects.mjs — do not edit by hand.
export const REDIRECTS: Record<string, string> = {};
```

`/Users/samwang/webtools-united/scripts/generate-worker-redirects.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const TOOLS_DIR = path.join(repoRoot, "src/tools");
const OUT = path.join(repoRoot, "worker/redirects.gen.ts");

const tools = fs
  .readdirSync(TOOLS_DIR)
  .filter((f) => f.endsWith(".json") && f !== "tool.schema.json")
  .map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf8")))
  .filter((t) => t.type === "external");

const map = Object.fromEntries(tools.map((t) => [t.slug, t.url]));
const body = `// Generated by scripts/generate-worker-redirects.mjs — do not edit by hand.
export const REDIRECTS: Record<string, string> = ${JSON.stringify(map, null, 2)};
`;
fs.writeFileSync(OUT, body);
console.log(`✓ worker/redirects.gen.ts written (${tools.length} entries)`);
```

Wire the generator into the build by editing `package.json` `scripts.build:worker`:

```json
"build:worker": "node scripts/generate-worker-redirects.mjs && esbuild worker/index.ts --bundle --format=esm --platform=neutral --target=es2022 --outfile=dist-worker/index.js"
```

- [ ] **Step 15.4: Install tsx and run worker tests**

```bash
cd /Users/samwang/webtools-united && npm install -D tsx
```

Update the `test` script in package.json to use tsx for worker tests:

```json
"test": "vitest run && node --test scripts/*.test.mjs && node --test --import tsx/esm worker/*.test.ts"
```

Run:

```bash
cd /Users/samwang/webtools-united && npm test
```

Expected: all tests pass.

- [ ] **Step 15.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: cloudflare worker with redirects + accept-language detection"
```

---

## Task 16: Wrangler config

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 16.1: Create wrangler.toml**

`/Users/samwang/webtools-united/wrangler.toml`:

```toml
name = "tools365"
main = "dist-worker/index.js"
compatibility_date = "2026-05-01"

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "404-page"

[[routes]]
pattern = "tools365.link/*"
zone_name = "tools365.link"
custom_domain = true
```

- [ ] **Step 16.2: Verify wrangler reads the config without parse errors**

```bash
cd /Users/samwang/webtools-united && npx wrangler types --config wrangler.toml 2>&1 | tail -5
```

Expected: succeeds (writes types) or warns about missing bindings — both prove the TOML parses. A red TOML syntax error would tell us to fix it.

- [ ] **Step 16.3: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: wrangler config for cloudflare workers static assets"
```

---

## Task 17: Add submodules + remaining seed tool JSONs

**Files:**
- Modify: `src/tools/wheel.json` (already exists from Task 4)
- Create: `src/tools/qrcode-generator.json`, `src/tools/fastgoto.json`, `src/tools/clippy.json`
- Add submodules: `tools-vendored/wheel`, `tools-vendored/qrcode-generator`

- [ ] **Step 17.1: Add submodules**

```bash
cd /Users/samwang/webtools-united && git submodule add git@github.com:SamWang8891/wheel.git tools-vendored/wheel
cd /Users/samwang/webtools-united && git submodule add git@github.com:SamWang8891/qrcode-generator.git tools-vendored/qrcode-generator
```

Expected: creates `.gitmodules`, clones both repos.

> **If SSH cloning fails** (no key set up in this environment), substitute the HTTPS URLs:
> ```
> git submodule add https://github.com/SamWang8891/wheel.git tools-vendored/wheel
> git submodule add https://github.com/SamWang8891/qrcode-generator.git tools-vendored/qrcode-generator
> ```

- [ ] **Step 17.2: Add remaining tool JSONs**

`/Users/samwang/webtools-united/src/tools/qrcode-generator.json`:

```json
{
  "slug": "qrcode-generator",
  "type": "submodule",
  "path": "/qrcode-generator/",
  "url": null,
  "repo": "https://github.com/SamWang8891/qrcode-generator",
  "icon": null,
  "i18n": {
    "en": { "title": "QR Code Generator", "description": "Make QR codes from text or URLs, right in the browser." },
    "zh-Hant": { "title": "QR Code 產生器", "description": "在瀏覽器內把文字或網址轉成 QR Code。" }
  },
  "tags": ["qr", "generator", "code"]
}
```

`/Users/samwang/webtools-united/src/tools/fastgoto.json`:

```json
{
  "slug": "fastgoto",
  "type": "external",
  "path": null,
  "url": "https://fastgoto.xyz",
  "repo": "https://github.com/SamWang8891/pika",
  "icon": null,
  "i18n": {
    "en": { "title": "Fastgoto", "description": "Quick browser launcher and link organizer." },
    "zh-Hant": { "title": "Fastgoto", "description": "快速啟動瀏覽器分頁與連結整理。" }
  },
  "tags": ["productivity", "launcher", "links"]
}
```

`/Users/samwang/webtools-united/src/tools/clippy.json`:

```json
{
  "slug": "clippy",
  "type": "external",
  "path": null,
  "url": "https://clippy.smashit.tw",
  "repo": "https://github.com/SamWang8891/clippy",
  "icon": null,
  "i18n": {
    "en": { "title": "Clippy", "description": "Clipboard utility for quick copy and share." },
    "zh-Hant": { "title": "Clippy", "description": "快速複製與分享的剪貼簿小工具。" }
  },
  "tags": ["clipboard", "utility"]
}
```

- [ ] **Step 17.3: Validate**

```bash
cd /Users/samwang/webtools-united && npm run validate
```

Expected: `✓` for all four tools.

- [ ] **Step 17.4: Run favicon fetcher (network required)**

```bash
cd /Users/samwang/webtools-united && npm run build:favicons
```

Expected: fetches favicons for `fastgoto` and `clippy` (external tools); skips `wheel` and `qrcode-generator` with a warning (no override committed yet — expected, contributor may add later).

- [ ] **Step 17.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "feat: add submodules + seed tool jsons"
```

---

## Task 18: GitHub Actions workflows

**Files:**
- Create: `.github/workflows/ci.yml`, `i18n-coverage.yml`, `auto-seo.yml`, `auto-seo-dispatch.yml`, `deploy.yml`, `.github/ISSUE_TEMPLATE/tool-suggestion.md`

- [ ] **Step 18.1: ci.yml — required, blocking**

`/Users/samwang/webtools-united/.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run validate
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
        env:
          # required so vite-ssg can render with absolute URLs
          VITE_SITE_ORIGIN: https://tools365.link
```

- [ ] **Step 18.2: i18n-coverage.yml — informational only**

`/Users/samwang/webtools-united/.github/workflows/i18n-coverage.yml`:

```yaml
name: i18n coverage
on:
  pull_request:
    branches: [main]

permissions:
  pull-requests: write
  contents: read

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - id: i18n
        run: |
          REPORT=$(node scripts/check-i18n.mjs)
          {
            echo 'report<<EOF'
            echo "$REPORT"
            echo 'EOF'
          } >> "$GITHUB_OUTPUT"
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: i18n-coverage
          message: ${{ steps.i18n.outputs.report }}
```

- [ ] **Step 18.3: auto-seo.yml — prompts user for confirmation**

`/Users/samwang/webtools-united/.github/workflows/auto-seo.yml`:

```yaml
name: auto-seo prompt
on:
  pull_request:
    branches: [main]
    paths:
      - 'src/tools/**'
      - 'src/i18n/**'

permissions:
  pull-requests: write
  contents: read

jobs:
  prompt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.sha }}
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - id: detect
        run: |
          # Compare HEAD vs base — does the PR change tool JSONs without regenerating downstream files?
          BASE=${{ github.event.pull_request.base.sha }}
          CHANGED=$(git diff --name-only "$BASE"...HEAD)
          NEEDS=0
          if echo "$CHANGED" | grep -q '^src/tools/.*\.json$'; then
            if ! echo "$CHANGED" | grep -q '^public/favicons/'; then NEEDS=1; fi
          fi
          echo "needs=$NEEDS" >> "$GITHUB_OUTPUT"
      - if: steps.detect.outputs.needs == '1'
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: auto-seo
          message: |
            This PR adds or changes a tool but doesn't include regenerated SEO files (favicons, sitemap, README table).

            Reply with **`/regen-seo`** and I'll generate them and push the changes back to this branch.
```

- [ ] **Step 18.4: auto-seo-dispatch.yml — runs on /regen-seo comment**

`/Users/samwang/webtools-united/.github/workflows/auto-seo-dispatch.yml`:

```yaml
name: auto-seo dispatch
on:
  issue_comment:
    types: [created]

permissions:
  pull-requests: write
  contents: write

jobs:
  regen:
    if: |
      github.event.issue.pull_request &&
      startsWith(github.event.comment.body, '/regen-seo')
    runs-on: ubuntu-latest
    steps:
      - name: Verify commenter authorization
        id: auth
        uses: actions/github-script@v7
        with:
          script: |
            const { data: pr } = await github.rest.pulls.get({
              owner: context.repo.owner, repo: context.repo.repo,
              pull_number: context.issue.number,
            });
            const commenter = context.payload.comment.user.login;
            const author = pr.user.login;
            let ok = commenter === author;
            if (!ok) {
              const { data: perm } = await github.rest.repos.getCollaboratorPermissionLevel({
                owner: context.repo.owner, repo: context.repo.repo, username: commenter,
              });
              ok = ['admin', 'write'].includes(perm.permission);
            }
            if (!ok) {
              await github.rest.reactions.createForIssueComment({
                owner: context.repo.owner, repo: context.repo.repo,
                comment_id: context.payload.comment.id, content: '-1',
              });
              core.setFailed('not authorized');
              return;
            }
            core.setOutput('ref', pr.head.ref);
            core.setOutput('repo', pr.head.repo.full_name);
      - uses: actions/checkout@v4
        with:
          repository: ${{ steps.auth.outputs.repo }}
          ref: ${{ steps.auth.outputs.ref }}
          token: ${{ secrets.GITHUB_TOKEN }}
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run validate
      - run: npm run build:favicons
      - run: npm run build:seo
      - run: npm run build:readme
      - name: Commit and push
        id: commit
        run: |
          git config user.name "seo-bot"
          git config user.email "seo-bot@users.noreply.github.com"
          git add public/favicons README.md dist/sitemap.xml dist/robots.txt 2>/dev/null || true
          if git diff --cached --quiet; then
            echo "no-op"
            echo "sha=" >> "$GITHUB_OUTPUT"
          else
            git commit -m "chore: regenerate seo artifacts"
            git push
            echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"
          fi
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: auto-seo
          message: |
            ${{ steps.commit.outputs.sha && format('Done — pushed `{0}`.', steps.commit.outputs.sha) || 'Nothing to regenerate.' }}
```

- [ ] **Step 18.5: deploy.yml**

`/Users/samwang/webtools-united/.github/workflows/deploy.yml`:

```yaml
name: deploy
on:
  push:
    branches: [main]

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run build:worker
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

- [ ] **Step 18.6: Issue template**

`/Users/samwang/webtools-united/.github/ISSUE_TEMPLATE/tool-suggestion.md`:

```markdown
---
name: Suggest a tool
about: Propose a new tool to add to the directory
title: "Suggestion: <tool name>"
labels: suggestion
---

**Tool name:**

**URL or repo:**

**One-sentence description:**

**Why it belongs here:**
- [ ] Single-purpose
- [ ] No login required
- [ ] No ads or trackers
- [ ] No data collection
```

- [ ] **Step 18.7: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "ci: add ci, i18n-coverage, auto-seo, deploy workflows"
```

---

## Task 19: README + CONTRIBUTING + LICENSE

**Files:**
- Create: `README.md`, `CONTRIBUTING.md`, `LICENSE`

- [ ] **Step 19.1: Create LICENSE (MIT)**

`/Users/samwang/webtools-united/LICENSE`:

```
MIT License

Copyright (c) 2026 SamWang8891

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 19.2: Create README.md**

`/Users/samwang/webtools-united/README.md`:

````markdown
# webtools-united

A curated, multilingual directory of small web tools, hosted at **[tools365.link](https://tools365.link)**.

Some tools are **embedded** (vendored as git submodules and built into the same domain at `/<slug>/`). Others are **external** links to tools hosted elsewhere. Either way, they show up as a card on the homepage with a favicon, title, and short description, in your choice of English or Traditional Chinese.

## Tools

<!-- BEGIN TOOLS -->
| Tool | Type | Description |
| --- | --- | --- |
<!-- END TOOLS -->

> The table above is auto-regenerated from `src/tools/*.json` on every PR.

## Tech

- **Vite + React + TypeScript**, statically rendered with **`vite-ssg`** so every page ships real HTML for SEO.
- **Tailwind CSS** for styling, dark/light/auto themes via CSS variables.
- **Fuse.js** for fuzzy, language-agnostic card search.
- **Cloudflare Workers Static Assets** for hosting; a small Worker handles first-visit language detection and external-tool slug redirects.

## Local development

```bash
git clone --recurse-submodules https://github.com/SamWang8891/webtools-united.git
cd webtools-united
npm install
npm run dev          # local dev server
npm run build        # full build (validates, builds submodules, fetches favicons, SSG, sitemap, README)
npm run preview      # preview the built dist/
npm test             # run all tests
```

## Repo structure

```
src/tools/         — one JSON per tool (data source)
src/components/    — UI components (Card, Header, …)
src/lib/           — search, theme, i18n loader, types
src/i18n/          — UI strings: en.json, zh-Hant.json
tools-vendored/    — git submodules of embedded tools
worker/            — Cloudflare Worker (redirects + lang detect)
scripts/           — build-time generators (favicons, sitemap, README)
.github/workflows/ — CI, deploy, i18n coverage, auto-SEO bot
```

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**. Adding a tool is a single new JSON file under `src/tools/` — PRs from different contributors never conflict on a shared registry.

## License

[MIT](LICENSE).
````

- [ ] **Step 19.3: Create CONTRIBUTING.md**

`/Users/samwang/webtools-united/CONTRIBUTING.md`:

````markdown
# Contributing

Thanks for considering an addition. The contribution process is designed so adding a tool means adding **one new file** — your PR won't conflict with anyone else's, no matter how many are open at the same time.

## What kinds of tools belong here

- Small, single-purpose web tools.
- No login or account required.
- No advertising, no trackers, no data collection.
- Reasonably useful or fun.

If you're not sure, open an issue first using the "Suggest a tool" template.

## Adding an external-link tool

1. Fork this repo and create a branch.
2. Create `src/tools/<slug>.json` (lowercase, kebab-case slug — must match the filename):

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
       "zh-Hant": { "title": "你的工具", "description": "一句話描述工具用途。" }
     },
     "tags": ["category", "keyword"]
   }
   ```

3. Open the PR. CI will validate the JSON.
4. After CI runs, comment **`/regen-seo`** on your PR. The bot will fetch the favicon, regenerate the sitemap and README table, and push a commit back to your branch.

The `zh-Hant` entry is optional — if you only provide English, the site falls back per-string to English. The `i18n-coverage` workflow will post a friendly comment noting any missing translations, but it won't fail the build.

## Adding a submodule (embedded) tool

Same as above plus:

1. Add the submodule before opening the PR:

   ```bash
   git submodule add https://github.com/you/your-tool.git tools-vendored/your-tool
   ```

2. Use `"type": "submodule"`, set `"path": "/your-tool/"`, leave `"url": null`.
3. Your tool's repo must produce static output via `npm run build` → `dist/`.

## Icon override

Auto-fetching from the URL works for most external tools. If it doesn't, or you want better quality, drop a square PNG (≥64×64) in `src/tools/icons/your-tool.png` and reference it in your JSON:

```json
"icon": "your-tool.png"
```

## Translations

You can also send translation-only PRs. Edit `src/i18n/en.json` or `src/i18n/zh-Hant.json` (or add the missing language inside any `src/tools/*.json`). The translation-coverage workflow comments on every PR listing exactly what's missing where.

## What CI checks

- **Required (blocking):** JSON-Schema, full build (incl. submodules), TypeScript type-check, all tests pass.
- **Informational:** translation coverage, auto-SEO prompt.

## Why one-file-per-tool

Every tool gets its own file under `src/tools/`. A central registry would force every contributor to edit the same line, producing constant merge conflicts. With one file per tool, two contributors adding two different tools never touch the same line.
````

- [ ] **Step 19.4: Run README updater**

```bash
cd /Users/samwang/webtools-united && npm run build:readme
```

Expected: `✓ README.md tools table updated` — the table between markers is now populated.

- [ ] **Step 19.5: Commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "docs: readme, contributing, license"
```

---

## Task 20: Full integration build + smoke test

**Files:** none new.

- [ ] **Step 20.1: Run full build**

```bash
cd /Users/samwang/webtools-united && npm run build
```

Expected:
- `validate` passes for all four tool JSONs.
- `build:submodules` builds `wheel` and `qrcode-generator`, copies their `dist/` to `dist/wheel/` and `dist/qrcode-generator/`.
- `build:favicons` populates `public/favicons/` for the external tools.
- `vite-ssg build` renders `dist/index.html` and `dist/zh-Hant/index.html`.
- `build:seo` writes `dist/sitemap.xml` and `dist/robots.txt`.
- `build:readme` updates the README tools table.

- [ ] **Step 20.2: Run worker bundle build**

```bash
cd /Users/samwang/webtools-united && npm run build:worker
```

Expected: `dist-worker/index.js` produced; `worker/redirects.gen.ts` updated with `fastgoto` and `clippy` mappings.

- [ ] **Step 20.3: Verify dist contents**

```bash
ls /Users/samwang/webtools-united/dist /Users/samwang/webtools-united/dist/zh-Hant /Users/samwang/webtools-united/dist/wheel | head -30
test -s /Users/samwang/webtools-united/dist/sitemap.xml && echo "sitemap.xml OK"
test -s /Users/samwang/webtools-united/dist/robots.txt && echo "robots.txt OK"
grep -c "ItemList" /Users/samwang/webtools-united/dist/index.html
```

Expected: directory listings, `sitemap.xml OK`, `robots.txt OK`, JSON-LD count ≥ 1.

- [ ] **Step 20.4: Preview locally**

```bash
cd /Users/samwang/webtools-united && npm run preview
```

In a browser: visit `http://localhost:4173/`, `http://localhost:4173/zh-Hant/`, `http://localhost:4173/wheel/`, `http://localhost:4173/qrcode-generator/`. Verify:
- Homepage renders with all four cards in both languages.
- Search filters cards as you type.
- Theme toggle cycles light → dark → auto.
- Language switcher swaps URLs and language correctly.
- Submodule tools render under their paths.

Stop the preview server.

- [ ] **Step 20.5: Run all tests**

```bash
cd /Users/samwang/webtools-united && npm test
```

Expected: all tests pass.

- [ ] **Step 20.6: Final commit**

```bash
cd /Users/samwang/webtools-united && git add -A && git commit -m "chore: regenerate build artifacts"
```

---

## Done

The site is build-able, deploy-able, testable, and contributable. Next time you (or a contributor) push to `main`, the `deploy.yml` workflow runs `wrangler deploy` and updates `tools365.link`. Configure the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets in the repo's GitHub settings before the first deploy.
