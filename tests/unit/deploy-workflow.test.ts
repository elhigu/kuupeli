import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('GitHub Pages deploy workflow', () => {
  it('publishes dist to gh-pages on main', () => {
    const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8')
    expect(workflow).toMatch(/push:\n\s+branches:\s*\["main"\]/)
    expect(workflow).toMatch(/npm run build/)
    expect(workflow).toMatch(/Copy SPA fallback for deep links/)
    expect(workflow).toMatch(/cp dist\/index\.html dist\/404\.html/)
    expect(workflow).toMatch(/publish_branch:\s+gh-pages/)
    expect(workflow).toMatch(/publish_dir:\s+\.\/dist/)
  })
})
