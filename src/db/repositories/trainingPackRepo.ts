import { getDb, type TrainingPack } from '../schema'
import { logError, logEvent } from '../../observability/devLogger'
import { storageRecoveryGuidance } from '../../storage/storageGuidance'

export async function saveTrainingPack(pack: TrainingPack): Promise<void> {
  try {
    const db = await getDb()
    await db.put('trainingPacks', pack)
    logEvent('db_training_pack', 'saved', {
      packId: pack.id,
      sentenceCount: pack.sentences.length
    })
  } catch (error) {
    logError('db_training_pack', 'save_failed', error, { packId: pack.id })
    throw new Error(storageRecoveryGuidance(error))
  }
}

export async function getTrainingPack(id: string): Promise<TrainingPack | undefined> {
  try {
    const db = await getDb()
    const pack = await db.get('trainingPacks', id)
    logEvent('db_training_pack', 'read', {
      packId: id,
      found: Boolean(pack)
    })
    return pack
  } catch (error) {
    logError('db_training_pack', 'read_failed', error, { packId: id })
    throw new Error(storageRecoveryGuidance(error))
  }
}

export async function listTrainingPacks(): Promise<TrainingPack[]> {
  const db = await getDb()
  const packs = await db.getAll('trainingPacks')
  logEvent('db_training_pack', 'listed', {
    count: packs.length
  })
  return packs
}

export async function removeTrainingPack(id: string): Promise<void> {
  const db = await getDb()
  const transaction = db.transaction(['trainingPacks', 'progress'], 'readwrite')
  await transaction.objectStore('trainingPacks').delete(id)
  await transaction.objectStore('progress').delete(id)
  await transaction.done

  logEvent('db_training_pack', 'removed', {
    packId: id,
    clearedProgress: true
  })
}
