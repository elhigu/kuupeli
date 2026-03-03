import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelManagerPanel } from '../../../src/components/ModelManagerPanel'

describe('ModelManagerPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders catalog entries and manager heading', async () => {
    render(<ModelManagerPanel />)

    expect(screen.getByRole('heading', { name: /model manager/i })).toBeInTheDocument()
    expect(
      screen.getByText(/models are local kuupeli runtime profiles in this version/i)
    ).toBeInTheDocument()
    expect(await screen.findByText(/finnish starter small/i)).toBeInTheDocument()
  })

  it('shows recoverable guidance when storage read fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })

    render(<ModelManagerPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/browser storage is full/i)
  })
})
