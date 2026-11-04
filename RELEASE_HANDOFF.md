# Release handoff

The local production artifact is `dist/`. Do not perform the following external actions without explicit approval:

1. Upload `dist/` to the Cloudflare Pages project for `timestamp.themkvz.com`.
2. Attach or update the `timestamp.themkvz.com` custom domain.
3. Change links to `https://timestamp.themkvz.com` on other sites.

After an approved deployment, confirm `/`, `/faq/`, copy success/fallback, and that network activity on the production origin goes only to that origin or to `https://openpanel.themkvz.com` (analytics), with no entered values in analytics requests. Roll back by restoring the previous Cloudflare Pages deployment and reverting any link change that was made.
