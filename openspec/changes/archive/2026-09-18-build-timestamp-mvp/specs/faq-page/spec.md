## Purpose

Defines the separate, indexable FAQ page that explains the converter's semantics, limits, privacy,
and common timestamp concepts without requiring the interactive application.

## ADDED Requirements

### Requirement: FAQ answers core product questions
The FAQ page SHALL answer, in product-specific language, what a Unix timestamp is, the difference
between seconds and milliseconds, how Local and UTC interpretation work, how daylight-saving gaps and
overlaps are handled, the supported precision and range, whether values leave the device, and why the
page does not accept natural-language dates in the MVP.

#### Scenario: Read FAQ without interaction
- **WHEN** a visitor or crawler loads `/faq` without executing JavaScript
- **THEN** every question and answer is present in the document and readable in logical order

#### Scenario: Privacy answer
- **WHEN** a visitor reads the privacy question
- **THEN** the answer accurately states that entered values are neither transmitted nor persisted by
  the MVP

#### Scenario: Planned features answer
- **WHEN** a visitor reads about unsupported date or timezone forms
- **THEN** the answer distinguishes current behavior from planned natural-language, arbitrary IANA
  timezone, relative-time, share-link, and manual-theme capabilities without promising a release date

### Requirement: FAQ connects explanations to the converter
The FAQ page SHALL provide a clear link back to the converter and MAY link to authoritative standards
or platform documentation. External documentation links MUST be user-initiated, open safely, and send
no referrer.

#### Scenario: Return to converter
- **WHEN** a visitor activates the primary converter link from the FAQ
- **THEN** the homepage converter loads

#### Scenario: Open external documentation
- **WHEN** a visitor activates an external documentation link
- **THEN** it opens in a new browsing context without opener access or referrer information

### Requirement: FAQ content matches shipped behavior
Every factual statement about parsing, timezone interpretation, precision, privacy, and browser
support SHALL match the behavior delivered by the same release. The page MUST NOT claim support for a
planned capability that is not available.

#### Scenario: Release is built
- **WHEN** the FAQ content and converter behavior are compared in the production artifact
- **THEN** examples, limitations, and privacy claims agree with the implemented behavior

