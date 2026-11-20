import { createHash } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { expect, test } from 'bun:test'

const root = 'https://unixstamp.dev'
const analyticsOrigin = 'https://openpanel.themkvz.com/'
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const page = async (name: string): Promise<string> => Bun.file(`dist/${name}`).text()
const listFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path])
    }),
  )
  return files.flat()
}
const meta = (html: string, attribute: string, value: string): string | undefined =>
  html.match(
    new RegExp(`<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'),
  )?.[1]
const jsonLd = (html: string): Record<string, unknown> =>
  JSON.parse(
    html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1] ?? '{}',
  )

test('built pages have unique, complete local metadata and navigation', async () => {
  const [index, faq] = await Promise.all([page('index.html'), page('faq.html')])
  const indexTitle = index.match(/<title>([^<]+)<\/title>/)?.[1]
  const faqTitle = faq.match(/<title>([^<]+)<\/title>/)?.[1]
  const indexDescription = meta(index, 'name', 'description')
  const faqDescription = meta(faq, 'name', 'description')

  expect(indexTitle).toBeTruthy()
  expect(faqTitle).toBeTruthy()
  expect(indexTitle).not.toBe(faqTitle)
  expect(indexDescription?.length).toBeGreaterThanOrEqual(50)
  expect(indexDescription?.length).toBeLessThanOrEqual(160)
  expect(faqDescription?.length).toBeGreaterThanOrEqual(50)
  expect(faqDescription?.length).toBeLessThanOrEqual(160)
  expect(indexDescription).not.toBe(faqDescription)
  expect(index).toMatch(new RegExp(`<link rel="canonical" href="${root}/" ?/?>`))
  expect(faq).toMatch(new RegExp(`<link rel="canonical" href="${root}/faq" ?/?>`))
  expect(index).toContain('role="status"')

  for (const html of [index, faq]) {
    expect(html.match(/<h1/g)?.length).toBe(1)
    expect(html).toContain('<footer')
    expect(html).toContain('href="/faq"')
    expect(meta(html, 'name', 'robots')).toBe('index,follow')
    expect(meta(html, 'property', 'og:image')).toBe(`${root}/social.png`)
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image')
  }
})

test('structured data, assets, and crawl files match the shipped pages', async () => {
  const [index, faq, robots, sitemap, social] = await Promise.all([
    page('index.html'),
    page('faq.html'),
    Bun.file('dist/robots.txt').text(),
    Bun.file('dist/sitemap.xml').text(),
    Bun.file('dist/social.png').arrayBuffer(),
  ])
  const app = jsonLd(index)
  const faqData = jsonLd(faq)
  const questions =
    (faqData.mainEntity as Array<{ acceptedAnswer: { text: string }; name: string }>) ?? []

  expect(app).toMatchObject({ '@type': 'WebApplication', name: 'Timestamp', url: `${root}/` })
  expect(faqData['@type']).toBe('FAQPage')
  expect(faq.match(/<details name="faq"/g)).toHaveLength(7)
  expect(faq.match(/<summary>/g)).toHaveLength(7)
  for (const question of questions) {
    expect(faq).toContain(question.name)
    expect(faq).toContain(question.acceptedAnswer.text)
  }
  expect(questions).toHaveLength(7)
  expect(robots).toContain(`Sitemap: ${root}/sitemap.xml`)
  expect(sitemap.match(/<loc>/g)).toHaveLength(2)
  expect(sitemap).toContain(`${root}/`)
  expect(sitemap).toContain(`${root}/faq`)
  for (const asset of [
    'apple-touch-icon.png',
    'favicon.ico',
    'favicon.svg',
    'icon-192.png',
    'icon-512.png',
    'site.webmanifest',
  ]) {
    expect(await Bun.file(`dist/${asset}`).exists()).toBeTrue()
  }

  const maxSocialImageBytes = 102_400
  const bytes = new DataView(social)
  expect(social.byteLength).toBeLessThan(maxSocialImageBytes)
  expect(bytes.getUint32(16)).toBe(1_200)
  expect(bytes.getUint32(20)).toBe(630)
})

test('the converter remains local-only', async () => {
  const [index, faq, converter] = await Promise.all([
    page('index.html'),
    page('faq.html'),
    Bun.file('src/timestamp/converter.ts').text(),
  ])
  const resourceUrls = [
    ...`${index}\n${faq}`.matchAll(/<(?:link|script|img)[^>]+(?:href|src)="(https?:[^"']+)"/g),
  ].map((match) => match[1])

  expect(
    resourceUrls.every((url) => url.startsWith(root) || url.startsWith(analyticsOrigin)),
  ).toBeTrue()
  expect(converter).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/)
})

test('built _headers configures strict CSP, security headers, and immutable chunk caching', async () => {
  const headers = await Bun.file('dist/_headers').text()
  const csp = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1] ?? ''
  const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? ''

  expect(csp).toContain("default-src 'self'")
  expect(scriptSrc).toContain("'self'")
  expect(scriptSrc).toContain('https://openpanel.themkvz.com')
  expect(scriptSrc).not.toContain("'unsafe-inline'")
  expect(scriptSrc.match(/'sha256-[A-Za-z0-9+/=]+'/g)?.length).toBeGreaterThanOrEqual(2)
  for (const name of ['index.html', 'faq.html', 'faq/index.html']) {
    const html = await page(name)
    for (const [, body = ''] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`
      expect(scriptSrc).toContain(hash)
    }
  }
  expect(csp).toContain("img-src 'self' data:")
  expect(csp).toContain("font-src 'self' data:")
  expect(csp).toContain("connect-src 'self' https://openpanel.themkvz.com")
  expect(csp).toContain("object-src 'none'")
  expect(csp).toContain("base-uri 'none'")
  expect(csp).toContain("frame-ancestors 'none'")
  expect(headers).toContain('X-Content-Type-Options: nosniff')
  expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin')
  expect(headers).toMatch(/\/chunk-\*\n\s+Cache-Control: public, max-age=31536000, immutable/)
})

