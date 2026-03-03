import { logError, logEvent } from '../observability/devLogger'

const GHP_PATH_QUERY_KEY = 'ghp_path'

function normalizeBase(baseUrl: string): string {
  if (!baseUrl || baseUrl === '/') {
    return '/'
  }

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function buildTargetUrl(baseUrl: string, relativePath: string): string {
  const normalizedBase = normalizeBase(baseUrl)
  const trimmedRelative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${normalizedBase}${trimmedRelative}`
}

export function restorePathFromGhPagesFallback(location: Location, history: History, baseUrl: string): void {
  const searchParams = new URLSearchParams(location.search)
  const encodedPath = searchParams.get(GHP_PATH_QUERY_KEY)

  if (!encodedPath) {
    return
  }

  try {
    const decodedPath = decodeURIComponent(encodedPath)
    const normalizedPath = decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`
    const targetUrl = buildTargetUrl(baseUrl, normalizedPath)

    history.replaceState(null, '', targetUrl)
    logEvent('routing', 'gh_pages_fallback_restored', { targetUrl })
  } catch (error) {
    logError('routing', 'gh_pages_fallback_restore_failed', error, { encodedPath })
  }
}
