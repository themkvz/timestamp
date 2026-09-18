# Release handoff

The local production artifact is `dist/`. Do not perform the following external actions without explicit approval:

1. Upload `dist/` to the Cloudflare Pages project for `timestamp.themkvz.com`.
2. Attach or update the `timestamp.themkvz.com` custom domain.
3. Add `https://timestamp.themkvz.com` to the main site's `content/tools/02-timestamp.mdx`.

After an approved deployment, confirm `/`, `/faq/`, copy success/fallback, and same-origin network activity on the production origin. Roll back by restoring the previous Cloudflare Pages deployment and reverting the main-site URL change if one was made.
