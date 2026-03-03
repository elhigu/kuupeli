import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined)
}))

describe('Play star progress summary', () => {
  it('updates and persists summary when a sentence is completed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /aloita/i }))
    await user.click(screen.getByLabelText('Sentence answer input'))
    await user.keyboard('olipakerran')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/Star progress: 1\/50 sentences, 3\/150 stars/)).toBeInTheDocument()

    const raw = localStorage.getItem('kuupeli-starter-star-progress-v1')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw ?? '{}')).toEqual({ 0: 3 })
  })

  it('shows persisted summary on app load', () => {
    localStorage.setItem('kuupeli-starter-star-progress-v1', JSON.stringify({ 0: 3, 1: 2 }))
    render(<App />)

    expect(screen.getByText(/Star progress: 2\/50 sentences, 5\/150 stars/)).toBeInTheDocument()
  })
})
