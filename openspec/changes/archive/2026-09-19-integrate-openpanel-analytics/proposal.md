## Why

The site has no visibility into traffic or feature usage. Adding privacy-respecting, self-hosted OpenPanel analytics gives basic usage insight (page views, which converter actions people actually use) without sending user-entered timestamp/date values anywhere, preserving the site's existing "nothing you type leaves this tab" privacy claim.

## What Changes

- Add the OpenPanel init script and loader `<script>` tag to `index.html` and `faq.html`, pointed at the self-hosted instance (`apiUrl: https://openpanel.themkvz.com/api`), with `trackScreenViews`, `trackOutgoingLinks`, and `trackAttributes` enabled.
- Load the tracker script (`op1.js`) from the self-hosted domain (`https://openpanel.themkvz.com/op1.js`), not the public `openpanel.dev` CDN — the self-hosted instance serves the loader on the same origin as `/api`, so both the script and event ingestion come from one domain with no separate reverse proxy required.
- Instrument interaction events via `data-track` attributes on the converter's buttons (Use current time, each copy button) — no custom JS needed for these.
- Track the two select inputs (interpret-as timezone mode, unix unit) via explicit `window.op('track', ...)` calls in `src/timestamp/converter.ts`, since attribute-based tracking only fires on clicks.
- Session replay stays disabled (left commented out, matching the site's privacy stance).

## Capabilities

### New Capabilities
- `analytics`: Client-side event tracking (page views and converter interactions) sent to a self-hosted OpenPanel instance, without transmitting any timestamp/date value the user enters.

### Modified Capabilities
(none — no existing capability's requirements change)

## Impact

- Affected files: `index.html`, `faq.html` (script tags), `src/timestamp/converter.ts` (two `window.op('track', ...)` calls for select changes).
- New external dependency at runtime: `https://openpanel.themkvz.com` (both `/op1.js` script and `/api` event ingestion), a third-party network call the current privacy copy ("no network request contains what you enter") needs to keep being true of — only UI interaction metadata is sent, never timestamp/date field values.
- No build-time dependency added (no npm package; it's a plain script tag).
