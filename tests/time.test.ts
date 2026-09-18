import { describe, expect, test } from 'bun:test'
import {
  DATE_MAX_MILLISECONDS,
  DATE_MIN_MILLISECONDS,
  formatLocalized,
  formatUnixMilliseconds,
  formatUnixSeconds,
  formatUtcIso,
  parseDateTime,
  parseUnix,
} from '../src/timestamp/time'

describe('Unix parsing', () => {
  test('keeps signed millisecond precision', () => {
    expect(parseUnix('0', 'seconds')).toEqual({ value: 0 })
    expect(parseUnix('1.25', 'seconds')).toEqual({ value: 1_250 })
    expect(parseUnix('-0.001', 'seconds')).toEqual({ value: -1 })
    expect(parseUnix('-1', 'seconds')).toEqual({ value: -1_000 })
    expect(parseUnix('1000', 'milliseconds')).toEqual({ value: 1_000 })
  })

  test('rejects malformed, over-precise, and out-of-range values', () => {
    expect(parseUnix('1.0001', 'seconds')).toHaveProperty('error')
    expect(parseUnix('1e3', 'seconds')).toHaveProperty('error')
    expect(parseUnix('1.2', 'milliseconds')).toHaveProperty('error')
    expect(parseUnix(String(DATE_MAX_MILLISECONDS + 1), 'milliseconds')).toHaveProperty('error')
    expect(parseUnix(String(DATE_MIN_MILLISECONDS - 1), 'milliseconds')).toHaveProperty('error')
  })

  test('formats values without locale changes', () => {
    expect(formatUnixSeconds(-1)).toBe('-0.001')
    expect(formatUnixSeconds(1_250)).toBe('1.25')
    expect(formatUnixMilliseconds(-1_250)).toBe('-1250')
  })
})

describe('date-time parsing and formatting', () => {
  test('uses explicit UTC parts, including years below 100 and leap dates', () => {
    expect(parseDateTime('1970-01-01T00:00:00.000', 'utc')).toEqual({ value: 0 })
    expect(parseDateTime('0099-01-01T00:00:00.000', 'utc')).toEqual({ value: -59_042_995_200_000 })
    expect(parseDateTime('2024-02-29T12:34:56.789', 'utc')).toEqual({ value: 1_709_210_096_789 })
    expect(parseDateTime('2023-02-29T12:00', 'utc')).toHaveProperty('error')
  })

  test('rejects a daylight-saving gap and chooses the earlier overlap offset', () => {
    expect(parseDateTime('2024-03-10T02:30', 'local')).toHaveProperty('error')
    expect(parseDateTime('2024-11-03T01:30', 'local')).toEqual({ value: 1_730_611_800_000 })
  })

  test('formats standard representations of the same instant', () => {
    expect(formatUtcIso(0)).toBe('1970-01-01T00:00:00.000Z')
    expect(formatLocalized(0)).toContain('UTC-05:00')
  })
})
