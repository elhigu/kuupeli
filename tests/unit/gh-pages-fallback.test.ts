import { beforeEach, describe, expect, it, vi } from 'vitest'
import { restorePathFromGhPagesFallback } from '../../src/routing/ghPagesFallback'

describe('GitHub Pages fallback routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('restores deep route from ghp_path query for BrowserRouter basename', () => {
    const replaceState = vi.fn()
    const mockLocation = {
      search: '?ghp_path=%2Fplay%3Fstory%3Ddemo%23line2'
    } as Location

    restorePathFromGhPagesFallback(mockLocation, { replaceState } as unknown as History, '/kuupeli/')

    expect(replaceState).toHaveBeenCalledWith(null, '', '/kuupeli/play?story=demo#line2')
  })

  it('does nothing when fallback query is missing', () => {
    const replaceState = vi.fn()
    const mockLocation = { search: '' } as Location

    restorePathFromGhPagesFallback(mockLocation, { replaceState } as unknown as History, '/kuupeli/')

    expect(replaceState).not.toHaveBeenCalled()
  })
})
