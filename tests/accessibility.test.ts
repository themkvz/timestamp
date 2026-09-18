import { expect, test } from 'bun:test'
import { Window } from 'happy-dom'

const audit = async (file: string): Promise<void> => {
  const window = new Window()
  window.document.write(await Bun.file(`dist/${file}`).text())
  window.document.close()
  Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: window })
  const { default: axe } = await import('axe-core')
  const result = await axe.run(window.document as unknown as Document, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(result.violations).toEqual([])
}

test('the converter and FAQ have no static axe violations', async () => {
  await audit('index.html')
  await audit('faq.html')
})
