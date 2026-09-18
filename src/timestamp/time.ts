export type UnixUnit = 'seconds' | 'milliseconds'
export type TimeZoneMode = 'local' | 'utc'

export type ParseResult = { value: number } | { error: string }

export const DATE_MIN_MILLISECONDS = -8_640_000_000_000_000
export const DATE_MAX_MILLISECONDS = 8_640_000_000_000_000

const DATE_MIN = BigInt(DATE_MIN_MILLISECONDS)
const DATE_MAX = BigInt(DATE_MAX_MILLISECONDS)
const SECONDS_PATTERN = /^([+-]?)(\d+)(?:\.(\d{1,3}))?$/
const MILLISECONDS_PATTERN = /^[+-]?\d+$/
const DATETIME_PATTERN = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/

type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

const invalid = (message: string): ParseResult => ({ error: message })

const inDateRange = (milliseconds: bigint): ParseResult => {
  if (milliseconds < DATE_MIN || milliseconds > DATE_MAX) {
    return invalid('Value is outside the supported date range.')
  }

  return { value: Number(milliseconds) }
}

export const parseUnix = (input: string, unit: UnixUnit): ParseResult => {
  if (unit === 'milliseconds') {
    return MILLISECONDS_PATTERN.test(input)
      ? inDateRange(BigInt(input))
      : invalid('Enter a signed whole number of milliseconds.')
  }

  const match = input.match(SECONDS_PATTERN)
  if (!match) {
    return invalid('Enter seconds as a signed number with up to three decimal places.')
  }

  const [, sign, whole, fractional = ''] = match
  const milliseconds = BigInt(whole) * 1_000n + BigInt(fractional.padEnd(3, '0') || '0')
  return inDateRange(sign === '-' ? -milliseconds : milliseconds)
}

export const formatUnixSeconds = (milliseconds: number): string => {
  const magnitude = BigInt(Math.abs(milliseconds))
  const seconds = magnitude / 1_000n
  const fraction = (magnitude % 1_000n).toString().padStart(3, '0').replace(/0+$/, '')
  return `${milliseconds < 0 ? '-' : ''}${seconds}${fraction ? `.${fraction}` : ''}`
}

export const formatUnixMilliseconds = (milliseconds: number): string => String(milliseconds)

const number = (value: string): number => Number(value)

const sameParts = (date: Date, parts: DateTimeParts, mode: TimeZoneMode): boolean =>
  mode === 'utc'
    ? date.getUTCFullYear() === parts.year &&
      date.getUTCMonth() + 1 === parts.month &&
      date.getUTCDate() === parts.day &&
      date.getUTCHours() === parts.hour &&
      date.getUTCMinutes() === parts.minute &&
      date.getUTCSeconds() === parts.second &&
      date.getUTCMilliseconds() === parts.millisecond
    : date.getFullYear() === parts.year &&
      date.getMonth() + 1 === parts.month &&
      date.getDate() === parts.day &&
      date.getHours() === parts.hour &&
      date.getMinutes() === parts.minute &&
      date.getSeconds() === parts.second &&
      date.getMilliseconds() === parts.millisecond

const dateFromParts = (parts: DateTimeParts, mode: TimeZoneMode): Date => {
  const date = new Date(0)
  if (mode === 'utc') {
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day)
    date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond)
  } else {
    date.setFullYear(parts.year, parts.month - 1, parts.day)
    date.setHours(parts.hour, parts.minute, parts.second, parts.millisecond)
  }
  return date
}

export const parseDateTime = (input: string, mode: TimeZoneMode): ParseResult => {
  const match = input.match(DATETIME_PATTERN)
  if (!match) {
    return invalid('Enter a complete date and time.')
  }

  const [, year, month, day, hour, minute, second = '0', millisecond = '0'] = match
  const parts = {
    year: number(year),
    month: number(month),
    day: number(day),
    hour: number(hour),
    minute: number(minute),
    second: number(second),
    millisecond: number(millisecond.padEnd(3, '0')),
  }
  const date = dateFromParts(parts, mode)

  if (!Number.isFinite(date.getTime())) {
    return invalid('Value is outside the supported date range.')
  }
  if (!sameParts(date, parts, mode)) {
    return invalid(
      mode === 'local' ? 'This local time does not exist.' : 'Enter a real calendar date and time.',
    )
  }

  return { value: date.getTime() }
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0')

export const formatDateTime = (milliseconds: number, mode: TimeZoneMode): string => {
  const date = new Date(milliseconds)
  const utc = mode === 'utc'
  const year = utc ? date.getUTCFullYear() : date.getFullYear()
  const month = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1
  const day = utc ? date.getUTCDate() : date.getDate()
  const hour = utc ? date.getUTCHours() : date.getHours()
  const minute = utc ? date.getUTCMinutes() : date.getMinutes()
  const second = utc ? date.getUTCSeconds() : date.getSeconds()
  const millisecond = utc ? date.getUTCMilliseconds() : date.getMilliseconds()
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}`
}

export const formatUtcIso = (milliseconds: number): string => new Date(milliseconds).toISOString()

export const formatUtcOffset = (milliseconds: number): string => {
  const offset = -new Date(milliseconds).getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absolute = Math.abs(offset)
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

export const formatLocalized = (milliseconds: number): string => {
  const date = new Date(milliseconds)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const formatted = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    second: '2-digit',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(date)
  return `${formatted} (${zone ?? formatUtcOffset(milliseconds)}; ${formatUtcOffset(milliseconds)})`
}
