import { logEvent } from '../observability/devLogger'

export class ClipCache {
  private readonly cache = new Map<string, ArrayBuffer>()

  set(sentence: string, clip: ArrayBuffer) {
    this.cache.set(sentence, clip)
    logEvent('clip_cache', 'set', {
      sentenceLength: sentence.length,
      clipBytes: clip.byteLength,
      entryCount: this.cache.size
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
}
