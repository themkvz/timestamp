## Context

Static two-page site (`index.html`, `faq.html`) built with Bun/Vite-style tooling, deployed to
Cloudflare Pages (`wrangler.toml`). No existing CSP header, no npm-installed analytics SDK — OpenPanel
is added as a plain `<script>` tag, matching how the site already loads everything else. See
proposal.md - Why for motivation.

## Goals / Non-Goals

**Goals:**
- Wire up the OpenPanel script tag on both pages, pointed at the self-hosted API.
- Track the converter's real interactions (not just page views) using the least code possible.
- Keep the site's "nothing you type leaves this tab" privacy claim true.

**Non-Goals:**
- Setting up a reverse proxy in front of the self-hosted instance — unnecessary, since
  `openpanel.themkvz.com` already serves both `/op1.js` and `/api` on one origin.
- Enabling session replay (left commented out per the user's supplied snippet).
- Any server-side or build-time change — this is markup + a few JS calls.

## Decisions

### Script source: self-hosted `openpanel.themkvz.com/op1.js`
The user asked whether to use the `openpanel.dev`-hosted loader script or serve it from
`openpanel.themkvz.com`. OpenPanel's own self-hosting docs default to `apiUrl` pointed at the
self-hosted instance while still loading `op1.js` from `https://openpanel.dev/op1.js` — the CDN
loader talks to whatever `apiUrl` it's initialized with, so self-hosting the API doesn't strictly
require self-hosting the static loader file too. This design originally recommended keeping that
default (least infrastructure).

**Revised decision: the user manually replaced the loader `<script src>` with
`https://openpanel.themkvz.com/op1.js` in both `index.html` and `faq.html` after implementation.**
The self-hosted instance does serve `op1.js` on its own origin (verified: `200 text/javascript`), so
this works without a separate reverse proxy — the OpenPanel self-hosted app apparently serves the
loader itself alongside `/api`, not just the ingestion endpoint. Net effect: every OpenPanel asset
(loader script + event ingestion) now comes from `openpanel.themkvz.com`, which also sidesteps the
ad-blocker-evasion motivation for a proxy noted below, since block-lists that target `openpanel.dev`
no longer apply. Both pages were kept consistent on this domain.

### Event tracking: `data-track` attributes where possible, explicit calls only where required
`trackAttributes: true` (already in the user's snippet) makes any element with `data-track` fire an
event on click automatically, with sibling `data-*` attributes becoming event properties — no JS
needed. That covers the "Use current time" button and the four copy buttons.

The two `<select>` inputs (timezone mode, unix unit) don't emit click events on selection the way a
button does, so `data-track` attribute tracking won't reliably fire for them. Those two get one
`window.op('track', 'event_name', { property: ... })` call each, added to the existing `change`
listeners already in `src/timestamp/converter.ts` — no new listener, just one extra line per handler.

**Alternative considered**: track everything via explicit `window.op('track', ...)` calls for
consistency. Rejected — it's strictly more code for the button/copy cases the declarative attributes
already handle for free.

**Correction found during verification**: `op1.js`'s `trackAttributes` click handler only recognizes
`data-track` on `<button>` and `<a>` elements (`event.target.closest('button')` /
`closest('a')` — confirmed by reading the shipped script source). It silently does nothing on any
other element. This means the date/time input, Unix value input, and FAQ `<summary>` elements cannot
use declarative `data-track` at all, regardless of `trackAttributes: true`. They're tracked via
explicit `window.op('track', ...)` calls instead: a `focus` listener per input in `converter.ts`
(fires once per engagement, never the typed value), and a `toggle` event listener per FAQ `<details>`
in a small inline script in `faq.html` (also reports open/closed state, which a click-only mechanism
couldn't distinguish anyway). Internal nav links use `data-track` normally since they're `<a>`
elements.

### No new build dependency
The OpenPanel snippet is inlined as a `<script>` tag, same as the existing JSON-LD blocks in
`index.html`. No `@openpanel/web` npm package, since the app has no bundler-driven client dependency
graph today (it's plain `<script type="module">` pointed at `converter.ts`) and the script-tag approach
is what the user supplied.

### Privacy copy stays accurate
`index.html`'s "Privacy" section currently states network requests never contain what a visitor
enters. Per the spec's "No user-entered values transmitted" requirement, tracked event properties are
restricted to control identity (which field, which mode) — never a date, timestamp, or formatted
output value — so that claim remains true. This change does not alter the wording of that section.

## Risks / Trade-offs

- [Ad-blockers block `openpanel.themkvz.com`, undercounting traffic] → Reduced vs. using
  `openpanel.dev`, since generic ad-blocker lists are less likely to match a custom self-hosted
  domain; not eliminated.
- [A future edit accidentally adds a `data-*` value containing a live field value to a tracked
  element] → Spec requirement makes this an explicit contract; code review should check any new
  `data-track` element against it.
- [`op1.js` fails to load (self-hosted instance down) with no fallback] → Acceptable; the script tag
  doesn't gate any page functionality — the converter and FAQ work identically with analytics absent.
  Now correlated with the API endpoint being on the same host, so an outage affects both together.
