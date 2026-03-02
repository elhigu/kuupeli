import { beforeEach, describe, expect, it } from 'vitest'
import { installModel, listModels } from '../../src/models/modelManager'

describe('Model manager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('installs and lists a curated model', async () => {
    await installModel('fi-starter-small')
    const models = await listModels()
    expect(models.some((model) => model.id === 'fi-starter-small')).toBe(true)
  })
})
