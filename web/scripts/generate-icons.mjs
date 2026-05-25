// Generates PWA / iOS / favicon assets from a single SVG mark.
// Run with: npm run icons
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

if (!existsSync(publicDir)) await mkdir(publicDir, { recursive: true })

const svg = await readFile(join(publicDir, 'favicon.svg'), 'utf8')

const renderings = [
  { name: 'icon-192.png', size: 192, padded: false },
  { name: 'icon-512.png', size: 512, padded: false },
  { name: 'icon-512-maskable.png', size: 512, padded: true },
  { name: 'apple-touch-icon.png', size: 180, padded: false },
  { name: 'og-image.png', size: 1200, og: true },
]

for (const r of renderings) {
  if (r.og) {
    const w = 1200
    const h = 630
    const bg = '#0a0a0a'
    const line = '#34d399'
    const og = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="0" y="0" width="${w}" height="14" fill="${line}"/>
  <text x="80" y="320" fill="#f5f5f5" font-family="Inter, sans-serif" font-size="84" font-weight="600">FocusLine</text>
  <text x="80" y="400" fill="#a3a3a3" font-family="Inter, sans-serif" font-size="36">A focus timer you don’t have to look at.</text>
</svg>`
    await sharp(Buffer.from(og)).png().toFile(join(publicDir, r.name))
    console.log('wrote', r.name)
    continue
  }
  const inner = r.padded ? Math.round(r.size * 0.7) : r.size
  const inset = Math.round((r.size - inner) / 2)
  const buf = await sharp(Buffer.from(svg))
    .resize(inner, inner)
    .toBuffer()
  await sharp({
    create: { width: r.size, height: r.size, channels: 4, background: '#0a0a0a' },
  })
    .composite([{ input: buf, top: inset, left: inset }])
    .png()
    .toFile(join(publicDir, r.name))
  console.log('wrote', r.name)
}
