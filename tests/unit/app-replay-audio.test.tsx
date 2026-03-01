import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

describe('App replay audio', () => {
  beforeEach(() => {
    const speak = vi.fn()

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: vi.fn(),
        speak
      }
    })

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function SpeechSynthesisUtterance(this: { text: string; lang: string }, text: string) {
        this.text = text
        this.lang = ''
      }
    })
  })

  it('plays sentence audio on initial load and when replay is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: /replay/i }))

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2)
  })
})
