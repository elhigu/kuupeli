import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined)
}))

describe('Play page success transition', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('submits on Enter, disables controls, and auto-advances after transition delay', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /aloita/i }))

    const progress = screen.getByText(/Starter Pack:/)
    expect(progress).toHaveTextContent('Starter Pack: 1/50')

    const composer = screen.getByLabelText('Sentence answer input')
    composer.focus()
    for (const key of 'olipakerran') {
      fireEvent.keyDown(composer, { key })
    }
    fireEvent.keyDown(composer, { key: 'Enter' })

    expect(screen.getByText('Stars: 3')).toBeInTheDocument()
    expect(progress).toHaveTextContent('Starter Pack: 1/50')
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /skip sentence/i })).toBeDisabled()

    await act(async () => {
      vi.advanceTimersByTime(699)
    })

    expect(progress).toHaveTextContent('Starter Pack: 1/50')

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(progress).toHaveTextContent('Starter Pack: 2/50')
  })
})
