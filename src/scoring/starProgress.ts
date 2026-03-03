import { logError, logEvent } from '../observability/devLogger'

export type StarValue = 1 | 2 | 3
export type StarProgressMap = Record<number, StarValue>

export interface StarProgressSummary {
  completedSentences: number
  totalSentences: number
  earnedStars: number
  maxStars: number
}

export const STAR_PROGRESS_STORAGE_KEY = 'kuupeli-starter-star-progress-v1'

export function summarizeStarProgress(progress: StarProgressMap, totalSentences: number): StarProgressSummary {
  const completedSentences = Object.keys(progress).length
  const earnedStars = Object.values(progress).reduce((total, stars) => total + stars, 0)
  return {
    completedSentences,
    totalSentences,
    earnedStars,
    maxStars: totalSentences * 3
  }
}

export function readStarProgress(storageKey = STAR_PROGRESS_STORAGE_KEY): StarProgressMap {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const normalized: StarProgressMap = {}

    for (const [key, value] of Object.entries(parsed)) {
      const index = Number.parseInt(key, 10)
      if (!Number.isFinite(index) || index < 0) {
        continue
      }

      if (value === 1 || value === 2 || value === 3) {
        normalized[index] = value
      }
    }

    logEvent('star_progress', 'read', {
      storageKey,
      entryCount: Object.keys(normalized).length
    })
    return normalized
  } catch (error) {
    logError('star_progress', 'read_failed', error, { storageKey })
    return {}
  }
}

export function writeStarProgress(progress: StarProgressMap, storageKey = STAR_PROGRESS_STORAGE_KEY): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress))
    logEvent('star_progress', 'written', {
      storageKey,
      entryCount: Object.keys(progress).length
    })
  } catch (error) {
    logError('star_progress', 'write_failed', error, { storageKey })
  }
}

export function upsertSentenceStars(
  progress: StarProgressMap,
  sentenceIndex: number,
  stars: StarValue
): StarProgressMap {
  const current = progress[sentenceIndex]
  const next = current ? (Math.max(current, stars) as StarValue) : stars

  return {
    ...progress,
    [sentenceIndex]: next
  }
}