test('built dist omits 0-byte files and hashed public duplicates and keeps stable asset URLs', async () => {
  const [distFiles, publicFiles, index, faq, faqClean] = await Promise.all([
    listFiles('dist'),
    readdir('public'),
    page('index.html'),
    page('faq.html'),
    page('faq/index.html'),
  ])

  const fileSizes = await Promise.all(
    distFiles.map(async (file) => ({ file, size: (await stat(file)).size })),
  )
  expect(fileSizes.filter(({ size }) => size === 0)).toEqual([])

  const distNames = distFiles.map((file) => basename(file))
  for (const publicFile of publicFiles) {
    expect(await Bun.file(`dist/${publicFile}`).exists()).toBeTrue()
    const ext = extname(publicFile)
    const stem = basename(publicFile, ext)
    const hashedDuplicate = new RegExp(`^${escapeRegExp(stem)}-[a-z0-9]+${escapeRegExp(ext)}$`)
    expect(distNames.filter((name) => hashedDuplicate.test(name))).toEqual([])
  }

  expect(faqClean).toBe(faq)
  expect(faq).not.toMatch(/<script\b[^>]*\btype=["']module["']/)

  const stablePublicUrls = [
    '/favicon.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/site.webmanifest',
  ]
  for (const html of [index, faq, faqClean]) {
    expect(html).not.toContain('./public/')
    for (const stableUrl of stablePublicUrls) {
      expect(html).toContain(`href="${stableUrl}"`)
    }

    const localAssets = [
      ...html.matchAll(/<(?:link\b[^>]*\bhref|script\b[^>]*\bsrc)=["'](\/[^"']+)["']/g),
    ].map((match) => match[1])
    expect(localAssets.length).toBeGreaterThanOrEqual(5)
    for (const assetPath of localAssets) {
      expect(await Bun.file(`dist${assetPath}`).exists()).toBeTrue()
    }
  }
})

test('built CSS defines keyframes for referenced animations', async () => {
  const cssFiles = (await readdir('dist')).filter((file) => /^chunk-.*\.css$/.test(file))
  expect(cssFiles.length).toBeGreaterThanOrEqual(1)

  for (const file of cssFiles) {
    const css = await Bun.file(`dist/${file}`).text()
    if (css.includes('fade-in-up')) {
      const keyframes = [...css.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map((match) => match[1])
      expect(keyframes).toContain('fade-in-up')
    }
  }
})
