import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prefetchSentenceClip: vi.fn().mockResolvedValue(new ArrayBuffer(8))
}))

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined),
  stopActivePlayback: vi.fn(() => true)
}))

vi.mock('../../src/tts/audioPrefetchQueue', () => ({
  prefetchSentenceClip: mocks.prefetchSentenceClip
}))

import App from '../../src/App'

describe('App audio prefetch voice selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('kuupeli-active-model', 'fi-starter-small')
    localStorage.setItem('kuupeli-model-voice-types', JSON.stringify({ 'fi-starter-small': 'fi-female-3' }))
  })

  it('prefetches next sentence with active model runtime voice', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /aloita/i }))

    await waitFor(() => {
      expect(mocks.prefetchSentenceClip).toHaveBeenCalled()
    })

    expect(mocks.prefetchSentenceClip).toHaveBeenCalledWith(expect.any(String), 'fi+f3')
  })
})
