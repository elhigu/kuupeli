import { describe, expect, it } from 'vitest'
import { STARTER_SENTENCES } from '../../src/data/starterSentences'

describe('Starter sentence pack', () => {
  it('contains 50 built-in Finnish practice sentences', () => {
    expect(STARTER_SENTENCES).toHaveLength(50)
    expect(STARTER_SENTENCES.every((sentence) => sentence.trim().length > 0)).toBe(true)
  })

  it('uses Finnish diacritics in starter content where required', () => {
    expect(STARTER_SENTENCES).toContain('Tänään aurinko paistaa kirkkaasti.')
    expect(STARTER_SENTENCES).toContain('Kirja odotti pöydällä koko päivän.')
    expect(STARTER_SENTENCES).toContain('Lapsi piirsi talon sinisellä kynällä.')
    expect(STARTER_SENTENCES).toContain('Satoi vettä koko yön ajan.')
    expect(STARTER_SENTENCES).toContain('Metsässä kuului pehmeä humina.')
    expect(STARTER_SENTENCES).toContain('Valo sammui hetkeksi myrskyssä.')
    expect(STARTER_SENTENCES).toContain('Hissi pysähtyi kolmanteen kerrokseen.')
    expect(STARTER_SENTENCES).toContain('Avaimet löytyivät takin taskusta.')
    expect(STARTER_SENTENCES).toContain('Yöllä taivas oli kirkas.')
    expect(STARTER_SENTENCES).toContain('Päivä päättyi rauhalliseen iltaan.')
  })
})
