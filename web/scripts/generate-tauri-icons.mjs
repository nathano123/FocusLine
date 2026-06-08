// Generate Tauri icon set (.png at 32/128/256, .ico for Windows, .icns for macOS)
// from the same SVG mark used for the PWA favicon.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const iconsDir = join(root, 'src-tauri', 'icons')
if (!existsSync(iconsDir)) await mkdir(iconsDir, { recursive: true })

const svg = await readFile(join(root, 'public', 'favicon.svg'), 'utf8')

// Wrap the small mark in a paper-coloured padded square so the macOS / Windows
// installers / docks look polished, not just a tile.
async function renderSquare(size) {
  const inner = Math.round(size * 0.7)
  const inset = Math.round((size - inner) / 2)
  const buf = await sharp(Buffer.from(svg)).resize(inner, inner).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: '#FAFAF7' },
  })
    .composite([{ input: buf, top: inset, left: inset }])
    .png()
    .toBuffer()
}

const sizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
]
for (const { name, size } of sizes) {
  await writeFile(join(iconsDir, name), await renderSquare(size))
  console.log('wrote', name)
}

// .ico for Windows — sharp can output multi-resolution ICO via png stacking via
// the `png-to-ico` library; but a single 256 png renamed .ico is accepted by
// Tauri's bundler on most modern Windows targets.
await writeFile(join(iconsDir, 'icon.ico'), await renderSquare(256))
console.log('wrote icon.ico (single-size)')

// .icns for macOS — same story; Tauri's bundler accepts a PNG renamed for the
// dev/CI flow. CI build (tauri-action) will recompose a real ICNS bundle.
await writeFile(join(iconsDir, 'icon.icns'), await renderSquare(512))
console.log('wrote icon.icns (placeholder; CI replaces with real icns)')
