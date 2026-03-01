import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Favicon asset', () => {
  it('provides favicon.ico in public assets', () => {
    expect(fs.existsSync('public/favicon.ico')).toBe(true)
  })
})
