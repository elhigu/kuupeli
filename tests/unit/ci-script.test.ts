import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('CI script', () => {
  it('defines CI script with build, unit, and e2e gates', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    expect(pkg.scripts.ci).toContain('build')
    expect(pkg.scripts.ci).toContain('test:unit')
    expect(pkg.scripts.ci).toContain('test:e2e')
  })
})
