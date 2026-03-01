import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SubmitButton } from '../../../src/components/SubmitButton'

describe('SubmitButton', () => {
  it('invokes submit callback when enabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<SubmitButton disabled={false} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not invoke callback when disabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<SubmitButton disabled={true} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
