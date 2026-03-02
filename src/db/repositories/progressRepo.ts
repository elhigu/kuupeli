import { getDb, type SessionProgress } from '../schema'
import { logEvent } from '../../observability/devLogger'

export async function saveProgress(progress: SessionProgress): Promise<void> {
  const db = await getDb()
  await db.put('progress', progress)
  logEvent('db_progress', 'saved', {
    packId: progress.packId,
    sentenceIndex: progress.currentSentenceIndex
  })
}

export async function getProgress(packId: string): Promise<SessionProgress | undefined> {
  const db = await getDb()
  const progress = await db.get('progress', packId)
  logEvent('db_progress', 'read', {
    packId,
    found: Boolean(progress)
  })
  return progress
}
