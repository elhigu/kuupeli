import { getDb, type TrainingPack } from '../schema'

export async function saveTrainingPack(pack: TrainingPack): Promise<void> {
  const db = await getDb()
  await db.put('trainingPacks', pack)
}

export async function getTrainingPack(id: string): Promise<TrainingPack | undefined> {
  const db = await getDb()
  return db.get('trainingPacks', id)
}
