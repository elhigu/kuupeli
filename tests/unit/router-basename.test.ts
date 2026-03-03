import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Router basename configuration', () => {
  it('sets BrowserRouter basename from Vite BASE_URL', () => {
    const source = fs.readFileSync('src/main.tsx', 'utf8')
    expect(source).toMatch(/<BrowserRouter basename=\{import\.meta\.env\.BASE_URL\}>/)
  })
})
