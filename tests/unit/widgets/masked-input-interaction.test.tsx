import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MaskedSentenceInput } from '../../../src/components/MaskedSentenceInput'

describe('MaskedSentenceInput', () => {
  it('keeps punctuation visible while masking letters', () => {
    render(<MaskedSentenceInput sentence="Olipa kerran, sitten." />)

    expect(screen.getByText(',')).toBeInTheDocument()
    expect(screen.getByText('.')).toBeInTheDocument()
    expect(screen.getByTestId('masked-sentence').textContent).toContain('_')
  })
})
