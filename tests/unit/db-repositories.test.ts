import { beforeEach, describe, expect, it } from 'vitest'
import { getProgress, saveProgress } from '../../src/db/repositories/progressRepo'
import {
  getTrainingPack,
  listTrainingPacks,
  removeTrainingPack,
  saveTrainingPack
} from '../../src/db/repositories/trainingPackRepo'

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

  it('lists saved training packs in key order', async () => {
    await saveTrainingPack({ id: 'pack-2', title: 'Second', sentences: ['Kaksi.'] })
    await saveTrainingPack({ id: 'pack-1', title: 'First', sentences: ['Yksi.'] })

    const packs = await listTrainingPacks()

    expect(packs.map((pack) => pack.id)).toEqual(['pack-1', 'pack-2'])
  })

  it('removes a training pack and clears its progress', async () => {
    await saveTrainingPack({ id: 'pack-1', title: 'Book', sentences: ['Hei maailma.'] })
    await saveProgress({
      packId: 'pack-1',
      sentenceIndex: 3,
      updatedAt: new Date().toISOString()
    })

    await removeTrainingPack('pack-1')

    expect(await getTrainingPack('pack-1')).toBeUndefined()
    expect(await getProgress('pack-1')).toBeUndefined()
  })
})
