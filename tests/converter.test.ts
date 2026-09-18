import { expect, test } from 'bun:test'
import { Window } from 'happy-dom'

const page = await Bun.file('index.html').text()
const body = page.match(/<body>([\s\S]*)<\/body>/)?.[1]
if (!body) throw new Error('Missing page body')

const window = new Window()
window.document.body.innerHTML = body
Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document })
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: window.navigator })

await import('../src/timestamp/converter')

const input = <T extends Element>(id: string): T =>
  window.document.getElementById(id) as unknown as T
const event = (element: Element, type: string): void => {
  element.dispatchEvent(new window.Event(type) as unknown as Event)
}
const copy = (): void => {
  event(window.document.querySelector('[data-copy="utc-iso"]') as unknown as Element, 'click')
}
const settle = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

test('synchronizes editors, recovers from invalid input, and copies with fallback', async () => {
  const unix = input<HTMLInputElement>('unix-value')
  const unit = input<HTMLSelectElement>('unix-unit')
  const date = input<HTMLInputElement>('date-time')
  const mode = input<HTMLSelectElement>('timezone-mode')

  unix.value = '1.25'
  event(unix, 'input')
  expect(input<HTMLInputElement>('unix-milliseconds').value).toBe('1250')

  const dateBeforeUnitChange = date.value
  unit.value = 'milliseconds'
  event(unit, 'change')
  expect(unix.value).toBe('1250')
  expect(date.value).toBe(dateBeforeUnitChange)
  expect(input<HTMLInputElement>('unix-seconds').value).toBe('1.25')

  mode.value = 'utc'
  event(mode, 'change')
  date.value = '1970-01-01T00:00:00.000'
  event(date, 'input')
  expect(input<HTMLInputElement>('unix-seconds').value).toBe('0')

  unix.value = 'not-a-timestamp'
  event(unix, 'input')
  expect(unix.getAttribute('aria-invalid')).toBe('true')
  expect(input<HTMLInputElement>('utc-iso').value).toBe('Unavailable')

  unix.value = '1000'
  event(unix, 'input')
  expect(unix.getAttribute('aria-invalid')).toBeNull()
  expect(input<HTMLInputElement>('utc-iso').value).toBe('1970-01-01T00:00:01.000Z')

  const copied: string[] = []
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (value: string): Promise<void> => void copied.push(value) },
  })
  copy()
  await settle()
  expect(input<HTMLElement>('converter-status').textContent).toBe('Copied UTC ISO 8601.')
  expect(copied).toEqual(['1970-01-01T00:00:01.000Z'])

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (): Promise<never> => Promise.reject(new Error('denied')) },
  })
  copy()
  await settle()
  expect(input<HTMLElement>('converter-status').textContent).toContain(
    'selected for manual copying',
  )

  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  copy()
  await settle()
  expect(input<HTMLElement>('converter-status').textContent).toContain(
    'selected for manual copying',
  )
})
