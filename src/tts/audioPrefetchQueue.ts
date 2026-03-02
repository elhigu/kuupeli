import { ClipCache } from './clipCache'
import { synthesizeSentence } from './ttsRuntime'
import { logEvent } from '../observability/devLogger'

export class AudioPrefetchQueue {
  private readonly cache = new ClipCache()

  async prefetch(sentence: string): Promise<ArrayBuffer> {
    const existing = this.cache.get(sentence)
    if (existing) {
      logEvent('audio_prefetch', 'cache_hit', { sentenceLength: sentence.length })
      return existing
    }

    logEvent('audio_prefetch', 'cache_miss_generate', { sentenceLength: sentence.length })
    const generated = await synthesizeSentence(sentence)
    this.cache.set(sentence, generated)
    logEvent('audio_prefetch', 'generated_and_cached', {
      sentenceLength: sentence.length,
      clipBytes: generated.byteLength
    })
    return generated
  }

  has(sentence: string): boolean {
    return this.cache.has(sentence)
  }

  get(sentence: string): ArrayBuffer | undefined {
    return this.cache.get(sentence)
  }
}
