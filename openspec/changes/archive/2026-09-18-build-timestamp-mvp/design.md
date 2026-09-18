## Context

The repository contains only OpenSpec configuration. The sibling URL Inspector establishes the
preferred operational shape: Bun for package management, development, build, and tests; strict
TypeScript; Biome and lefthook; a static `dist/`; and Cloudflare Pages direct upload. Timestamp is
smaller: it has one synchronized value, two documents, and no need for a component framework or
client-side router. See `proposal.md` for motivation and the capability specs for behavior.

Oat is an HTML/CSS/minimal-JavaScript component library with no transitive runtime dependencies. Its
CSS and JavaScript can be imported from the package and bundled locally. The browser already provides
the time, internationalization, clipboard, form, URL, theme, and accessibility primitives required by
the MVP.

## Goals / Non-Goals

**Goals:**

- Keep one exact millisecond instant as the only application state and derive every representation
  from it.
- Deliver complete static documents with minimal client enhancement and no runtime network
  dependency.
- Use modern, broadly supported platform APIs directly and leave unsupported optional behavior with a
  usable fallback.
- Keep pure conversion rules independent from the DOM so the risky logic has small deterministic
  tests.
- Make a third static page easy to add without introducing a router or site generator for two pages.

**Non-Goals:**

- Preparing abstraction layers for natural-language parsing, arbitrary IANA zones, relative time,
  share links, manual theme selection, or analytics.
- Supporting legacy browsers that lack ES modules, `Intl`, or native date/time inputs.
- Adding a service worker, server runtime, account model, API, conversion history, or persisted
  conversion state.
- Publishing a Cloudflare deployment or editing the main site without separate confirmation.

## Decisions

### Bun HTML entries, not a framework or router

Use `index.html` and `faq.html` as full semantic source documents. Each contains its static page
content and imports the assets it needs. A Bun build script builds both HTML entrypoints, copies fixed
public assets, and fails on missing output. Cloudflare Pages serves `faq.html` at `/faq`.

The repeated header/footer and metadata structure is acceptable across two clear source documents and
is covered by navigation and metadata tests. A future change can introduce templating if the number of
SEO pages makes the duplication materially harder to maintain.

Alternatives considered:

- Preact plus server rendering, as used by URL Inspector: rejected because Timestamp's interactions
  are a few input events and derived text updates.
- A client router: rejected because it weakens no-JavaScript indexing and adds runtime code to solve
  static navigation.
- Vite or a static-site generator: rejected because Bun already builds the required HTML, CSS, and
  TypeScript.
- A shared page template: rejected because the required build-time transformation and development
  integration add more machinery than two explicit documents justify.

### Oat, Geist, and Nano Stores are the only production packages

Import Oat's CSS and JavaScript from `@knadh/oat` so both are bundled and self-hosted. Use its semantic
styles and supported interactive components where they replace application code; use native elements
when no Oat component is needed. Add only a small app stylesheet for layout, value presentation,
forced-colors behavior, and any verified contrast correction. Use system fonts.

Oat follows the system color scheme through modern CSS. The MVP does not write a theme preference;
the planned manual switcher will own that later behavior.

Bundle Fontsource's Geist variable weight file locally and use it for interface and display text.
Keep machine values in the system monospace stack. This preserves the same-origin and offline
guarantees while allowing the large converter headline to use deliberate variable weights.

Alternative considered: copying Oat or Geist files into the repository, or loading either from a
CDN. Copying obscures upgrades and licensing; a CDN violates the same-origin and offline guarantees.

### One reactive converter state

Hold the current valid instant, Unix unit, and timezone mode in one Nano Stores atom. The instant is a
JavaScript `number` containing integer epoch milliseconds; the ECMAScript date range fits inside the
safe-integer range. A single subscription renders both editors and every derived output after a valid
state update.

Keep the logic split only at the real boundary:

```text
src/timestamp/time.ts       pure parsing, validation, conversion, and formatting helpers
src/timestamp/converter.ts  DOM lookup, event handling, rendering, clipboard feedback
src/assets/styles.css       Oat import and application styles
```

No additional interface, class, service, or factory is needed.

### Parse Unix values from strings exactly

Validate Unix inputs with explicit decimal syntax rather than `Number()` coercion. Convert signed
whole seconds and the zero-to-three fractional digits to integer milliseconds using `BigInt`; parse
millisecond input as `BigInt`; range-check it; then convert the safe result to `number`. This avoids
binary floating-point surprises and makes excess precision an error rather than an implicit round.

