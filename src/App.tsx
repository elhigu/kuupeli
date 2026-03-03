import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MaskedSentenceComposer, type MaskedSentenceComposerValue } from './components/MaskedSentenceComposer'
import { ReplayButton } from './components/ReplayButton'
import { StartModal } from './components/StartModal'
import { SubmitButton } from './components/SubmitButton'
import { getProgress, saveProgress } from './db/repositories/progressRepo'
import { listTrainingPacks } from './db/repositories/trainingPackRepo'
import type { TrainingPack } from './db/schema'
import { DEFAULT_STORY, DEFAULT_STORY_ID } from './data/defaultStory'
import { preloadTestingModelIfNeeded } from './models/testModelPreload'
import { logError, logEvent } from './observability/devLogger'
import { findInvalidWords } from './scoring/retryEvaluator'
import { scoreStars } from './scoring/starScorer'
import { storageRecoveryGuidance } from './storage/storageGuidance'
import { playSentenceAudio } from './tts/playback'

type ThemeMode = 'dark' | 'light'
const THEME_STORAGE_KEY = 'kuupeli-theme'
const SUCCESS_ADVANCE_DELAY_MS = 700

const EMPTY_MASK_VALUE: MaskedSentenceComposerValue = {
  compact: '',
  spaced: '',
  isComplete: false
}

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

function shouldDeferAutoplayForGesture(): boolean {
  if (typeof navigator === 'undefined' || !('userActivation' in navigator)) {
    return false
  }

  return !navigator.userActivation.hasBeenActive
}

