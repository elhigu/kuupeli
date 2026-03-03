import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined),
  stopActivePlayback: vi.fn(() => true)
}))

import App from '../../src/App'
import { playSentenceAudio } from '../../src/tts/playback'

describe('App replay audio', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: vi.fn(),
        speak: vi.fn()
      }
    })

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function SpeechSynthesisUtterance() {}
    })
  })

  it('starts playback from Aloita and replays when replay is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(playSentenceAudio).toHaveBeenCalledTimes(0)

    await user.click(screen.getByRole('button', { name: /aloita/i }))

    await waitFor(() => {
      expect(playSentenceAudio).toHaveBeenCalledTimes(1)
    })

    const composer = screen.getByLabelText('Sentence answer input')
    expect(composer).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /replay/i }))

    expect(playSentenceAudio).toHaveBeenCalledTimes(2)
    expect(composer).toHaveFocus()
  })
})
