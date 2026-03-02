import { useEffect, useMemo, useState } from 'react'
import { ImportControls } from './components/ImportControls'
import { MaskedSentenceInput } from './components/MaskedSentenceInput'
import { ModelManagerPanel } from './components/ModelManagerPanel'
import { logError, logEvent } from './observability/devLogger'
import { ReplayButton } from './components/ReplayButton'
import { SubmitButton } from './components/SubmitButton'
import { STARTER_SENTENCES } from './data/starterSentences'
import { findInvalidWords } from './scoring/retryEvaluator'
import { scoreStars } from './scoring/starScorer'
import { playSentenceAudio } from './tts/playback'

type ThemeMode = 'dark' | 'light'
const THEME_STORAGE_KEY = 'kuupeli-theme'

function normalizeWord(word: string) {
  return word.toLocaleLowerCase('fi-FI').replace(/[.,!?;:()"']/g, '')
}

function readPersistedTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'dark' || value === 'light') {
      return value
    }
  } catch {
    // Ignore storage read issues and default to dark.
  }

  return 'dark'
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => readPersistedTheme())
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const currentSentence = STARTER_SENTENCES[sentenceIndex]

  const targetWords = useMemo(
    () => currentSentence.split(/\s+/).map((word) => normalizeWord(word)).filter(Boolean),
    [currentSentence]
  )

  const [answers, setAnswers] = useState<string[]>(() => targetWords.map(() => ''))
  const [attemptCount, setAttemptCount] = useState(0)
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [replayCount, setReplayCount] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)

  const isComplete = stars !== null

  useEffect(() => {
    logEvent('theme', 'applying_theme', { theme })
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      logEvent('theme', 'persisted', { storageKey: THEME_STORAGE_KEY, theme })
    } catch {
      // Ignore storage write issues so gameplay continues.
      logEvent('theme', 'persist_failed', { storageKey: THEME_STORAGE_KEY, theme })
    }
  }, [theme])

  useEffect(() => {
    setAnswers(targetWords.map(() => ''))
    setAttemptCount(0)
    setStars(null)
    setInvalidIndexes([])
    setAudioError(null)
    logEvent('round', 'loaded', {
      sentenceIndex,
      sentenceCount: STARTER_SENTENCES.length,
      targetWordCount: targetWords.length
    })
  }, [targetWords])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      logEvent('audio', 'autoplay_skipped_api_unavailable')
      return
    }

    let cancelled = false

    const autoplayCurrentSentence = async () => {
      logEvent('audio', 'autoplay_started', { sentenceIndex })
      try {
        await playSentenceAudio(currentSentence)
        if (!cancelled) {
          setAudioError(null)
          logEvent('audio', 'autoplay_completed', { sentenceIndex })
        }
      } catch (error) {
        if (!cancelled) {
          setAudioError('Audio playback is unavailable on this browser.')
          logError('audio', 'autoplay_failed', error, { sentenceIndex })
        }
      }
    }

    void autoplayCurrentSentence()

    return () => {
      cancelled = true
    }
  }, [currentSentence])

  function handleSubmit() {
    const nextAttempt = attemptCount + 1
    setAttemptCount(nextAttempt)

    const actual = answers.map((word) => normalizeWord(word)).join(' ')
    const expected = targetWords.join(' ')
    const invalid = findInvalidWords(expected, actual)
    logEvent('round', 'submitted', {
      sentenceIndex,
      attempt: nextAttempt,
      invalidCount: invalid.length
    })

    if (invalid.length === 0) {
      const nextStars = scoreStars(nextAttempt)
      setStars(nextStars)
      setInvalidIndexes([])
      logEvent('round', 'completed', {
        sentenceIndex,
        attempt: nextAttempt,
        stars: nextStars
      })
      return
    }

    setStars(null)
    setInvalidIndexes(invalid)
    logEvent('round', 'needs_retry', {
      sentenceIndex,
      attempt: nextAttempt,
      invalidIndexes: invalid
    })
  }

  async function handleReplay() {
    const nextReplayCount = replayCount + 1
    setReplayCount(nextReplayCount)
    logEvent('audio', 'replay_clicked', {
      sentenceIndex,
      replayCount: nextReplayCount
    })

    try {
      await playSentenceAudio(currentSentence)
      setAudioError(null)
      logEvent('audio', 'replay_completed', {
        sentenceIndex,
        replayCount: nextReplayCount
      })
    } catch (error) {
      setAudioError('Audio playback is unavailable on this browser.')
      logError('audio', 'replay_failed', error, {
        sentenceIndex,
        replayCount: nextReplayCount
      })
    }
  }

  function handleNextSentence() {
    if (sentenceIndex < STARTER_SENTENCES.length - 1) {
      logEvent('round', isComplete ? 'next_sentence_clicked' : 'skip_sentence_clicked', {
        fromSentenceIndex: sentenceIndex,
        toSentenceIndex: sentenceIndex + 1
      })
      setSentenceIndex((current) => current + 1)
      return
    }

    logEvent('round', 'navigation_ignored_last_sentence', { sentenceIndex })
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Kuupeli</h1>
        <button
          type="button"
          className="theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => {
            logEvent('theme', 'toggle_clicked', {
              fromTheme: theme,
              toTheme: theme === 'dark' ? 'light' : 'dark'
            })
            setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
          }}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </header>
      <p aria-live="polite">
        Starter Pack: {sentenceIndex + 1}/{STARTER_SENTENCES.length}
      </p>

      <section className="round-panel">
        <MaskedSentenceInput sentence={currentSentence} />

        <ReplayButton
          onReplay={() => {
            void handleReplay()
          }}
        />
        <p aria-live="polite">Replay count: {replayCount}</p>
        {audioError && <p role="alert">{audioError}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="word-grid">
            {targetWords.map((_, index) => {
              const label = `Word ${index + 1}`
              const isInvalid = invalidIndexes.includes(index)

              return (
                <label key={label} className={isInvalid ? 'word-input invalid' : 'word-input'}>
                  <span>{label}</span>
                  <input
                    aria-label={label}
                    value={answers[index] ?? ''}
                    onChange={(event) => {
                      const next = [...answers]
                      next[index] = event.target.value
                      setAnswers(next)
                      logEvent('input', 'word_updated', {
                        sentenceIndex,
                        wordIndex: index,
                        valueLength: event.target.value.length
                      })
                    }}
                  />
                </label>
              )
            })}
          </div>

          <SubmitButton disabled={false} onSubmit={handleSubmit} />
        </form>

        {isComplete && <p aria-live="polite">Stars: {stars}</p>}
        {sentenceIndex < STARTER_SENTENCES.length - 1 && (
          <button type="button" onClick={handleNextSentence}>
            {isComplete ? 'Next sentence' : 'Skip sentence'}
          </button>
        )}
        {!isComplete && invalidIndexes.length > 0 && (
          <p aria-live="polite">Fix highlighted words: {invalidIndexes.join(', ')}</p>
        )}
      </section>

      <section className="tools-panel">
        <ImportControls
          onSelect={(file) => {
            logEvent('ingestion', 'file_selected', {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            })
          }}
        />
        <ModelManagerPanel />
      </section>
    </main>
  )
}
