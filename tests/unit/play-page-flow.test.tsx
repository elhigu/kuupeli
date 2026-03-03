import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined)
}))

describe('Play page flow', () => {
  it('renders top menu and keeps story meta below game area', async () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Stories' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Models' })).toBeInTheDocument()

    const gameArea = screen.getByTestId('game-area')
    const storyMeta = screen.getByTestId('story-meta')
    expect(gameArea.compareDocumentPosition(storyMeta) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('accepts continuous typing and scores a correct sentence', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /aloita/i }))
    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipakerran')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText('Stars: 3')).toBeInTheDocument()
  })

  it('highlights invalid words and allows editing from clicked invalid word', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /aloita/i }))
    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipakarran')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    const invalidSlot = screen.getByTestId('slot-5')
    expect(invalidSlot).toHaveClass('invalid')

    await user.click(invalidSlot)
    expect(screen.getByTestId('mask-cursor')).toHaveTextContent('5')
  })
})
