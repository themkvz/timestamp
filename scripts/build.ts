import { createHash } from 'node:crypto'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

const openPanelOrigin = 'https://openpanel.themkvz.com'
// Hashed chunk names change with their content, so they can be cached forever.
const immutableMaxAgeSeconds = 31536000
const pages = ['index.html', 'faq.html'] as const
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

await rm('dist', { force: true, recursive: true })
const result = await Bun.build({
  entrypoints: [...pages],
  minify: true,
  outdir: 'dist',
  publicPath: '/',
  target: 'browser',
})

if (!result.success) {
  throw new Error('Build failed')
}

const emptyJsChunks = result.outputs
  .filter((output) => output.path.endsWith('.js') && output.size === 0)
  .map((output) => basename(output.path))

const publicFiles = await readdir('public')
const hashedPublicAssets = new Map<string, string>()
for (const output of result.outputs) {
  if (output.kind !== 'asset') continue
  const hashedName = basename(output.path)
  for (const publicFile of publicFiles) {
    const ext = extname(publicFile)
    const stem = basename(publicFile, ext)
    if (new RegExp(`^${escapeRegExp(stem)}-[a-z0-9]+${escapeRegExp(ext)}$`).test(hashedName)) {
      hashedPublicAssets.set(hashedName, publicFile)
      break
    }
  }
}

for (const file of [...emptyJsChunks, ...hashedPublicAssets.keys()]) {
  await rm(`dist/${file}`, { force: true })
}

if (emptyJsChunks.length > 0 || hashedPublicAssets.size > 0) {
  const emptyScriptTag =
    emptyJsChunks.length > 0
      ? new RegExp(
          `<script\\b[^>]*\\bsrc=["']/(?:${emptyJsChunks.map(escapeRegExp).join('|')})["'][^>]*><\\/script>`,
          'g',
        )
      : null

  for (const page of pages) {
    let html = await readFile(`dist/${page}`, 'utf8')
    if (emptyScriptTag) {
      html = html.replace(emptyScriptTag, '')
    }
    for (const [hashedName, publicFile] of hashedPublicAssets) {
      html = html.replaceAll(`/${hashedName}`, `/${publicFile}`)
    }
    await writeFile(`dist/${page}`, html)
  }
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
