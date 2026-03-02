export function shouldServeFromCache(path: string): boolean {
  if (path === '/' || path === '/index.html') {
    return true
  }

  return path.startsWith('/assets/') || path.startsWith('/icons/')
}
