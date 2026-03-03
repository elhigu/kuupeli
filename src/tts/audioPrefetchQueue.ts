import { logEvent } from '../observability/devLogger'
import { ClipCache } from './clipCache'
import { synthesizeSentence } from './ttsRuntime'

function cacheKey(sentence: string, voice: string): string {
  return `${voice}::${sentence}`
}

export class AudioPrefetchQueue {
  private readonly cache = new ClipCache()

  async prefetch(sentence: string, voice = 'fi'): Promise<ArrayBuffer> {
    const key = cacheKey(sentence, voice)
    const existing = this.cache.get(key)
    if (existing) {
      logEvent('audio_prefetch', 'cache_hit', { sentenceLength: sentence.length, voice })
      return existing
    }

    logEvent('audio_prefetch', 'cache_miss_generate', { sentenceLength: sentence.length, voice })
    const generated = await synthesizeSentence(sentence, { voice })
    this.cache.set(key, generated)
    logEvent('audio_prefetch', 'generated_and_cached', {
      sentenceLength: sentence.length,
      clipBytes: generated.byteLength,
      voice
    })
    return generated
  }

  has(sentence: string, voice = 'fi'): boolean {
    return this.cache.has(cacheKey(sentence, voice))
  }

  get(sentence: string, voice = 'fi'): ArrayBuffer | undefined {
    return this.cache.get(cacheKey(sentence, voice))
  }

  clear() {
    this.cache.clear()
  }
}

const sharedAudioPrefetchQueue = new AudioPrefetchQueue()

export async function prefetchSentenceClip(sentence: string, voice = 'fi'): Promise<ArrayBuffer> {
  return sharedAudioPrefetchQueue.prefetch(sentence, voice)
}

export function getPrefetchedSentenceClip(sentence: string, voice = 'fi'): ArrayBuffer | undefined {
  return sharedAudioPrefetchQueue.get(sentence, voice)
}

export function resetPrefetchQueueForTest() {
  sharedAudioPrefetchQueue.clear()
}
