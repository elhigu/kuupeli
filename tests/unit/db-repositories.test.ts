import { beforeEach, describe, expect, it } from 'vitest'
import { getTrainingPack, saveTrainingPack } from '../../src/db/repositories/trainingPackRepo'

describe('Training pack repository', () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase('kuupeli-db')
  })

  it('stores and retrieves a training pack', async () => {
    await saveTrainingPack({ id: 'pack-1', title: 'Book', sentences: ['Hei maailma.'] })
    const pack = await getTrainingPack('pack-1')
    expect(pack?.title).toBe('Book')
    expect(pack?.sentences).toEqual(['Hei maailma.'])
  })
})
