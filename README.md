# Timestamp

Static, local-first Unix timestamp converter. Entered values stay in the current page; the MVP has no analytics, storage, API, or server runtime.

## Local development

```sh
bun install --frozen-lockfile
bun run dev
```

Open the URL printed by Bun. The FAQ is available at `/faq`.

## Verification

```sh
bun run check
bun run test
bun run build
```

`bun run test` rebuilds `dist/` before running conversion, DOM, accessibility, and discoverability checks.

Browser smoke test: verify a Unix value and a UTC date-time in both directions, use Tab through controls, test Copy with and without clipboard access, visit `/faq/`, check a narrow viewport plus dark/reduced-motion/forced-colors modes, disable JavaScript for the FAQ, and confirm every request stays on the serving origin.

## Deployment — separate approval required

`wrangler.toml` targets static `dist/` output only; it has no bindings, functions, or environment variables. Do not deploy without explicit approval.

After approval, create/configure the Cloudflare Pages project, then upload the verified artifact:

```sh
bunx wrangler pages deploy dist --project-name timestamp
```

Attach `timestamp.themkvz.com` in Cloudflare Pages, run the browser smoke test against the production origin, then add `https://timestamp.themkvz.com` to the main site's `content/tools/02-timestamp.mdx` only with separate approval. Roll back by restoring the preceding Pages deployment and reverting that main-site link if it was added.
