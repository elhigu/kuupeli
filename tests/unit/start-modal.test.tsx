import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { playSentenceAudio } from '../../src/tts/playback'

vi.mock('../../src/tts/playback', () => ({
  playSentenceAudio: vi.fn().mockResolvedValue(undefined)
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
})
