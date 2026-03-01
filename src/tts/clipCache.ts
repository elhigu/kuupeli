export class ClipCache {
  private readonly cache = new Map<string, ArrayBuffer>()

  set(sentence: string, clip: ArrayBuffer) {
    this.cache.set(sentence, clip)
  }

  get(sentence: string): ArrayBuffer | undefined {
    return this.cache.get(sentence)
  }

  has(sentence: string): boolean {
    return this.cache.has(sentence)
  }
}
