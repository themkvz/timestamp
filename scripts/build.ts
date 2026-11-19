import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const openPanelOrigin = 'https://openpanel.themkvz.com'
// Hashed chunk names change with their content, so they can be cached forever.
const immutableMaxAgeSeconds = 31536000
const pages = ['index.html', 'faq.html'] as const

await rm('dist', { force: true, recursive: true })
const result = await Bun.build({
  entrypoints: [...pages],
  outdir: 'dist',
  publicPath: '/',
  target: 'browser',
})

if (!result.success) {
  throw new Error('Build failed')
}

await cp('public', 'dist', { recursive: true })
await mkdir('dist/faq', { recursive: true })
await cp('dist/faq.html', 'dist/faq/index.html')

// CSP hashes of inline scripts, taken from the built HTML so they follow edits automatically.
const scriptHashes = new Set<string>()
for (const page of pages) {
  const html = await readFile(`dist/${page}`, 'utf8')
  for (const [, body = ''] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    scriptHashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...scriptHashes].join(' ')} ${openPanelOrigin}`,
  "style-src 'self'",
  // Oat draws form control icons as data: SVGs.
  "img-src 'self' data:",
  // Bun inlines Geist Variable woff2 fonts as data: URIs in the CSS bundle.
  "font-src 'self' data:",
  `connect-src 'self' ${openPanelOrigin}`,
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

// Cloudflare Pages response headers: https://developers.cloudflare.com/pages/configuration/headers/
await writeFile(
  'dist/_headers',
  `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/chunk-*
  Cache-Control: public, max-age=${immutableMaxAgeSeconds}, immutable
`,
)
