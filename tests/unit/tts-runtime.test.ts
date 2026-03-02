import { describe, expect, it } from 'vitest'
import { synthesizeSentence } from '../../src/tts/ttsRuntime'

describe('TTS runtime', () => {
  it('returns playable audio buffer from local runtime', async () => {
    const buffer = await synthesizeSentence('Olipa kerran.')
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
