## 1. Project Foundation

- [x] 1.1 Add the Bun package manifest and lockfile with `@knadh/oat`, `nanostores`, and locally bundled
  Fontsource Geist as the only production dependencies, plus TypeScript, Biome, Bun types, lefthook,
  happy-dom, axe-core, and Wrangler as development dependencies; verify
  `bun install --frozen-lockfile` succeeds.
- [x] 1.2 Add strict TypeScript, Biome, lefthook, ignore, and Bun build configuration matching the
  repository conventions; verify `bun run check` succeeds on the empty application skeleton.
- [x] 1.3 Add full static `index.html` and `faq.html` documents, shared Oat/app asset imports, semantic
  landmarks, and reciprocal navigation; verify a production build emits non-empty `dist/index.html`
  and `dist/faq.html` with no framework or router dependency.

## 2. Conversion Core

- [x] 2.1 Implement exact signed Unix-seconds and Unix-milliseconds parsing with explicit units,
  millisecond precision, `BigInt` range checks, and locale-independent formatting; verify focused Bun
  tests cover epoch, negative values, fractional seconds, excess precision, malformed input, and range
  edges.
- [x] 2.2 Implement explicit `datetime-local` component parsing for UTC and browser-local modes,
  including leap dates, years below 100, daylight-saving gaps, and earlier-offset overlap behavior;
  verify deterministic Bun tests pass under an explicit timezone.
- [x] 2.3 Implement UTC ISO and localized output formatting with visible timezone information; verify
  tests show every representation resolves to the same millisecond instant.

## 3. Converter Experience

- [x] 3.1 Build the homepage converter markup with Unix value/unit controls, date/time/timezone
  controls, Now, Unix-seconds, Unix-milliseconds, UTC ISO, localized outputs, copy actions, validation
  relationships, and a stable live status region; verify the static HTML exposes complete labels and
  guidance without JavaScript.
- [x] 3.2 Wire one Nano Stores converter state to both editors and all outputs, preserving the instant
  on unit/timezone switches and taking one snapshot on load or Now; verify DOM tests cover edits in
  both directions, stable non-live values, invalid input, and recovery after correction.
- [x] 3.3 Implement exact-output clipboard actions with visible/live success feedback and a selectable
  manual-copy fallback; verify DOM tests cover granted, rejected, and unavailable Clipboard API paths.
- [x] 3.4 Add the smallest app stylesheet needed around Oat for responsive layout, machine-value
  readability, validation, focus, reduced motion, and forced colors; verify keyboard flow and light,
  dark, narrow, reduced-motion, and forced-colors states in a browser.

## 4. FAQ and Discoverability

- [x] 4.1 Write the static FAQ covering timestamp units, Local/UTC semantics, DST gaps and overlaps,
  precision/range, privacy, and planned features with safe authoritative links; verify the content is
  present and navigable with JavaScript disabled.
- [x] 4.2 Add unique canonical, robots, Open Graph, Twitter, and page-appropriate JSON-LD metadata to
  both documents; verify tests parse the heads and confirm FAQ structured data matches visible FAQ
  content.
- [x] 4.3 Add self-hosted SVG/ICO/apple icons, a 1200 by 630 social image, manifest, `robots.txt`, and
  `sitemap.xml`; verify every referenced asset exists in `dist/` and the sitemap lists only `/` and
  `/faq`.
- [x] 4.4 Add build-output privacy and discoverability tests that reject third-party resource URLs,
  empty page content, duplicate page identities, missing navigation, or persisted conversion state;
  verify the tests pass against a fresh production build.

## 5. Accessibility and Release Verification

- [x] 5.1 Add happy-dom/axe smoke tests for both pages and targeted accessible-state assertions for
  validation and copy feedback; verify `bun test` reports no automated accessibility violations.
- [x] 5.2 Run formatter/linter, type checking, all tests, and a clean production build; verify
  `bun run check`, `bun test`, and `bun run build` all pass from a clean dependency install.
- [x] 5.3 Perform the documented browser smoke test for conversion, FAQ routing, keyboard use,
  clipboard success/failure, responsive themes, JavaScript-disabled content, and same-origin network
  activity; record any browser-specific limitation in the FAQ before marking the task complete.

## 6. Deployment Readiness

- [ ] 6.1 Add Cloudflare Pages Wrangler configuration for the static `dist/` output with no bindings,
  functions, or environment variables; verify Wrangler accepts the configuration without deploying.
- [x] 6.2 Document local development, verification, direct-upload deployment, custom-domain setup,
  production smoke testing, and rollback in the README; verify every documented local command works.
- [x] 6.3 Prepare the release handoff naming the separately approved external actions—deploying to
  `timestamp.themkvz.com` and adding the URL to the main site's Timestamp content entry—without
  performing either action; verify the handoff names the exact target and rollback procedure.