Unit selection changes only the representation. The timestamp field is text with a decimal input
mode, because native number inputs permit exponential notation and apply locale/browser-specific
stepping behavior that conflicts with the specified grammar.

### Parse wall-clock components explicitly

Use a native `datetime-local` control with millisecond step precision, but parse its serialized value
into numeric components instead of relying on implementation-dependent free-form `Date` parsing.

- UTC mode constructs the instant from UTC components.
- Local mode constructs it from local components and compares the resulting components with the input.
  A mismatch identifies an impossible date or daylight-saving gap instead of accepting `Date`'s
  normalization.
- ECMAScript's local-time construction chooses the earlier offset for a repeated clock time; show the
  resulting offset so the choice is visible.
- Construct years 0 through 99 through full-year setters rather than positional constructors, which
  otherwise reinterpret them as 1900 through 1999.

Format UTC with `Date.prototype.toISOString()`. Format the human output with
`Intl.DateTimeFormat`, the user's locale, and an explicit timezone name or offset. Read the local IANA
zone name from `Intl.DateTimeFormat().resolvedOptions().timeZone` when available. `Temporal` and a
polyfill are unnecessary for the MVP's Local/UTC scope; revisit native `Temporal` against the browser
baseline when arbitrary IANA conversion is designed.

### Progressive enhancement and clipboard fallback

Source HTML contains all headings, labels, help text, FAQ content, and navigation. JavaScript fills
the initial current-time snapshot and enables conversion. Validation uses native relationships
(`aria-invalid`, descriptions, and a stable live status region) without moving focus.

Copy with `navigator.clipboard.writeText()` in a user action. On rejection or absence, focus and select
the read-only output and announce a manual-copy instruction. Oat JavaScript failure must not erase or
block native controls.

### Static discoverability is source-controlled

Keep page-specific head metadata, content, and JSON-LD in each HTML source. Keep fixed icons, the
preview image, manifest, `robots.txt`, and `sitemap.xml` under `public/`, copied byte-for-byte into
`dist/`. Build tests parse both documents to verify unique metadata, canonical URLs, shared navigation,
visible FAQ/JSON-LD agreement, referenced asset existence, and the absence of third-party resource
URLs.

### Verification follows the risk

Use Bun's test runner for pure conversion fixtures: epoch, negative values, exact fractional seconds,
milliseconds, leap dates, years below 100, range edges, invalid syntax, timezone switching, a known
DST gap, and a repeated time where the executing environment supplies one. Run timezone-sensitive
fixtures under an explicit test timezone so results are deterministic.

Use happy-dom and axe-core as development-only dependencies for the static DOM/accessibility smoke
check, following URL Inspector's proven setup. Keep browser verification manual and focused: desktop
and narrow layout, keyboard flow, system dark mode, forced colors where available, clipboard success
and denial, `/faq`, and a network log containing only same-origin resources.

### Cloudflare Pages remains an inert deployment target

Add a Wrangler Pages configuration naming `dist/`, plus README build, direct-upload, custom-domain,
smoke-test, and rollback instructions. The application needs no bindings, environment variables,
server functions, Docker image, or CI workflow. `wrangler` remains a development dependency.

## Risks / Trade-offs

- [Local timezone rules come from the user's browser and operating system] → Display the resolved zone
  and offset, document the behavior in FAQ, and defer arbitrary-zone guarantees to the planned IANA
  feature.
- [A repeated daylight-saving time has two valid instants] → Use the platform's earlier-offset rule and
  expose the chosen offset rather than hiding the ambiguity.
- [Native date/time control presentation varies by browser] → Treat its serialized value as the
  contract, keep an explicit label and format hint, and verify current target browsers manually.
- [Oat Web Components are an additional enhancement layer] → Use them only where they replace local
  code and preserve native semantic content if enhancement fails.
- [Two HTML files duplicate shell and metadata structure] → Prefer explicit, readable documents while
  there are only two pages; introduce templating only when additional pages make duplication material.
- [FAQ text and FAQ JSON-LD can diverge] → Add a build test comparing the structured questions and
  answers with visible content.

## Migration Plan

1. Implement and verify the static production artifact locally; no existing runtime or data is
   migrated.
2. With explicit approval, create or configure the Cloudflare Pages project and custom domain, deploy
   the verified `dist/`, and run the documented production smoke test.
3. With explicit approval, add `https://timestamp.themkvz.com` to the main site's Timestamp content
   entry.
4. Roll back by restoring the previous Cloudflare Pages deployment and removing or reverting the main
   site link if the production smoke test fails. There is no stored user data to migrate or recover.
