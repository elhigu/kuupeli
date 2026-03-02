import { describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from '../../src/pwa/registerServiceWorker'

describe('Service worker registration', () => {
  it('does not register in development mode', () => {
    const register = vi.fn()
    const addLoadListener = vi.fn()

    const didRegister = registerServiceWorker({
      isProduction: false,
      serviceWorker: { register },
      addLoadListener
    })

    expect(didRegister).toBe(false)
    expect(addLoadListener).not.toHaveBeenCalled()
    expect(register).not.toHaveBeenCalled()
  })

  it('registers /sw.js on window load in production mode', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const addLoadListener = vi.fn<(listener: () => void) => void>()

    addLoadListener.mockImplementation((listener) => {
      listener()
    })

    const didRegister = registerServiceWorker({
      isProduction: true,
      serviceWorker: { register },
      addLoadListener
    })

    await Promise.resolve()

    expect(didRegister).toBe(true)
    expect(addLoadListener).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledWith('/sw.js')
  })
})
