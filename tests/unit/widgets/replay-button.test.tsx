import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReplayButton } from '../../../src/components/ReplayButton'

describe('ReplayButton', () => {
  it('invokes replay callback on click', async () => {
    const user = userEvent.setup()
    const onReplay = vi.fn()

    render(<ReplayButton onReplay={onReplay} />)
    await user.click(screen.getByRole('button', { name: /replay/i }))

    expect(onReplay).toHaveBeenCalledTimes(1)
  })
})
