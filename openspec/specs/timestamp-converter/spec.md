# Timestamp Converter Specification

## Purpose

Defines a precise, bidirectional converter between Unix timestamps and human-readable representations
of one instant, including validation, timezone interpretation, and copy behavior.

## Requirements

### Requirement: One synchronized instant
The converter SHALL represent one instant at a time and SHALL keep its Unix timestamp, editable
date/time, UTC ISO 8601, and localized representations synchronized after every valid edit. On initial
load it SHALL take a single snapshot of the current instant rather than running a live timer.

#### Scenario: Initial load
- **WHEN** the converter initializes
- **THEN** every representation describes the same current instant captured during initialization

#### Scenario: Unix value changes
- **WHEN** a user enters a valid Unix value in the selected unit
- **THEN** the editable date/time and every output update to describe that instant

#### Scenario: Date/time changes
- **WHEN** a user enters a valid date/time under the selected timezone interpretation
- **THEN** the Unix value and every output update to describe that instant

### Requirement: Explicit Unix units
The Unix editor SHALL require the user to select seconds or milliseconds and MUST NOT infer the unit
from the value's magnitude or digit count. Seconds SHALL accept a signed integer or a signed decimal
with no more than three fractional digits; milliseconds SHALL accept a signed integer. Both forms
SHALL preserve millisecond precision within the platform-supported date range.

#### Scenario: Convert Unix seconds
- **WHEN** the unit is seconds and the user enters `0`, `1.25`, or `-1`
- **THEN** the converter treats the values respectively as the epoch, 1.250 seconds after the epoch,
  and one second before the epoch

#### Scenario: Convert Unix milliseconds
- **WHEN** the unit is milliseconds and the user enters `1000`
- **THEN** the converter represents exactly one second after the Unix epoch

#### Scenario: Change Unix unit
- **WHEN** the user switches between seconds and milliseconds while the current value is valid
- **THEN** the instant is preserved and the Unix field is rewritten in the selected unit

#### Scenario: Reject excess precision
- **WHEN** the seconds value contains more than three fractional digits or the milliseconds value is
  not an integer
- **THEN** the converter reports a validation error and does not silently round the value

### Requirement: Local and UTC date interpretation
The date/time editor SHALL use an explicit Local or UTC interpretation. Local SHALL mean the browser's
current system timezone; UTC SHALL mean offset `+00:00`. Switching interpretation for a valid instant
SHALL preserve that instant and display the corresponding wall-clock value in the newly selected
interpretation.

#### Scenario: Interpret UTC date/time
- **WHEN** UTC is selected and the user enters `1970-01-01 00:00:00`
- **THEN** the Unix outputs are `0` seconds and `0` milliseconds

#### Scenario: Interpret local date/time
- **WHEN** Local is selected and the user enters a valid wall-clock date/time
- **THEN** the converter resolves it using the browser's current timezone and identifies that timezone
  in the localized output

#### Scenario: Switch interpretation
- **WHEN** a valid instant is displayed and the user switches between Local and UTC
- **THEN** the instant and Unix values stay unchanged while the editable wall-clock value changes to
  the selected interpretation

#### Scenario: Nonexistent local time
- **WHEN** the user enters a local wall-clock time skipped by a daylight-saving transition
- **THEN** the converter reports that the local time does not exist and does not normalize it to a
  different time

#### Scenario: Repeated local time
- **WHEN** the user enters a local wall-clock time repeated by a daylight-saving transition
- **THEN** the converter uses the earlier matching offset and shows the resulting offset in the
  localized output

### Requirement: Standard representations
For every valid instant the converter SHALL expose Unix seconds, Unix milliseconds, a UTC ISO 8601
value, and a localized date/time that includes the browser's timezone name or offset. Machine-oriented
representations SHALL use locale-independent syntax.

#### Scenario: Unix epoch outputs
- **WHEN** the represented instant is the Unix epoch
- **THEN** the outputs include `0` seconds, `0` milliseconds, and `1970-01-01T00:00:00.000Z`

#### Scenario: Localized output
- **WHEN** a valid instant is represented
- **THEN** the local output follows the user's locale and includes enough timezone information to
  distinguish it from UTC

### Requirement: Current-time action
The converter SHALL provide a Now action that takes a new current-time snapshot at millisecond
precision and applies it to every representation. It MUST NOT update values continuously.

#### Scenario: Set current time
- **WHEN** the user activates Now
- **THEN** every representation updates from one newly captured current instant

#### Scenario: Leave edited value stable
- **WHEN** the user has entered a valid historical or future instant and does not activate Now
- **THEN** the represented instant remains unchanged as real time passes

### Requirement: Invalid input is explicit
The converter SHALL validate input before changing the represented instant. Empty, malformed,
non-finite, impossible, excess-precision, and platform-out-of-range values SHALL remain visible for
correction, SHALL be associated with a specific error message, and MUST NOT be silently normalized.
Derived outputs SHALL be marked unavailable until the input becomes valid.

#### Scenario: Malformed Unix input
- **WHEN** a user enters letters, exponential notation, or multiple decimal separators in the Unix
  field
- **THEN** the field reports the accepted syntax and derived outputs are unavailable

#### Scenario: Out-of-range input
- **WHEN** an otherwise well-formed value is outside the platform-supported date range
- **THEN** the converter reports the range error without throwing or replacing the entered value

#### Scenario: Correct invalid input
- **WHEN** the user changes an invalid value to a valid one
- **THEN** the error clears and every representation updates from the corrected instant

### Requirement: Copy exact outputs
Each machine-oriented output SHALL have a copy action that copies its exact displayed value. Success
and failure SHALL be reported visibly and to assistive technology. If programmatic clipboard access is
unavailable or denied, the application SHALL expose the value for manual copying without losing it.

#### Scenario: Copy succeeds
- **WHEN** the browser grants clipboard access and the user activates an output's copy action
- **THEN** the clipboard receives exactly that output and a success status identifies what was copied

#### Scenario: Clipboard access fails
- **WHEN** clipboard access is unavailable or denied
- **THEN** the output remains selectable and the application provides a manual-copy instruction

