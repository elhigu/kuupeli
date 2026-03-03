import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { saveTrainingPack } from '../../src/db/repositories/trainingPackRepo'
import { saveProgress } from '../../src/db/repositories/progressRepo'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { playSentenceAudio } from '../../src/tts/playback'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined),
  stopActivePlayback: vi.fn(() => true)
}))

describe('Start modal', () => {
  it('shows full-screen start gate and closes when Aloita is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Oletko valmis ensimmäiseen lauseeseen?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aloita' })).toBeInTheDocument()
    expect(playSentenceAudio).toHaveBeenCalledTimes(0)

    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    await waitFor(() => {
      expect(screen.queryByText('Oletko valmis ensimmäiseen lauseeseen?')).not.toBeInTheDocument()
    })
    expect(playSentenceAudio).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Sentence answer input')).toHaveFocus()
  })

  it('allows selecting an imported story and continues from stored progress', async () => {
    const user = userEvent.setup()
    await saveTrainingPack({
      id: 'test-story-pack',
      title: 'Testitarina',
      sentences: ['Ensimmäinen lause.', 'Toinen lause.']
    })
    await saveProgress({
      packId: 'test-story-pack',
      sentenceIndex: 1,
      updatedAt: '2026-03-03T00:00:00.000Z'
    })

    render(<App />)

    const storyOption = await screen.findByRole('radio', { name: /testitarina/i })
    await user.click(storyOption)
    await user.click(screen.getByRole('button', { name: 'Aloita' }))

    await waitFor(() => {
      expect(playSentenceAudio).toHaveBeenCalledWith('Toinen lause.')
    })
    expect(screen.getByText(/Testitarina: 2\/2/i)).toBeInTheDocument()
  })
})
