// Renders the Mac app icon from the white iPhone icon (assets/app-icon-light.svg).  Run: npm run icons:mac
// macOS doesn't round icons for you, so this draws Apple's rounded square (824 px on a 1024 canvas)
// with a soft shadow, then `tauri icon` writes every size into src-tauri/icons.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import sharp from 'sharp'

const art = await sharp(readFileSync('assets/app-icon-light.svg'), { density: 300 }).resize(824, 824).png().toBuffer()
const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="824" height="824"><rect width="824" height="824" rx="185" fill="#fff"/></svg>')
const tile = await sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
const edge = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="824" height="824"><rect x=".5" y=".5" width="823" height="823" rx="185" fill="none" stroke="#000" stroke-opacity=".08"/></svg>',
)
const shadow = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs><rect x="100" y="112" width="824" height="824" rx="185" fill="#000" fill-opacity=".28" filter="url(#s)"/></svg>`,
)
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: shadow }, { input: tile, left: 100, top: 100 }, { input: edge, left: 100, top: 100 }])
  .png()
  .toFile('assets/mac-icon-1024.png')
execFileSync('npx', ['tauri', 'icon', 'assets/mac-icon-1024.png', '-o', 'src-tauri/icons'], { stdio: 'inherit' })
// Only the Mac sizes are used; tauri icon also writes Windows, Android and iOS ones.
const keep = new Set(['icon.icns', 'icon.png', '32x32.png', '128x128.png', '128x128@2x.png'])
for (const f of readdirSync('src-tauri/icons')) if (!keep.has(f)) rmSync(`src-tauri/icons/${f}`, { recursive: true })
console.log('mac icon written')
