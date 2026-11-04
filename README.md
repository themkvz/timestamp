# Timestamp

Static, local-first Unix timestamp converter. Entered values stay in the current page and are never sent anywhere; there is no API or server runtime.

The pages load self-hosted [OpenPanel](https://openpanel.dev) analytics from `https://openpanel.themkvz.com`. It records page views, outgoing link clicks and interaction events (which field, unit, time-zone mode, navigation link or FAQ question was used), but not the values you enter.

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

Browser smoke test: verify a Unix value and a UTC date-time in both directions, use Tab through controls, test Copy with and without clipboard access, visit `/faq/`, check a narrow viewport plus dark/reduced-motion/forced-colors modes, disable JavaScript for the FAQ, and confirm every request goes either to the serving origin or to `https://openpanel.themkvz.com` (analytics), and that no analytics request contains an entered value.

## Deployment — separate approval required

`wrangler.jsonc` targets static `dist/` output only; it has no bindings or functions. Its only variable is `BUN_VERSION`, which pins the Bun version used by the Cloudflare Pages build. Do not deploy without explicit approval.

After approval, create/configure the Cloudflare Pages project, then upload the verified artifact:

```sh
bunx wrangler pages deploy dist --project-name timestamp
```

Attach `timestamp.themkvz.com` in Cloudflare Pages, run the browser smoke test against the production origin, then add `https://timestamp.themkvz.com` to the main site's `content/tools/02-timestamp.mdx` only with separate approval. Roll back by restoring the preceding Pages deployment and reverting that main-site link if it was added.

## License

[MIT](LICENSE)
