import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parsePdfFile } from '../../src/ingestion/pdfParser'

const mocks = vi.hoisted(() => ({
  getDocument: vi.fn()
}))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: mocks.getDocument
}))

describe('PDF parser', () => {
  beforeEach(() => {
    mocks.getDocument.mockReset()
  })

  it('extracts page text in original order', async () => {
    const getPage = vi
      .fn()
      .mockResolvedValueOnce({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Olipa' }, { str: 'kerran.' }]
        })
      })
      .mockResolvedValueOnce({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Sitten' }, { str: 'tuli' }, { str: 'ilta.' }]
        })
      })

    const destroy = vi.fn().mockResolvedValue(undefined)
    mocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage,
        destroy
      })
    })

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'story.pdf', { type: 'application/pdf' })
    const text = await parsePdfFile(file)

    expect(text).toBe('Olipa kerran.\nSitten tuli ilta.')
    expect(mocks.getDocument).toHaveBeenCalledTimes(1)
    expect(getPage).toHaveBeenCalledWith(1)
    expect(getPage).toHaveBeenCalledWith(2)
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
