import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  installModel: vi.fn(),
  logEvent: vi.fn(),
  logError: vi.fn()
}))

vi.mock('../../src/models/modelManager', () => ({
  listModels: mocks.listModels,
  installModel: mocks.installModel
}))

vi.mock('../../src/observability/devLogger', () => ({
  logEvent: mocks.logEvent,
  logError: mocks.logError
}))

import { preloadTestingModelIfNeeded } from '../../src/models/testModelPreload'

describe('test model preload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('installs piper low model when running in development and not yet installed', async () => {
    mocks.listModels.mockResolvedValue([{ id: 'fi-starter-small' }])
    mocks.installModel.mockResolvedValue(undefined)

    const result = await preloadTestingModelIfNeeded({ isDev: true })

    expect(result).toBe('installed')
    expect(mocks.installModel).toHaveBeenCalledWith('fi-piper-harri-low')
  })

  it('skips install when not in development mode', async () => {
    const result = await preloadTestingModelIfNeeded({ isDev: false })

    expect(result).toBe('skipped_environment')
    expect(mocks.listModels).not.toHaveBeenCalled()
    expect(mocks.installModel).not.toHaveBeenCalled()
  })

  it('skips install when running under browser automation', async () => {
    const result = await preloadTestingModelIfNeeded({ isDev: true, isAutomation: true })

    expect(result).toBe('skipped_automation')
    expect(mocks.listModels).not.toHaveBeenCalled()
    expect(mocks.installModel).not.toHaveBeenCalled()
  })

  it('skips install when model is already installed', async () => {
    mocks.listModels.mockResolvedValue([{ id: 'fi-piper-harri-low' }])

    const result = await preloadTestingModelIfNeeded({ isDev: true })

    expect(result).toBe('already_installed')
    expect(mocks.installModel).not.toHaveBeenCalled()
  })
})
