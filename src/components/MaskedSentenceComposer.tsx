import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildMaskModel,
  extractWordsFromSlots,
  getFirstFillableIndexForWord,
  getNextFillableIndex,
  getPreviousFillableIndex,
  isFillableLetter
} from '../play/maskedInputModel'

export interface MaskedSentenceComposerValue {
  compact: string
  spaced: string
  isComplete: boolean
}

interface MaskedSentenceComposerProps {
  sentence: string
  onSubmit: (value: string) => void
  invalidWordIndexes?: number[]
  onValueChange?: (value: MaskedSentenceComposerValue) => void
  onIncompleteSubmit?: () => void
  activeWordIndex?: number | null
  focusSignal?: number
}

export function MaskedSentenceComposer({
  sentence,
  onSubmit,
  invalidWordIndexes = [],
  onValueChange,
  onIncompleteSubmit,
  activeWordIndex = null,
  focusSignal
}: MaskedSentenceComposerProps) {
  const model = useMemo(() => buildMaskModel(sentence), [sentence])
  const [slots, setSlots] = useState<string[]>(() => Array(model.fillableCount).fill(''))
  const [cursorIndex, setCursorIndex] = useState(0)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const previousFocusSignalRef = useRef<number | undefined>(focusSignal)

  useEffect(() => {
    setSlots(Array(model.fillableCount).fill(''))
    setCursorIndex(0)
  }, [model])

  useEffect(() => {
    const compact = slots.join('')
    const spaced = extractWordsFromSlots(model, slots).join(' ')
    onValueChange?.({
      compact,
      spaced,
      isComplete: slots.every((slot) => slot.length > 0)
    })
  }, [model, onValueChange, slots])

  useEffect(() => {
    if (activeWordIndex === null) {
      return
    }

    setCursorIndex(getFirstFillableIndexForWord(model, activeWordIndex))
  }, [activeWordIndex, model])

  useEffect(() => {
    if (focusSignal === undefined || focusSignal === previousFocusSignalRef.current) {
      return
    }

    previousFocusSignalRef.current = focusSignal
    surfaceRef.current?.focus()
  }, [focusSignal])

  function handleLetterInput(letter: string) {
    if (model.fillableCount === 0) {
      return
    }

    const normalized = letter.toLocaleLowerCase('fi-FI')
    setSlots((current) => {
      const next = [...current]
      next[cursorIndex] = normalized
      return next
    })
    setCursorIndex((current) => getNextFillableIndex(model, current))
  }

  function handleBackspace() {
    if (model.fillableCount === 0) {
      return
    }

    setSlots((current) => {
      const next = [...current]
      next[cursorIndex] = ''
      return next
    })
    setCursorIndex((current) => getPreviousFillableIndex(model, current))
  }

  function handleSubmitFromKeyboard() {
    if (slots.some((slot) => slot.length === 0)) {
      onIncompleteSubmit?.()
      return
    }

    onSubmit(extractWordsFromSlots(model, slots).join(' '))
  }

  return (
    <div className="masked-composer">
      <div
        ref={surfaceRef}
        tabIndex={0}
        role="textbox"
        aria-label="Sentence answer input"
        className="masked-composer-surface"
        onClick={() => {
          surfaceRef.current?.focus()
        }}
        onKeyDown={(event) => {
          if (event.key === ' ') {
            event.preventDefault()
            return
          }

          if (event.key === 'Backspace') {
            event.preventDefault()
            handleBackspace()
            return
          }

          if (event.key === 'Enter') {
            event.preventDefault()
            handleSubmitFromKeyboard()
            return
          }

          if (event.key.length === 1 && isFillableLetter(event.key)) {
            event.preventDefault()
            handleLetterInput(event.key)
          }
        }}
      >
        {model.tokens.map((token, tokenIndex) => {
          if (token.kind === 'static') {
            return (
              <span key={`token-${tokenIndex}`} className="mask-static">
                {token.value === ' ' ? '\u00A0' : token.value}
              </span>
            )
          }

          const value = slots[token.slotIndex] || '_'
          const isActive = token.slotIndex === cursorIndex
          const isInvalid = invalidWordIndexes.includes(token.wordIndex)

          return (
            <button
              key={`slot-${token.slotIndex}`}
              data-testid={`slot-${token.slotIndex}`}
              type="button"
              className={`mask-slot${isActive ? ' active' : ''}${isInvalid ? ' invalid' : ''}`}
              onClick={() => {
                setCursorIndex(token.slotIndex)
                surfaceRef.current?.focus()
              }}
            >
              {value}
            </button>
          )
        })}
      </div>

      <output data-testid="mask-value" hidden>
        {slots.join('')}
      </output>
      <output data-testid="mask-cursor" hidden>
        {cursorIndex}
      </output>
    </div>
  )
}
