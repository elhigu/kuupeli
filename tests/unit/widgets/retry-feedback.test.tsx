import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RetryFeedback } from '../../../src/components/RetryFeedback'

describe('RetryFeedback', () => {
  it('shows success state when no invalid indexes exist', () => {
    render(<RetryFeedback invalidIndexes={[]} />)

    expect(screen.getByRole('status')).toHaveTextContent('All words are correct.')
  })

  it('shows invalid index list when corrections are needed', () => {
    render(<RetryFeedback invalidIndexes={[1, 4, 6]} />)

    expect(screen.getByRole('status')).toHaveTextContent('Fix highlighted words: 1, 4, 6')
  })
})
