import { atom } from 'nanostores'

import {
  formatDateTime,
  formatLocalized,
  formatUnixMilliseconds,
  formatUnixSeconds,
  formatUtcIso,
  parseDateTime,
  parseUnix,
  type TimeZoneMode,
  type UnixUnit,
} from './time'

const get = <T extends Element>(id: string): T => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Missing #${id}`)
  return element as unknown as T
}

const unixInput = get<HTMLInputElement>('unix-value')
const unitInput = get<HTMLSelectElement>('unix-unit')
const dateInput = get<HTMLInputElement>('date-time')
const modeInput = get<HTMLSelectElement>('timezone-mode')
const nowButton = get<HTMLButtonElement>('now')
const converter = get<HTMLFormElement>('converter')
const status = get<HTMLElement>('converter-status')
const unixError = get<HTMLElement>('unix-error')
const dateError = get<HTMLElement>('date-error')
const outputs = {
  localized: get<HTMLInputElement>('localized-time'),
  milliseconds: get<HTMLInputElement>('unix-milliseconds'),
  seconds: get<HTMLInputElement>('unix-seconds'),
  utcIso: get<HTMLInputElement>('utc-iso'),
}
const copyButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-copy]')]

const browserWindow = document.defaultView
const maxShadowOffset = 14

const updateConverterShadow = ({ clientX, clientY }: PointerEvent): void => {
  const bounds = converter.getBoundingClientRect()
  const horizontalPosition = (bounds.left + bounds.width / 2 - clientX) / (bounds.width / 2)
  const verticalPosition = (bounds.top + bounds.height / 2 - clientY) / (bounds.height / 2)
  const shadowX = Math.max(-1, Math.min(1, horizontalPosition)) * maxShadowOffset
  const shadowY = Math.max(-1, Math.min(1, verticalPosition)) * maxShadowOffset

  converter.style.setProperty('--converter-shadow-x', `${shadowX.toFixed(2)}px`)
  converter.style.setProperty('--converter-shadow-y', `${shadowY.toFixed(2)}px`)
}

if (
  browserWindow?.matchMedia('(pointer: fine)').matches &&
  !browserWindow.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  browserWindow.addEventListener('pointermove', updateConverterShadow, { passive: true })
}

type ConverterState = {
  milliseconds: number
  mode: TimeZoneMode
  unit: UnixUnit
}

const $converter = atom<ConverterState>({
  milliseconds: Date.now(),
  mode: modeInput.value as TimeZoneMode,
  unit: unitInput.value as UnixUnit,
})

const updateState = (change: Partial<ConverterState>): void => {
  $converter.set({ ...$converter.get(), ...change })
}

const setStatus = (message: string): void => {
  status.textContent = message
}

const clearErrors = (): void => {
  for (const [input, error] of [
    [unixInput, unixError],
    [dateInput, dateError],
  ] as const) {
    input.removeAttribute('aria-invalid')
    error.textContent = ''
  }
}

const setUnavailable = (): void => {
  for (const output of Object.values(outputs)) output.value = 'Unavailable'
  for (const button of copyButtons) button.disabled = true
}

const render = ({ milliseconds, mode, unit }: ConverterState): void => {
  clearErrors()
  unitInput.value = unit
  modeInput.value = mode
  unixInput.value =
    unit === 'seconds' ? formatUnixSeconds(milliseconds) : formatUnixMilliseconds(milliseconds)
  dateInput.value = formatDateTime(milliseconds, mode)
  outputs.seconds.value = formatUnixSeconds(milliseconds)
  outputs.milliseconds.value = formatUnixMilliseconds(milliseconds)
  outputs.utcIso.value = formatUtcIso(milliseconds)
  outputs.localized.value = formatLocalized(milliseconds)
  for (const button of copyButtons) button.disabled = false
}

const showError = (input: HTMLInputElement, error: HTMLElement, message: string): void => {
  input.setAttribute('aria-invalid', 'true')
  error.textContent = message
  setUnavailable()
  setStatus(message)
}

unixInput.addEventListener('input', () => {
  const result = parseUnix(unixInput.value, $converter.get().unit)
  if ('error' in result) return showError(unixInput, unixError, result.error)
  updateState({ milliseconds: result.value })
})

dateInput.addEventListener('input', () => {
  const result = parseDateTime(dateInput.value, $converter.get().mode)
  if ('error' in result) return showError(dateInput, dateError, result.error)
  updateState({ milliseconds: result.value })
})

unitInput.addEventListener('change', () => updateState({ unit: unitInput.value as UnixUnit }))
modeInput.addEventListener('change', () => updateState({ mode: modeInput.value as TimeZoneMode }))
nowButton.addEventListener('click', () => {
  updateState({ milliseconds: Date.now() })
  setStatus('Current time captured.')
})

export const copyOutput = async (output: HTMLInputElement): Promise<void> => {
  if (output.value === 'Unavailable') return

  try {
    if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(output.value)
    setStatus(`Copied ${output.labels?.[0]?.textContent ?? 'value'}.`)
  } catch {
    output.focus()
    output.select()
    setStatus('Clipboard access is unavailable. The value is selected for manual copying.')
  }
}

for (const button of copyButtons) {
  button.addEventListener('click', () => {
    const output = document.getElementById(button.dataset.copy ?? '')
    if (output?.tagName === 'INPUT') void copyOutput(output as HTMLInputElement)
  })
}

$converter.subscribe(render)
