import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImportControls } from '../components/ImportControls'
import { getProgress, removeProgress, saveProgress } from '../db/repositories/progressRepo'
import { listTrainingPacks, removeTrainingPack, saveTrainingPack } from '../db/repositories/trainingPackRepo'
import type { TrainingPack } from '../db/schema'
import { parsePdfFile } from '../ingestion/pdfParser'
import { splitSentences } from '../ingestion/sentenceSplitter'
import { parseTxtFile } from '../ingestion/txtParser'
import { logError, logEvent } from '../observability/devLogger'

function deriveStoryTitle(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '') || 'Imported story'
}

function createStoryId(fileName: string): string {
  const safeName = deriveStoryTitle(fileName).toLocaleLowerCase('fi-FI').replace(/[^a-z0-9]+/g, '-')
  const randomPart = Math.random().toString(36).slice(2, 8)
  return `story-${safeName}-${randomPart}`
}

async function parseImportFile(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLocaleLowerCase('fi-FI').endsWith('.pdf')
  return isPdf ? parsePdfFile(file) : parseTxtFile(file)
}

export function StoriesPage() {
  const [stories, setStories] = useState<TrainingPack[]>([])
  const [progressByStoryId, setProgressByStoryId] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function refreshStories() {
    const packs = (await listTrainingPacks()).filter((story) => story.sentences.length > 0)
    const progressEntries = await Promise.all(
      packs.map(async (story) => {
        const progress = await getProgress(story.id)
        return [story.id, progress?.sentenceIndex ?? 0] as const
      })
    )

    setStories(packs)
    setProgressByStoryId(Object.fromEntries(progressEntries))
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        await refreshStories()
      } catch (loadError) {
        if (!cancelled) {
          setError('Story list loading failed.')
          logError('stories', 'list_failed', loadError)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Stories</h1>
        <Link to="/play">Back to Play</Link>
      </header>

      <section className="tools-panel">
        <p>Add and remove local training texts. Imported stories can be selected in the start modal.</p>
        <ImportControls
          onSelect={(file) => {
            void (async () => {
              setIsLoading(true)
              setError(null)
              logEvent('stories', 'story_file_selected', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
              })

              try {
                const text = await parseImportFile(file)
                const sentences = splitSentences(text)
                if (sentences.length === 0) {
                  setError('No sentences found in file.')
                  logEvent('stories', 'import_empty_sentences', { fileName: file.name })
                  return
                }

                const story: TrainingPack = {
                  id: createStoryId(file.name),
                  title: deriveStoryTitle(file.name),
                  sentences
                }

                await saveTrainingPack(story)
                await refreshStories()
                logEvent('stories', 'import_saved', {
                  storyId: story.id,
                  title: story.title,
                  sentenceCount: story.sentences.length
                })
              } catch (importError) {
                setError('Story import failed.')
                logError('stories', 'import_failed', importError, { fileName: file.name })
              } finally {
                setIsLoading(false)
              }
            })()
          }}
        />
        {isLoading && <p aria-live="polite">Importing story...</p>}
        {error && <p role="alert">{error}</p>}

        <section className="story-library" aria-label="Imported stories">
          <h2>Imported stories</h2>
          {stories.length === 0 ? (
            <p>No imported stories yet.</p>
          ) : (
            <ul className="story-list">
              {stories.map((story) => (
                <li key={story.id} className="story-list-item">
                  <div>
                    <strong>{story.title}</strong>
                    <p>
                      {story.sentences.length} sentence{story.sentences.length === 1 ? '' : 's'}
                    </p>
                    <p>
                      Progress: {Math.min((progressByStoryId[story.id] ?? 0) + 1, story.sentences.length)}/{story.sentences.length}
                    </p>
                  </div>
                  <div className="story-item-actions">
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            const persisted = await getProgress(story.id)
                            const currentIndex = persisted?.sentenceIndex ?? 0
                            const rewoundIndex = Math.max(0, currentIndex - 1)
                            await saveProgress({
                              packId: story.id,
                              sentenceIndex: rewoundIndex,
                              updatedAt: new Date().toISOString()
                            })
                            await refreshStories()
                            logEvent('stories', 'progress_rewound', {
                              storyId: story.id,
                              title: story.title,
                              fromSentenceIndex: currentIndex,
                              toSentenceIndex: rewoundIndex
                            })
                          } catch (rewindError) {
                            setError('Story progress rewind failed.')
                            logError('stories', 'progress_rewind_failed', rewindError, { storyId: story.id })
                          }
                        })()
                      }}
                      aria-label={`Rewind ${story.title}`}
                    >
                      Rewind 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await removeProgress(story.id)
                            await refreshStories()
                            logEvent('stories', 'progress_reset', { storyId: story.id, title: story.title })
                          } catch (resetError) {
                            setError('Story progress reset failed.')
                            logError('stories', 'progress_reset_failed', resetError, { storyId: story.id })
                          }
                        })()
                      }}
                      aria-label={`Reset progress for ${story.title}`}
                    >
                      Reset progress
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await removeTrainingPack(story.id)
                            await removeProgress(story.id)
                            await refreshStories()
                            logEvent('stories', 'removed', { storyId: story.id, title: story.title })
                          } catch (removeError) {
                            setError('Story removal failed.')
                            logError('stories', 'remove_failed', removeError, { storyId: story.id })
                          }
                        })()
                      }}
                      aria-label={`Remove ${story.title}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}
