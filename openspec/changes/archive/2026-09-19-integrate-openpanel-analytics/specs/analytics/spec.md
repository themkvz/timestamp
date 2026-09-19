## Purpose

Gives basic usage visibility (page views and converter interactions) via a self-hosted analytics
backend, without transmitting any timestamp or date value a visitor enters.

## ADDED Requirements

### Requirement: Self-hosted event delivery
Analytics events SHALL be sent only to the self-hosted OpenPanel API endpoint
(`https://openpanel.themkvz.com/api`). The tracker loader script SHALL also be served from the
self-hosted instance (`https://openpanel.themkvz.com/op1.js`) rather than OpenPanel's public CDN, so
every OpenPanel asset comes from one origin. Event data MUST NOT be sent anywhere other than the
self-hosted endpoint.

#### Scenario: Inspect outgoing event requests
- **WHEN** network requests made by a page are inspected during normal use
- **THEN** every analytics event request targets `https://openpanel.themkvz.com/api` and no other
  analytics collection domain, and the loader script is fetched from `https://openpanel.themkvz.com`

### Requirement: No user-entered values transmitted
Analytics tracking SHALL NOT transmit the value of the date/time input, the Unix timestamp input, or
any of the computed output fields (Unix seconds, Unix milliseconds, UTC ISO 8601, localized time).
Tracked event properties MUST be limited to interaction metadata (e.g. which control was used, which
output field was copied) and MUST NOT include field values. The localized time output has no copy
control, so it is never a source of a copy event.

#### Scenario: Inspect a tracked interaction event
- **WHEN** a converter interaction event (button click or select change) is sent
- **THEN** its properties identify which control fired the event and MUST NOT contain the date, Unix
  timestamp, or any output value currently shown

### Requirement: Page view tracking
Each top-level page (homepage and FAQ) SHALL automatically record a page view when loaded, with no
per-page custom code required.

#### Scenario: Load a top-level page
- **WHEN** a visitor loads `/` or `/faq`
- **THEN** exactly one page view event is recorded for that page load

### Requirement: Converter interaction tracking
The converter SHALL record an event for each of the following interactions: using the "Use current
time" button, copying any of the three copyable output fields (Unix seconds, Unix milliseconds, UTC
ISO 8601), changing the "Interpret as" timezone mode, changing the Unix unit, and focusing the
date/time or Unix value input. Each event's properties SHALL identify which specific control or field
was involved (e.g. which output field was copied, which mode was selected, which input was focused).

#### Scenario: Copy an output field
- **WHEN** a visitor clicks a copy button for one of the three copyable output fields
- **THEN** an event is recorded identifying that specific output field

#### Scenario: Change timezone interpretation
- **WHEN** a visitor changes the "Interpret as" select between Local and UTC
- **THEN** an event is recorded identifying the newly selected mode

#### Scenario: Change Unix unit
- **WHEN** a visitor changes the Unix unit select between Seconds and Milliseconds
- **THEN** an event is recorded identifying the newly selected unit

#### Scenario: Focus an input field
- **WHEN** a visitor focuses the date/time input or the Unix value input
- **THEN** an event is recorded identifying which field was focused, without its value

### Requirement: Site navigation tracking
Each internal navigation link (primary nav, wordmark, secondary nav, and footer nav, on both pages)
SHALL record an event identifying which link was clicked when activated.

#### Scenario: Click an internal nav link
- **WHEN** a visitor clicks a header or footer navigation link
- **THEN** an event is recorded identifying that specific link

### Requirement: FAQ question interaction tracking
Each FAQ question SHALL record an event identifying which question was toggled and whether it was
opened or closed.

#### Scenario: Expand or collapse a FAQ question
- **WHEN** a visitor opens or closes a FAQ question
- **THEN** an event is recorded identifying that question and its resulting open/closed state

### Requirement: Session replay disabled
Session replay SHALL remain disabled. No screen recording or session replay data SHALL be collected.

#### Scenario: Inspect analytics initialization
- **WHEN** the analytics initialization configuration is inspected
- **THEN** session replay is absent or explicitly disabled
