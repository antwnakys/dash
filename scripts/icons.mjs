// Renders the app icon and favicons from assets/*.svg.  Run: node scripts/icons.mjs
import { mkdirSync, copyFileSync } from 'node:fs'
import sharp from 'sharp'

const icon = 'assets/app-icon.svg'
const out = (size, file, opts = {}) =>
  sharp(icon, { density: 300 }).resize(size, size).flatten({ background: '#0b0d12' }).png(opts).toFile(file)

mkdirSync('public', { recursive: true })
await out(1024, 'assets/app-icon-1024.png')
await out(512, 'public/icon-512.png')
await out(192, 'public/icon-192.png')
await out(180, 'public/apple-touch-icon.png')
copyFileSync('assets/logo-mark.svg', 'public/favicon.svg')
console.log('icons written')
