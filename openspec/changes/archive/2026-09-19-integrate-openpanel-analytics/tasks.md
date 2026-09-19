## 1. Script tag integration

- [x] 1.1 Add the OpenPanel init snippet and loader `<script src="https://openpanel.themkvz.com/op1.js" defer async>` to `index.html`, with `apiUrl: 'https://openpanel.themkvz.com/api'`, `clientId: '3a3ef04a-d6a3-445e-bd09-938735469e64'`, `trackScreenViews`, `trackOutgoingLinks`, and `trackAttributes` all `true`, and session replay left commented out. Verify by loading the page and confirming `window.op` is defined and a page view event fires in the network tab. (Loader src changed post-implementation from `openpanel.dev` to the self-hosted domain — see design.md.)
- [x] 1.2 Add the same init snippet and loader script to `faq.html`. Verify a page view event fires when loading `/faq` directly.

## 2. Declarative interaction tracking

- [x] 2.1 Add `data-track="use_current_time"` to the "Use current time" button in `index.html`. Verify clicking it produces a tracked event with that name and no field values in its properties.
- [x] 2.2 Add `data-track="copy_output"` plus a `data-field` attribute naming the output (`unix-seconds`, `unix-milliseconds`, `utc-iso`) to each of the three copy buttons in `index.html` (`localized-time` has no copy button). Verify each copy button's tracked event properties identify the correct field and contain no output value.

## 3. Explicit select tracking

- [x] 3.1 In `src/timestamp/converter.ts`, add a `window.op('track', 'timezone_mode_changed', { mode })` call inside the existing `modeInput` `change` listener. Verify switching between Local and UTC fires an event carrying only the selected mode.
- [x] 3.2 In `src/timestamp/converter.ts`, add a `window.op('track', 'unix_unit_changed', { unit })` call inside the existing `unitInput` `change` listener. Verify switching between Seconds and Milliseconds fires an event carrying only the selected unit.

## 4. Verification

- [x] 4.1 Run the project's existing lint/format/type checks (`bun run` scripts per `package.json`) and confirm they pass with the `index.html`, `faq.html`, and `converter.ts` changes.
- [x] 4.2 Manually exercise the converter in a browser with devtools network tab open: confirm every analytics request goes to `https://openpanel.themkvz.com/api`, `op1.js` loads from `https://openpanel.themkvz.com`, and no request body or query string contains a date, timestamp, or output field value at any point.

## 5. Field, nav, and FAQ tracking

- [x] 5.1 Add `data-track="nav_click"` plus a `data-item` attribute identifying the link (e.g. `primary-converter`, `wordmark-home`, `secondary-privacy`, `footer-faq`) to every header/footer nav `<a>` in `index.html` and `faq.html`. Verify clicking a nav link produces a tracked event identifying it.
- [x] 5.2 In `src/timestamp/converter.ts`, add a `focus` listener on the date-time input and the Unix value input, each calling `window.op('track', 'field_used', { field })`. Verify focusing each field fires an event naming that field and containing no typed value. (`data-track` was tried directly on the inputs first but does not work — `op1.js`'s `trackAttributes` handler only recognizes `<button>`/`<a>`; see design.md.)
- [x] 5.3 Add a `data-question` attribute to each FAQ `<details>` in `faq.html`, and a small inline script listening to each element's native `toggle` event, calling `window.op('track', 'faq_toggle', { question, open })`. Verify opening/closing each FAQ item fires an event with the correct question slug and open state.
- [x] 5.4 Run `bun run check` and confirm it passes with the `index.html`, `faq.html`, and `converter.ts` changes.
- [x] 5.5 Manually verify in a browser: nav link clicks, input focus events, and FAQ toggles all reach `https://openpanel.themkvz.com/api/track` with correct identifying properties and no leaked field values.
