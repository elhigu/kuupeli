import { ClipCache } from './clipCache'
import { synthesizeSentence } from './ttsRuntime'

export class AudioPrefetchQueue {
  private readonly cache = new ClipCache()

  async prefetch(sentence: string): Promise<ArrayBuffer> {
    const existing = this.cache.get(sentence)
    if (existing) {
      return existing
    }

    const generated = await synthesizeSentence(sentence)
    this.cache.set(sentence, generated)
    return generated
  }

  has(sentence: string): boolean {
    return this.cache.has(sentence)
  }

  get(sentence: string): ArrayBuffer | undefined {
    return this.cache.get(sentence)
  }
}
