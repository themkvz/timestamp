import { expect, test } from 'bun:test'

const root = 'https://timestamp.themkvz.com'
const analyticsOrigin = 'https://openpanel.themkvz.com/'
const page = async (name: string): Promise<string> => Bun.file(`dist/${name}`).text()
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

  const bytes = new DataView(social)
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
