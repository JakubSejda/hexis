import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public', 'icons')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const hexSvg = (size: number, padding = 0) => {
  const cx = size / 2
  const cy = size / 2
  const r = (size - padding * 2) / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return `${cx + r * 0.85 * Math.cos(angle)},${cy + r * 0.85 * Math.sin(angle)}`
  }).join(' ')

  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0A0E14"/>
      <polygon points="${points}" fill="#10b981"/>
      <text x="${cx}" y="${cy + r * 0.2}" text-anchor="middle" font-size="${r * 0.5}"
        font-family="sans-serif" font-weight="bold" fill="#0A0E14">H</text>
    </svg>
  `)
}

async function generate() {
  await sharp(hexSvg(512)).resize(192, 192).png().toFile(join(OUT, 'icon-192.png'))
  await sharp(hexSvg(512)).png().toFile(join(OUT, 'icon-512.png'))
  await sharp(hexSvg(512, 52)).png().toFile(join(OUT, 'icon-maskable-512.png'))
  await sharp(hexSvg(512)).resize(180, 180).png().toFile(join(OUT, 'apple-touch-icon.png'))
  console.log('Icons generated in public/icons/')
}

generate()
