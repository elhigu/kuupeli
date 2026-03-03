import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('CI workflow artifacts', () => {
  it('uploads Playwright artifacts after CI test gate', () => {
    const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(workflow).toMatch(/Run typecheck\/build gate/)
    expect(workflow).toMatch(/npm run build/)
    expect(workflow).toMatch(/Upload Playwright screenshots and report/)
    expect(workflow).toMatch(/if:\s+always\(\)/)
    expect(workflow).toMatch(/actions\/upload-artifact@v4/)
    expect(workflow).toMatch(/test-results/)
    expect(workflow).toMatch(/playwright-report/)
  })
})
