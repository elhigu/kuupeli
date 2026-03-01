interface RetryFeedbackProps {
  invalidIndexes: number[]
}

export function RetryFeedback({ invalidIndexes }: RetryFeedbackProps) {
  if (invalidIndexes.length === 0) {
    return <p role="status">All words are correct.</p>
  }

  return <p role="status">Fix highlighted words: {invalidIndexes.join(', ')}</p>
}
