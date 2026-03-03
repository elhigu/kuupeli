import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MaskedSentenceComposer, type MaskedSentenceComposerValue } from './components/MaskedSentenceComposer'
import { ReplayButton } from './components/ReplayButton'
import { StartModal } from './components/StartModal'
import { SubmitButton } from './components/SubmitButton'
import { STARTER_SENTENCES } from './data/starterSentences'
import { logError, logEvent } from './observability/devLogger'
import { findInvalidWords } from './scoring/retryEvaluator'
import { scoreStars } from './scoring/starScorer'
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

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => readPersistedTheme())
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const currentSentence = STARTER_SENTENCES[sentenceIndex]
  const [maskValue, setMaskValue] = useState<MaskedSentenceComposerValue>(EMPTY_MASK_VALUE)
  const [attemptCount, setAttemptCount] = useState(0)
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(true)
  const [hasSessionStarted, setHasSessionStarted] = useState(false)
  const [focusSignal, setFocusSignal] = useState(0)
  const transitionTimerRef = useRef<number | null>(null)
  const lastAutoplayKeyRef = useRef<string | null>(null)

  const targetWords = useMemo(
    () => currentSentence.split(/\s+/).map((word) => normalizeWord(word)).filter(Boolean),
    [currentSentence]
  )

  const isComplete = stars !== null
  const isSubmitDisabled = !maskValue.isComplete || isAdvancing
  const isSkipDisabled = isAdvancing

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
      sentenceIndex,
      sentenceCount: STARTER_SENTENCES.length,
      targetWordCount: targetWords.length,
      sentence: currentSentence
    })
  }, [currentSentence, sentenceIndex, targetWords.length])

  useEffect(() => {
    if (!hasSessionStarted) {
      return
    }

    setFocusSignal((current) => current + 1)
  }, [currentSentence, hasSessionStarted, sentenceIndex])

  useEffect(() => {
    if (!isAdvancing) {
      return
    }

    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      if (sentenceIndex >= STARTER_SENTENCES.length - 1) {
        setIsAdvancing(false)
        logEvent('round', 'success_transition_completed_last_sentence', {
          sentenceIndex,
          transitionDelayMs: SUCCESS_ADVANCE_DELAY_MS
        })
        return
      }

      setSentenceIndex((current) => Math.min(current + 1, STARTER_SENTENCES.length - 1))
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
  }, [isAdvancing, sentenceIndex])

  useEffect(() => {
    if (!hasSessionStarted) {
      return
    }

    if (shouldDeferAutoplayForGesture()) {
      logEvent('audio', 'autoplay_deferred_until_user_interaction', { sentenceIndex })
      return
    }

    const autoplayKey = `${sentenceIndex}:${currentSentence}`
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
  }, [currentSentence, hasSessionStarted, sentenceIndex])

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

  function handleStartSession() {
    setIsStartModalOpen(false)
    setHasSessionStarted(true)
    setFocusSignal((current) => current + 1)
    logEvent('session', 'start_clicked', { sentenceIndex })
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
        Starter Pack: {sentenceIndex + 1}/{STARTER_SENTENCES.length}
      </p>

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

          {sentenceIndex < STARTER_SENTENCES.length - 1 && (
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

      {isStartModalOpen && <StartModal onStart={handleStartSession} />}
    </main>
  )
}
