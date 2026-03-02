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
