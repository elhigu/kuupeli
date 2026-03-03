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
import { readStarProgress, summarizeStarProgress, upsertSentenceStars, writeStarProgress } from './scoring/starProgress'
import { findInvalidWords } from './scoring/retryEvaluator'
import { scoreStars } from './scoring/starScorer'
import { storageRecoveryGuidance } from './storage/storageGuidance'
import { prefetchSentenceClip } from './tts/audioPrefetchQueue'
import { playSentenceAudio, stopActivePlayback } from './tts/playback'

const THEME_STORAGE_KEY = 'kuupeli-theme'
const SUCCESS_ADVANCE_DELAY_MS = 700
const STORIES_PATH = `${import.meta.env.BASE_URL}stories`
const MODELS_PATH = `${import.meta.env.BASE_URL}models`

const EMPTY_MASK_VALUE: MaskedSentenceComposerValue = {
  compact: '',
  spaced: '',
  isComplete: false
}

function normalizeWord(word: string) {
  return word.toLocaleLowerCase('fi-FI').replace(/[.,!?;:()"']/g, '')
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
  const [stories, setStories] = useState<TrainingPack[]>([DEFAULT_STORY])
  const [progressByStoryId, setProgressByStoryId] = useState<Record<string, number>>({})
  const [activeStoryId, setActiveStoryId] = useState(DEFAULT_STORY_ID)
  const [selectedStoryId, setSelectedStoryId] = useState(DEFAULT_STORY_ID)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [maskValue, setMaskValue] = useState<MaskedSentenceComposerValue>(EMPTY_MASK_VALUE)
  const [attemptCount, setAttemptCount] = useState(0)
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [starProgress, setStarProgress] = useState(() => readStarProgress())
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(true)
  const [hasSessionStarted, setHasSessionStarted] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [focusSignal, setFocusSignal] = useState(0)
  const transitionTimerRef = useRef<number | null>(null)
  const lastAutoplayKeyRef = useRef<string | null>(null)
  const latestPlaybackRequestRef = useRef(0)

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
  const starSummary = useMemo(
    () => summarizeStarProgress(starProgress, sentenceCount),
    [sentenceCount, starProgress]
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
    const theme = 'dark'
    logEvent('theme', 'applying_theme', { theme, mode: 'fixed' })
    document.documentElement.dataset.theme = 'dark'

    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      setStorageWarning(null)
      logEvent('theme', 'persisted', { storageKey: THEME_STORAGE_KEY, theme: 'dark' })
    } catch (error) {
      // Keep gameplay running with explicit recovery guidance.
      const guidance = storageRecoveryGuidance(error)
      setStorageWarning(guidance)
      logError('theme', 'persist_failed', error, { storageKey: THEME_STORAGE_KEY, theme: 'dark' })
    }
  }, [])

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
    if (!hasSessionStarted) {
      return
    }

    const nextSentence = currentSentences[sentenceIndex + 1]
    if (!nextSentence) {
      return
    }

    let cancelled = false

    const prefetchNextSentence = async () => {
      try {
        const clip = await prefetchSentenceClip(nextSentence)
        if (!cancelled) {
          logEvent('audio_prefetch', 'next_sentence_prefetched', {
            storyId: activeStory.id,
            fromSentenceIndex: sentenceIndex,
            targetSentenceIndex: sentenceIndex + 1,
            clipBytes: clip.byteLength
          })
        }
      } catch (error) {
        if (!cancelled) {
          logError('audio_prefetch', 'next_sentence_prefetch_failed', error, {
            storyId: activeStory.id,
            fromSentenceIndex: sentenceIndex,
            targetSentenceIndex: sentenceIndex + 1
          })
        }
      }
    }

    void prefetchNextSentence()

    return () => {
      cancelled = true
    }
  }, [activeStory.id, currentSentences, hasSessionStarted, sentenceIndex])

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
      await runSentencePlayback(currentSentence, { source: 'autoplay', sentenceIndex })
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
      stopActivePlayback()
    }
  }, [])

  async function runSentencePlayback(
    text: string,
    context: { source: 'autoplay' | 'replay'; sentenceIndex: number }
  ): Promise<void> {
    const requestId = latestPlaybackRequestRef.current + 1
    latestPlaybackRequestRef.current = requestId
    setIsAudioPlaying(true)

    try {
      await playSentenceAudio(text)
      setAudioError(null)
      if (context.source === 'autoplay') {
        logEvent('audio', 'autoplay_completed', { sentenceIndex: context.sentenceIndex })
      } else {
        logEvent('audio', 'replay_completed', { sentenceIndex: context.sentenceIndex })
      }
    } catch (error) {
      setAudioError('Audio playback is unavailable on this browser.')
      if (context.source === 'autoplay') {
        logError('audio', 'autoplay_failed', error, { sentenceIndex: context.sentenceIndex })
      } else {
        logError('audio', 'replay_failed', error, { sentenceIndex: context.sentenceIndex })
      }
    } finally {
      if (latestPlaybackRequestRef.current === requestId) {
        setIsAudioPlaying(false)
      }
    }
  }

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

      setStarProgress((currentProgress) => {
        const nextProgress = upsertSentenceStars(currentProgress, sentenceIndex, nextStars)
        writeStarProgress(nextProgress)
        return nextProgress
      })

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
    await runSentencePlayback(currentSentence, { source: 'replay', sentenceIndex })
  }

  function handleStopAudioPlayback() {
    const stopped = stopActivePlayback()
    setIsAudioPlaying(false)
    logEvent('audio', stopped ? 'stop_clicked' : 'stop_clicked_no_active_playback', { sentenceIndex })
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
      <header className="app-topbar">
        <h1 className="app-title">Kuupeli</h1>
        <nav className="topbar-actions" aria-label="Main menu">
          <a href={STORIES_PATH} className="header-link">
            Stories
          </a>
          <a href={MODELS_PATH} className="header-link">
            Models
          </a>
        </nav>
      </header>
      <section data-testid="game-area" className={`round-panel${isAdvancing ? ' round-panel-success' : ''}`}>
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
      <section data-testid="story-meta" className="story-meta-panel">
        <p aria-live="polite">
          {activeStory.title}: {Math.min(sentenceIndex + 1, sentenceCount)}/{sentenceCount}
        </p>
        <p aria-live="polite">
          Star progress: {starSummary.completedSentences}/{starSummary.totalSentences} sentences, {starSummary.earnedStars}/
          {starSummary.maxStars} stars
        </p>
        <p aria-live="polite">Current sentence score: {stars ?? '-'}</p>
      </section>
      {storageWarning && <p role="alert">{storageWarning}</p>}
      {hasSessionStarted && isAudioPlaying && (
        <button
          type="button"
          className="floating-stop-audio"
          aria-label="Stop audio playback"
          onClick={handleStopAudioPlayback}
        >
          Stop
        </button>
      )}

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
