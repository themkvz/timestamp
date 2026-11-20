# AGENTS.md

## Overview

**Timestamp** (`https://unixstamp.dev`) is a static, local-first Unix timestamp converter (Unix seconds/milliseconds ↔ UTC ISO 8601 and browser local time).

- **Hosting:** Cloudflare Pages project `timestamp` (`dist/`), custom domain `unixstamp.dev`. No backend or Workers functions.
- **Issue tracker:** Orbit, project `Timestamp` (`TIME`).
- **Analytics:** Self-hosted OpenPanel (`https://openpanel.themkvz.com`). Tracks page views and UI interaction metadata only—never entered values or converted results.

## Stack & Structure

- **Runtime / bundler:** Bun (`1.4.2` pinned via `BUN_VERSION` on Pages)
- **UI:** Plain HTML (`index.html`, `faq.html`), `@knadh/oat`, `@fontsource-variable/geist`, `nanostores`. No framework.
- **Lint / format / types:** Biome (`biome.json`), TypeScript (`tsc --noEmit`), Lefthook pre-commit (`bun run check`).
- **Tests:** `bun test` with `happy-dom` and `axe-core`.

Key paths:
- `index.html`, `faq.html` — entry pages (also copied to `dist/faq/index.html` by the build).
- `src/timestamp/time.ts` — pure conversion core (integer milliseconds, explicit date parts, no locale parsing, no natural-language dates).
- `src/timestamp/converter.ts` — DOM bindings + `nanostores` atom.
- `scripts/build.ts` — bundles pages into `dist/`, copies `public/`, strips empty chunks/hashed public duplicates, and generates `dist/_headers` (strict CSP with SHA-256 hashes of inline scripts, `nosniff`, `Referrer-Policy`, immutable cache for `/chunk-*`).
- `public/` — static assets (`robots.txt`, `sitemap.xml`, `llms.txt`, icons, `social.png`).
- `tests/` — `time.test.ts`, `converter.test.ts`, `accessibility.test.ts`, `discoverability.test.ts`.
- `openspec/specs/` — active capability specs. Do not edit `openspec/changes/archive/`.

## Commands

```sh
bun install --frozen-lockfile
bun run dev          # local dev server (/ and /faq)
bun run build        # build dist/ and dist/_headers
bun run test         # rebuild dist/ + TZ=America/New_York bun test
bun run check        # biome format check + biome lint + tsc --noEmit
bun run format       # biome format --write .
```

## Working Rules

- **Verify before finishing:** Run `bun run test && bun run check`. Tests must run with `TZ=America/New_York` (handled by `bun run test`) so DST gap/overlap assertions are deterministic.
- **Privacy invariant:** Never log, store, send to OpenPanel, or put user-entered timestamps/dates in URLs.
- **CSP & assets:** `scripts/build.ts` auto-hashes inline `<script>` tags into `dist/_headers`. Avoid introducing inline styles or third-party origins outside `https://openpanel.themkvz.com`. Keep `social.png` under 100 KB (`1200x630`).
- **Specs:** Keep `openspec/specs/` in sync with behavior changes; leave `openspec/changes/archive/` untouched.
- **Approvals:** Never commit, push, or run `wrangler pages deploy` without explicit user approval.
