import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PWA manifest', () => {
  it('includes app manifest with standalone display mode', () => {
    const raw = fs.readFileSync('public/manifest.webmanifest', 'utf8')
    const manifest = JSON.parse(raw)
    expect(manifest.display).toBe('standalone')
  })
})