function clampSentenceIndex(index: number, sentenceCount: number): number {
  if (sentenceCount <= 0) {
    return 0
  }

  return Math.max(0, Math.min(index, sentenceCount - 1))
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => readPersistedTheme())
  const [stories, setStories] = useState<TrainingPack[]>([DEFAULT_STORY])
  const [progressByStoryId, setProgressByStoryId] = useState<Record<string, number>>({})
  const [activeStoryId, setActiveStoryId] = useState(DEFAULT_STORY_ID)
  const [selectedStoryId, setSelectedStoryId] = useState(DEFAULT_STORY_ID)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [maskValue, setMaskValue] = useState<MaskedSentenceComposerValue>(EMPTY_MASK_VALUE)
  const [attemptCount, setAttemptCount] = useState(0)
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(true)
  const [hasSessionStarted, setHasSessionStarted] = useState(false)
  const [focusSignal, setFocusSignal] = useState(0)
  const transitionTimerRef = useRef<number | null>(null)
  const lastAutoplayKeyRef = useRef<string | null>(null)

  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeStoryId) ?? DEFAULT_STORY,
    [activeStoryId, stories]
  )
  const currentSentences = activeStory.sentences
  const sentenceCount = currentSentences.length
  const currentSentence = currentSentences[sentenceIndex] ?? currentSentences[0] ?? ''

  const targetWords = useMemo(
    () => currentSentence.split(/\s+/).map((word) => normalizeWord(word)).filter(Boolean),
    [currentSentence]
  )

  const isComplete = stars !== null
  const isSubmitDisabled = !maskValue.isComplete || isAdvancing
  const isSkipDisabled = isAdvancing

  useEffect(() => {
    void preloadTestingModelIfNeeded()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadStories = async () => {
      try {
        const customStories = await listTrainingPacks()
        if (cancelled) {
          return
        }

        const filteredStories = customStories.filter((story) => story.id !== DEFAULT_STORY_ID && story.sentences.length > 0)
        const nextStories = [DEFAULT_STORY, ...filteredStories]
        setStories(nextStories)
        setSelectedStoryId((current) => (nextStories.some((story) => story.id === current) ? current : DEFAULT_STORY_ID))
        setActiveStoryId((current) => (nextStories.some((story) => story.id === current) ? current : DEFAULT_STORY_ID))

        const progressEntries = await Promise.all(
          nextStories.map(async (story) => {
            const progress = await getProgress(story.id)
            return [story.id, progress?.sentenceIndex ?? 0] as const
          })
        )
        if (cancelled) {
          return
        }

        setProgressByStoryId(Object.fromEntries(progressEntries))
        logEvent('stories', 'loaded', {
          storyCount: nextStories.length,
          customStoryCount: filteredStories.length
        })
      } catch (error) {
        if (!cancelled) {
          logError('stories', 'load_failed', error)
        }
      }
    }

    void loadStories()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSentenceIndex((current) => clampSentenceIndex(current, sentenceCount))
  }, [sentenceCount])

  useEffect(() => {
    logEvent('theme', 'applying_theme', { theme })
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      setStorageWarning(null)
      logEvent('theme', 'persisted', { storageKey: THEME_STORAGE_KEY, theme })
    } catch (error) {
      // Keep gameplay running with explicit recovery guidance.
      const guidance = storageRecoveryGuidance(error)
      setStorageWarning(guidance)
      logError('theme', 'persist_failed', error, { storageKey: THEME_STORAGE_KEY, theme })
    }
  }, [theme])

  useEffect(() => {
    setMaskValue(EMPTY_MASK_VALUE)
    setAttemptCount(0)
    setStars(null)
    setInvalidIndexes([])
    setActiveWordIndex(null)
    setAudioError(null)
    setIsAdvancing(false)

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    logEvent('round', 'loaded', {
      storyId: activeStory.id,
      storyTitle: activeStory.title,
      sentenceIndex,
      sentenceCount,
      targetWordCount: targetWords.length,
      sentence: currentSentence
    })
  }, [activeStory.id, activeStory.title, currentSentence, sentenceCount, sentenceIndex, targetWords.length])

  useEffect(() => {
    if (!hasSessionStarted) {
      return
    }

    setFocusSignal((current) => current + 1)
  }, [currentSentence, hasSessionStarted, sentenceIndex])

  useEffect(() => {
    if (!hasSessionStarted || sentenceCount === 0) {
      return
    }

    const clampedIndex = clampSentenceIndex(sentenceIndex, sentenceCount)
    setProgressByStoryId((current) => {
      if (current[activeStory.id] === clampedIndex) {
        return current
      }

      return {
        ...current,
        [activeStory.id]: clampedIndex
      }
    })

    void saveProgress({
      packId: activeStory.id,
      sentenceIndex: clampedIndex,
      updatedAt: new Date().toISOString()
    }).catch((error) => {
      logError('progress', 'save_failed', error, {
        packId: activeStory.id,
        sentenceIndex: clampedIndex
      })
    })
  }, [activeStory.id, hasSessionStarted, sentenceCount, sentenceIndex])

  useEffect(() => {
    if (!isAdvancing) {
      return
    }

    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      if (sentenceIndex >= sentenceCount - 1) {
        setIsAdvancing(false)
        logEvent('round', 'success_transition_completed_last_sentence', {
          sentenceIndex,
          transitionDelayMs: SUCCESS_ADVANCE_DELAY_MS
        })
        return
      }

      setSentenceIndex((current) => Math.min(current + 1, sentenceCount - 1))
      logEvent('round', 'auto_advanced_after_success', {
        fromSentenceIndex: sentenceIndex,
        toSentenceIndex: sentenceIndex + 1,
        transitionDelayMs: SUCCESS_ADVANCE_DELAY_MS
      })
    }, SUCCESS_ADVANCE_DELAY_MS)

    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }
    }
  }, [isAdvancing, sentenceCount, sentenceIndex])

  useEffect(() => {
    if (!hasSessionStarted || !currentSentence) {
      return
    }

    if (shouldDeferAutoplayForGesture()) {
      logEvent('audio', 'autoplay_deferred_until_user_interaction', { sentenceIndex })
      return
    }

    const autoplayKey = `${activeStory.id}:${sentenceIndex}:${currentSentence}`
    if (lastAutoplayKeyRef.current === autoplayKey) {
      logEvent('audio', 'autoplay_skipped_duplicate_effect', { sentenceIndex })
      return
    }

    lastAutoplayKeyRef.current = autoplayKey
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
  }, [activeStory.id, currentSentence, hasSessionStarted, sentenceIndex])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  function submitAnswer(answer: string, source: 'button' | 'keyboard') {
    if (isAdvancing) {
      logEvent('round', 'submit_ignored_while_advancing', {
        sentenceIndex,
        source
      })
      return
    }

    const nextAttempt = attemptCount + 1
    setAttemptCount(nextAttempt)

    const expected = targetWords.join(' ')
    const invalid = findInvalidWords(expected, answer)
    logEvent('round', 'submitted', {
      sentenceIndex,
      attempt: nextAttempt,
      invalidCount: invalid.length,
      source
    })

    if (invalid.length === 0) {
      const nextStars = scoreStars(nextAttempt)
      setStars(nextStars)
      setInvalidIndexes([])
      setActiveWordIndex(null)
      setIsAdvancing(true)
      logEvent('round', 'completed', {
        sentenceIndex,
        attempt: nextAttempt,
        stars: nextStars
      })
      return
    }

    setStars(null)
    setInvalidIndexes(invalid)
    setActiveWordIndex(invalid[0] ?? null)
    setIsAdvancing(false)
    logEvent('round', 'needs_retry', {
      sentenceIndex,
      attempt: nextAttempt,
      invalidIndexes: invalid
    })
  }

  async function handleReplay() {
    if (!currentSentence) {
      return
    }

    setFocusSignal((current) => current + 1)
    logEvent('audio', 'replay_clicked', { sentenceIndex })

    try {
      await playSentenceAudio(currentSentence)
      setAudioError(null)
      logEvent('audio', 'replay_completed', { sentenceIndex })
    } catch (error) {
      setAudioError('Audio playback is unavailable on this browser.')
      logError('audio', 'replay_failed', error, { sentenceIndex })
    }
  }

  function handleNextSentence() {
    if (isAdvancing) {
      logEvent('round', 'skip_ignored_while_advancing', { sentenceIndex })
      return
    }

    if (sentenceIndex < sentenceCount - 1) {
      logEvent('round', isComplete ? 'next_sentence_clicked' : 'skip_sentence_clicked', {
        fromSentenceIndex: sentenceIndex,
        toSentenceIndex: sentenceIndex + 1
      })
      setSentenceIndex((current) => current + 1)
      return
    }

    logEvent('round', 'navigation_ignored_last_sentence', { sentenceIndex })
  }

  function handleStartSession() {
    const storyId = selectedStoryId
    const selectedStory = stories.find((story) => story.id === storyId) ?? DEFAULT_STORY
    const resumeIndex = clampSentenceIndex(progressByStoryId[storyId] ?? 0, selectedStory.sentences.length)

    lastAutoplayKeyRef.current = null
    setIsStartModalOpen(false)
    setHasSessionStarted(true)
    setActiveStoryId(storyId)
    setSentenceIndex(resumeIndex)
    setFocusSignal((current) => current + 1)
    logEvent('session', 'start_clicked', {
      storyId,
      storyTitle: selectedStory.title,
      sentenceIndex: resumeIndex
    })
  }

  const handleMaskValueChange = useCallback(
    (nextValue: MaskedSentenceComposerValue) => {
      setMaskValue(nextValue)
      setActiveWordIndex(null)
      logEvent('input', 'mask_updated', {
        sentenceIndex,
        compactLength: nextValue.compact.length,
        isComplete: nextValue.isComplete
      })
    },
    [sentenceIndex]
  )

  const handleKeyboardSubmit = useCallback(
    (value: string) => {
      submitAnswer(value, 'keyboard')
    },
    [attemptCount, sentenceIndex, targetWords]
  )

  const handleIncompleteKeyboardSubmit = useCallback(() => {
    logEvent('round', 'submit_ignored_incomplete', {
      sentenceIndex,
      source: 'keyboard'
    })
  }, [sentenceIndex])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Kuupeli</h1>
        <div className="header-actions">
          <a href="/stories" className="header-link">
            Stories
          </a>
          <a href="/models" className="header-link">
            Models
          </a>
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
        </div>
      </header>
      <p aria-live="polite">
        {activeStory.title}: {Math.min(sentenceIndex + 1, sentenceCount)}/{sentenceCount}
      </p>
      {storageWarning && <p role="alert">{storageWarning}</p>}

      <section className={`round-panel${isAdvancing ? ' round-panel-success' : ''}`}>
        <ReplayButton
          onReplay={() => {
            void handleReplay()
          }}
        />
        {audioError && <p role="alert">{audioError}</p>}

        <MaskedSentenceComposer
          sentence={currentSentence}
          invalidWordIndexes={invalidIndexes}
          activeWordIndex={activeWordIndex}
          focusSignal={focusSignal}
          onValueChange={handleMaskValueChange}
          onSubmit={handleKeyboardSubmit}
          onIncompleteSubmit={handleIncompleteKeyboardSubmit}
        />

        <div className="round-actions">
          <SubmitButton
            disabled={isSubmitDisabled}
            onSubmit={() => {
              if (isSubmitDisabled) {
                logEvent('round', 'submit_ignored_button_disabled', {
                  sentenceIndex,
                  isComplete: maskValue.isComplete,
                  isAdvancing
                })
                return
              }

              submitAnswer(maskValue.spaced, 'button')
            }}
          />

          {sentenceIndex < sentenceCount - 1 && (
            <button type="button" className="skip-sentence-button" onClick={handleNextSentence} disabled={isSkipDisabled}>
              Skip sentence
            </button>
          )}
        </div>

        {isComplete && <p aria-live="polite">Stars: {stars}</p>}
        {!isComplete && invalidIndexes.length > 0 && (
          <p aria-live="polite">Fix highlighted words: {invalidIndexes.join(', ')}</p>
        )}
      </section>

      {isStartModalOpen && (
        <StartModal
          stories={stories.map((story) => ({
            id: story.id,
            title: story.title,
            sentenceCount: story.sentences.length,
            resumeIndex: progressByStoryId[story.id] ?? 0
          }))}
          selectedStoryId={selectedStoryId}
          onSelectStory={setSelectedStoryId}
          onStart={handleStartSession}
        />
      )}
    </main>
  )
}
