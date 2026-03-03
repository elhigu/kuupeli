import { getDb, type SessionProgress } from '../schema'
import { logError, logEvent } from '../../observability/devLogger'
import { storageRecoveryGuidance } from '../../storage/storageGuidance'

export async function saveProgress(progress: SessionProgress): Promise<void> {
  try {
    const db = await getDb()
    await db.put('progress', progress)
    logEvent('db_progress', 'saved', {
      packId: progress.packId,
      sentenceIndex: progress.sentenceIndex
    })
  } catch (error) {
    logError('db_progress', 'save_failed', error, { packId: progress.packId })
    throw new Error(storageRecoveryGuidance(error))
  }
}

export async function getProgress(packId: string): Promise<SessionProgress | undefined> {
  try {
    const db = await getDb()
    const progress = await db.get('progress', packId)
    logEvent('db_progress', 'read', {
      packId,
      found: Boolean(progress)
    })
    return progress
  } catch (error) {
    logError('db_progress', 'read_failed', error, { packId })
    throw new Error(storageRecoveryGuidance(error))
  }
}

export async function removeProgress(packId: string): Promise<void> {
  const db = await getDb()
  await db.delete('progress', packId)
  logEvent('db_progress', 'removed', { packId })
}
