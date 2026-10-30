# App Shell Specification

## Purpose

Defines the static site shell, privacy boundary, shared navigation, and presentation guarantees used
by the converter and every content page.

## Requirements

### Requirement: Static multi-page delivery
The application SHALL be delivered as static HTML, CSS, JavaScript, and image files with no
application server or backend API. The production artifact SHALL contain a converter homepage and a
separate FAQ document whose meaningful content is present before client JavaScript runs.

#### Scenario: Served from a static host
- **WHEN** the production artifact is served by a plain static file host
- **THEN** `/` renders the converter shell and `/faq` renders the FAQ without server-side logic

#### Scenario: Content loads without JavaScript
- **WHEN** scripting is disabled
- **THEN** the product description, converter labels and guidance, FAQ answers, and site navigation
  remain visible and readable

#### Scenario: Network becomes unavailable
- **WHEN** the application and its bundled assets have loaded and the network is disconnected
- **THEN** conversion, formatting, current-time, and copy behavior that does not require clipboard
  permission continues to work

### Requirement: Shared semantic navigation
Every top-level page SHALL contain a header, exactly one page-specific `h1`, a `main` landmark, and a
footer navigation linking to the converter and FAQ. The current page link SHALL be identified with
`aria-current="page"`.

#### Scenario: Navigate to the FAQ
- **WHEN** a user activates the FAQ link from the converter page
- **THEN** the FAQ document loads and its FAQ navigation link is marked as the current page

#### Scenario: Navigate to the converter
- **WHEN** a user activates the converter link from the FAQ page
- **THEN** the converter document loads and its converter navigation link is marked as the current
  page

### Requirement: Local-first privacy
The application MUST NOT transmit, persist, log, or place in document URLs any user-entered timestamp
or date/time value. The application's own code MUST NOT use cookies, local storage, session storage,
IndexedDB, or other persistent browser storage. All executable, stylesheet, font, and image resources
MUST be served from the application's own origin, except the self-hosted analytics tracker defined in
the analytics capability (`https://openpanel.themkvz.com`).

#### Scenario: User performs conversions
- **WHEN** a user enters, converts, or copies timestamp and date/time values
- **THEN** those values remain in the current document's memory and no network or storage write
  contains them

#### Scenario: Page resources load
- **WHEN** either page loads with browser network inspection enabled
- **THEN** every resource request uses the serving origin or the self-hosted analytics origin

#### Scenario: Network request fails
- **WHEN** the browser cannot reach any remote service after the page has loaded
- **THEN** the converter remains functional because conversion does not depend on a remote service

### Requirement: System-responsive presentation
The site SHALL follow the user's system light or dark color scheme without a manual override in this
change. It SHALL preserve readable content, visible control boundaries, and visible focus indicators
under reduced-motion, increased-contrast, and forced-colors preferences.

#### Scenario: Dark color scheme
- **WHEN** the operating system prefers a dark color scheme
- **THEN** the site renders using its dark palette without a flash of the light palette

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** nonessential transitions and movement are suppressed without hiding state changes

#### Scenario: Forced colors
- **WHEN** forced-colors mode is active
- **THEN** text, controls, validation states, and focus indicators remain distinguishable using system
  colors

### Requirement: Accessible interaction baseline
All interactive behavior SHALL be available by keyboard, retain a visible focus state, expose an
accessible name, and communicate validation or action results without requiring color, pointer input,
or visual observation alone. Body text SHALL meet WCAG 2.2 AA contrast, and meaningful control
boundaries and focus indicators SHALL meet the corresponding non-text contrast requirement.

#### Scenario: Keyboard-only use
- **WHEN** a user navigates and operates the site using only a keyboard
- **THEN** every field, selector, link, and action is reachable and operable in a logical order

#### Scenario: Status is announced
- **WHEN** validation fails or a copy action succeeds or fails
- **THEN** the visible message is also announced by assistive technology without moving focus

