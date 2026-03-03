import { getDb, type TrainingPack } from '../schema'
import { logEvent } from '../../observability/devLogger'

export async function saveTrainingPack(pack: TrainingPack): Promise<void> {
  const db = await getDb()
  await db.put('trainingPacks', pack)
  logEvent('db_training_pack', 'saved', {
    packId: pack.id,
    sentenceCount: pack.sentences.length
  })
}

export async function getTrainingPack(id: string): Promise<TrainingPack | undefined> {
  const db = await getDb()
  const pack = await db.get('trainingPacks', id)
  logEvent('db_training_pack', 'read', {
    packId: id,
    found: Boolean(pack)
  })
  return pack
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
