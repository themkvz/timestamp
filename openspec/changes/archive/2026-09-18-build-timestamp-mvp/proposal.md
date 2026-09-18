## Why

The main site promises a Timestamp tool but does not yet link to a working product. Build a focused,
local-first converter that gives developers exact Unix/date conversions in a fast, indexable site
without sending entered values anywhere.

## What Changes

- Create a static multi-page Timestamp site whose homepage contains a bidirectional converter and
  whose FAQ is available as a separate indexable page.
- Convert one instant between explicit Unix seconds or milliseconds, a date/time interpreted as
  local time or UTC, UTC ISO 8601, and a localized representation.
- Provide current-time and copy actions, inline validation, and accessible behavior across keyboard,
  reduced-motion, forced-colors, light, and dark environments.
- Build the interface with semantic HTML, modern browser APIs, vanilla TypeScript, and locally bundled
  Oat CSS and JavaScript components.
- Produce static, crawler-readable output with canonical metadata, structured data, social previews,
  icons, a manifest, robots directives, and a sitemap.
- Add the minimal Bun development, verification, build, and Cloudflare Pages deployment setup.
- Keep analytics out of this change. Anonymous OpenPanel analytics is planned immediately after the
  MVP, and must never receive entered date/time values.
- Leave natural-language parsing, arbitrary IANA timezone conversion, relative-time calculations,
  share URLs, and a manual theme switcher for later changes.

## Capabilities

### New Capabilities

- `app-shell`: Static multi-page delivery, shared navigation, privacy boundaries, theming, and baseline
  accessibility.
- `timestamp-converter`: Bidirectional Unix/date conversion, validation, current-time, formatted
  representations, and copy behavior.
- `faq-page`: Indexable answers to the product's core timestamp, timezone, precision, and privacy
  questions.
- `discoverability`: Search, social, structured-data, icon, manifest, robots, and sitemap contracts.

### Modified Capabilities

<!-- None. -->

## Impact

- Introduces the application source, static public assets, Bun scripts, tests, formatting/type-checking
  configuration, and Cloudflare Pages configuration in this currently empty repository.
- Adds `@knadh/oat`, `nanostores`, and the locally bundled Fontsource Geist variable font as the only
  production package dependencies. Development-only tooling may include TypeScript, Biome, Bun types,
  lefthook, and Wrangler.
- Produces a static `dist/` artifact intended for `https://timestamp.themkvz.com/`; publishing it and
  adding the resulting URL to the main site's `content/tools/02-timestamp.mdx` remain externally
  visible follow-up actions requiring confirmation.
