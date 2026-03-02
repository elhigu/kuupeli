export interface SessionState {
  index: number
  total: number
}

export interface SessionEngine {
  currentSentence(): string
  currentIndex(): number
  next(): string | undefined
  isComplete(): boolean
}
