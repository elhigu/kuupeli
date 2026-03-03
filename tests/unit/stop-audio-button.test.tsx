import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

const mocks = vi.hoisted(() => ({
  playSentenceAudio: vi.fn<() => Promise<void>>(),
  stopActivePlayback: vi.fn(() => true)
}))

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: mocks.playSentenceAudio,
  stopActivePlayback: mocks.stopActivePlayback
}))

describe('Stop audio button', () => {
  beforeEach(() => {
    mocks.playSentenceAudio.mockReset()
    mocks.stopActivePlayback.mockClear()
  })

  it('appears while playback is active and hides after playback resolves', async () => {
    const user = userEvent.setup()
    let resolvePlayback: (() => void) | null = null
    mocks.playSentenceAudio.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePlayback = resolve
        })
    )

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    const stopButton = await screen.findByRole('button', { name: /stop audio playback/i })
    expect(stopButton).toBeInTheDocument()

    resolvePlayback?.()

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /stop audio playback/i })).not.toBeInTheDocument()
    })
  })

  it('stops active playback when clicked', async () => {
    const user = userEvent.setup()
    mocks.playSentenceAudio.mockImplementation(() => new Promise<void>(() => {}))

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    const stopButton = await screen.findByRole('button', { name: /stop audio playback/i })
    await user.click(stopButton)

    expect(mocks.stopActivePlayback).toHaveBeenCalledTimes(1)
  })
})
