import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

describe('Theme mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('defaults to dark mode', async () => {
    render(<App />)

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
  })

  it('toggles to light mode and persists selection', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /switch to light mode/i }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light')
      expect(localStorage.getItem('kuupeli-theme')).toBe('light')
    })
  })

  it('shows recoverable guidance when browser storage is full', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/browser storage is full/i)
  })
})
