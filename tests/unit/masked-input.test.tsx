import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MaskedSentenceInput } from '../../src/components/MaskedSentenceInput'

describe('Masked sentence input', () => {
  it('renders punctuation as fixed characters', () => {
    render(<MaskedSentenceInput sentence="Olipa kerran." />)
    expect(screen.getByText('.')).toBeInTheDocument()
  })
})
