import { useMemo, useState } from 'react'
import { ImportControls } from './components/ImportControls'
import { MaskedSentenceInput } from './components/MaskedSentenceInput'
import { ModelManagerPanel } from './components/ModelManagerPanel'
import { ReplayButton } from './components/ReplayButton'
import { SubmitButton } from './components/SubmitButton'
import { findInvalidWords } from './scoring/retryEvaluator'
import { scoreStars } from './scoring/starScorer'

const TARGET_SENTENCE = 'Olipa kerran.'

function normalizeWord(word: string) {
  return word.toLocaleLowerCase('fi-FI').replace(/[.,!?;:()"']/g, '')
}

export default function App() {
  const targetWords = useMemo(
    () => TARGET_SENTENCE.split(/\s+/).map((word) => normalizeWord(word)).filter(Boolean),
    []
  )

  const [answers, setAnswers] = useState<string[]>(() => targetWords.map(() => ''))
  const [attemptCount, setAttemptCount] = useState(0)
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [replayCount, setReplayCount] = useState(0)

  const isComplete = stars !== null

  function handleSubmit() {
    const nextAttempt = attemptCount + 1
    setAttemptCount(nextAttempt)

    const actual = answers.map((word) => normalizeWord(word)).join(' ')
    const expected = targetWords.join(' ')
    const invalid = findInvalidWords(expected, actual)

    if (invalid.length === 0) {
      setStars(scoreStars(nextAttempt))
      setInvalidIndexes([])
      return
    }

    setStars(null)
    setInvalidIndexes(invalid)
  }

  return (
    <main className="app-shell">
      <h1>Kuupeli</h1>

      <section className="round-panel">
        <MaskedSentenceInput sentence={TARGET_SENTENCE} />

        <ReplayButton onReplay={() => setReplayCount((count) => count + 1)} />
        <p aria-live="polite">Replay count: {replayCount}</p>

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
                    value={answers[index]}
                    onChange={(event) => {
                      const next = [...answers]
                      next[index] = event.target.value
                      setAnswers(next)
                    }}
                  />
                </label>
              )
            })}
          </div>

          <SubmitButton disabled={false} onSubmit={handleSubmit} />
        </form>

        {isComplete && <p aria-live="polite">Stars: {stars}</p>}
        {!isComplete && invalidIndexes.length > 0 && (
          <p aria-live="polite">Fix highlighted words: {invalidIndexes.join(', ')}</p>
        )}
      </section>

      <section className="tools-panel">
        <ImportControls onSelect={() => {}} />
        <ModelManagerPanel />
      </section>
    </main>
  )
}
