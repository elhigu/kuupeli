import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaskedSentenceComposer } from '../../src/components/MaskedSentenceComposer'

describe('MaskedSentenceComposer', () => {
  it('fills slots by continuous typing and ignores spaces', async () => {
    const user = userEvent.setup()
    render(<MaskedSentenceComposer sentence="Olipa kerran" onSubmit={vi.fn()} />)

    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipa kerran')

    expect(screen.getByTestId('mask-value')).toHaveTextContent('olipakerran')
  })

  it('backspace deletes current slot and moves cursor left', async () => {
    const user = userEvent.setup()
    render(<MaskedSentenceComposer sentence="Olipa kerran" onSubmit={vi.fn()} />)

    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipakerran')
    await user.keyboard('{Backspace}')

    expect(screen.getByTestId('mask-value')).toHaveTextContent('olipakerra')
    expect(screen.getByTestId('mask-cursor')).toHaveTextContent('9')
  })

  it('does not submit on Enter when sentence is incomplete and cursor stays put', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<MaskedSentenceComposer sentence="Olipa kerran" onSubmit={onSubmit} />)

    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipa')
    expect(screen.getByTestId('mask-cursor')).toHaveTextContent('5')

    await user.keyboard('{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('mask-cursor')).toHaveTextContent('5')
  })

  it('submits on Enter when all fillable slots are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<MaskedSentenceComposer sentence="Olipa kerran" onSubmit={onSubmit} />)

    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipakerran{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('olipa kerran')
  })
})
