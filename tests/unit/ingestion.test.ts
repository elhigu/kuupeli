import { describe, expect, it } from 'vitest'
import { splitSentences } from '../../src/ingestion/sentenceSplitter'

describe('Sentence splitter', () => {
  it('preserves story order when splitting text', () => {
    const result = splitSentences('Olipa kerran. Sitten tuli ilta.')
    expect(result).toEqual(['Olipa kerran.', 'Sitten tuli ilta.'])
  })
})
