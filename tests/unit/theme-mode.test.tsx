import { render, screen, waitFor } from '@testing-library/react'
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
      expect(localStorage.getItem('kuupeli-theme')).toBe('dark')
    })
  })

  it('does not render light mode toggle controls', async () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: /light mode/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument()
  })

  it('shows recoverable guidance when browser storage is full', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/browser storage is full/i)
  })
})
