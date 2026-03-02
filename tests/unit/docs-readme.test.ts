import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('README docs', () => {
  it('documents required test commands', () => {
    const readme = fs.readFileSync('README.md', 'utf8')
    expect(readme).toMatch(/npm run test:unit/)
    expect(readme).toMatch(/npm run test:e2e/)
  })
})
