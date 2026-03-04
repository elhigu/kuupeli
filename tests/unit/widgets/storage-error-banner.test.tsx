import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StorageErrorBanner } from '../../../src/components/StorageErrorBanner'

describe('StorageErrorBanner', () => {
  it('renders alert message when error text exists', () => {
    render(<StorageErrorBanner message="IndexedDB unavailable" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Storage issue: IndexedDB unavailable')
  })

  it('renders nothing when message is empty', () => {
    const { container } = render(<StorageErrorBanner message="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
