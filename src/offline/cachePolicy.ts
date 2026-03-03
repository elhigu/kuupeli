function normalizePath(path: string): string {
  const noFragment = path.split('#', 1)[0] ?? ''
  const noQuery = noFragment.split('?', 1)[0] ?? ''
  return noQuery || '/'
}

export function shouldServeFromCache(path: string): boolean {
  const normalizedPath = normalizePath(path)

  if (normalizedPath === '/' || normalizedPath.endsWith('/index.html')) {
    return true
  }

  if (/(^|\/)(play|stories|models)$/.test(normalizedPath)) {
    return true
  }

  return normalizedPath.includes('/assets/') || normalizedPath.includes('/icons/') || normalizedPath.endsWith('/manifest.webmanifest')
}
