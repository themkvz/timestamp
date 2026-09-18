import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { force: true, recursive: true })
const result = await Bun.build({
  entrypoints: ['index.html', 'faq.html'],
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
