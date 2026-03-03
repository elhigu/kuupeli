import { logEvent } from '../observability/devLogger'

export class ClipCache {
  private readonly cache = new Map<string, ArrayBuffer>()
  private readonly maxEntries: number

  constructor(maxEntries = 8) {
    this.maxEntries = maxEntries
  }

  set(sentence: string, clip: ArrayBuffer) {
    if (this.cache.has(sentence)) {
      this.cache.delete(sentence)
    }

    this.cache.set(sentence, clip)

    if (this.cache.size > this.maxEntries) {
      const oldestSentence = this.cache.keys().next().value as string | undefined
      if (oldestSentence) {
        this.cache.delete(oldestSentence)
        logEvent('clip_cache', 'evicted_oldest', {
          sentenceLength: oldestSentence.length,
          entryCount: this.cache.size,
          maxEntries: this.maxEntries
        })
      }
    }

    logEvent('clip_cache', 'set', {
      sentenceLength: sentence.length,
      clipBytes: clip.byteLength,
      entryCount: this.cache.size,
      maxEntries: this.maxEntries
    })
  }

  get(sentence: string): ArrayBuffer | undefined {
    const clip = this.cache.get(sentence)
    logEvent('clip_cache', 'get', {
      sentenceLength: sentence.length,
      hit: Boolean(clip)
    })
    return clip
  }

  has(sentence: string): boolean {
    const hit = this.cache.has(sentence)
    logEvent('clip_cache', 'has', {
      sentenceLength: sentence.length,
      hit
    })
    return hit
  }

  clear() {
    this.cache.clear()
    logEvent('clip_cache', 'cleared')
  }
}
