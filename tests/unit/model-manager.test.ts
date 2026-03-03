import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FINNISH_PIPER_AVAILABLE_VOICE_IDS,
  FINNISH_PIPER_UNAVAILABLE_HIGHER_TIERS
} from '../../src/models/catalog'
import {
  getModelVoiceType,
  installModel,
  listAvailableModels,
  listModels,
  removeModel,
  setModelVoiceType
} from '../../src/models/modelManager'

vi.mock('../../src/tts/piperWebRuntime', () => ({
  downloadPiperVoice: vi.fn().mockResolvedValue(undefined),
  removePiperVoice: vi.fn().mockResolvedValue(undefined)
}))

describe('Model manager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lists curated available model catalog including downloadable piper voices', async () => {
    const models = await listAvailableModels()
    expect(models.some((model) => model.id === 'fi-starter-small')).toBe(true)
    expect(models.some((model) => model.id === 'fi-piper-harri-low')).toBe(true)
    expect(models.some((model) => model.id === 'fi-piper-harri-medium')).toBe(true)

    const finnishPiperVoiceIds = models
      .filter((model) => model.engine === 'piper-web' && model.piperVoiceId?.startsWith('fi_FI-'))
      .map((model) => model.piperVoiceId)
      .filter((voiceId): voiceId is string => Boolean(voiceId))
      .sort()
    expect(finnishPiperVoiceIds).toEqual([...FINNISH_PIPER_AVAILABLE_VOICE_IDS].sort())
    expect(models.some((model) => model.qualityTier === 'high' && model.piperVoiceId?.startsWith('fi_FI-'))).toBe(false)
    expect(FINNISH_PIPER_UNAVAILABLE_HIGHER_TIERS).toContain('high')
  })

  it('installs downloadable model and can remove it', async () => {
    await installModel('fi-piper-harri-low')
    const afterInstall = await listModels()
    expect(afterInstall.some((model) => model.id === 'fi-piper-harri-low')).toBe(true)

    await removeModel('fi-piper-harri-low')
    const afterRemove = await listModels()
    expect(afterRemove.some((model) => model.id === 'fi-piper-harri-low')).toBe(false)
  })

  it('persists selected voice type per model', async () => {
    await setModelVoiceType('fi-starter-small', 'fi-female-3')
    await expect(getModelVoiceType('fi-starter-small')).resolves.toBe('fi-female-3')
  })
})
