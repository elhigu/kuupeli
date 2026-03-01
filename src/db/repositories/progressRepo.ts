import { getDb, type SessionProgress } from '../schema'

export async function saveProgress(progress: SessionProgress): Promise<void> {
  const db = await getDb()
  await db.put('progress', progress)
}

export async function getProgress(packId: string): Promise<SessionProgress | undefined> {
  const db = await getDb()
  return db.get('progress', packId)
}
