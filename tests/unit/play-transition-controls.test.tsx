import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined)
}))

describe('Play transition controls', () => {
  it('keeps submit disabled when sentence is not complete', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    const submit = screen.getByRole('button', { name: /submit/i })
    expect(submit).toBeDisabled()

    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipa')
    expect(submit).toBeDisabled()
  })

  it('renders submit and skip controls on the same row container', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    const actionRow = container.querySelector('.round-actions')
    expect(actionRow).not.toBeNull()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip sentence/i })).toBeInTheDocument()
  })

  it('does not render replay count in the visible UI', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    expect(screen.queryByText(/replay count/i)).not.toBeInTheDocument()
  })
})
