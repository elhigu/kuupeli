import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const PORT = Number.parseInt(process.argv[2] ?? '4173', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distRoot = path.resolve(__dirname, '../../dist')
const basePrefix = '/kuupeli'

const mimeByExt = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
  ['.webmanifest', 'application/manifest+json'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8']
])

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return mimeByExt.get(ext) ?? 'application/octet-stream'
}

function sanitizeRelativePath(inputPath) {
  const normalized = path.posix.normalize(inputPath).replace(/^\/+/, '')
  if (normalized.includes('..')) {
    return null
  }
  return normalized
}

async function respondFile(res, filePath, statusCode = 200) {
  const file = await readFile(filePath)
  res.statusCode = statusCode
  res.setHeader('Content-Type', contentTypeFor(filePath))
  res.end(file)
}

async function existsFile(filePath) {
  try {
    const details = await stat(filePath)
    return details.isFile()
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
  const pathname = requestUrl.pathname

  if (pathname === '/') {
    res.statusCode = 302
    res.setHeader('Location', `${basePrefix}/`)
    res.end()
    return
  }

  if (!pathname.startsWith(basePrefix)) {
    const rootRelativePath = sanitizeRelativePath(pathname)
    if (rootRelativePath !== null) {
      const rootFile = path.join(distRoot, rootRelativePath)
      if (await existsFile(rootFile)) {
        await respondFile(res, rootFile)
        return
      }
    }

    res.statusCode = 404
    res.end('Not Found')
    return
  }

  const relativePath = sanitizeRelativePath(pathname.slice(basePrefix.length))
  if (relativePath === null) {
    res.statusCode = 400
    res.end('Invalid path')
    return
  }

  const candidate =
    relativePath.length === 0 || relativePath === '/'
      ? path.join(distRoot, 'index.html')
      : path.join(distRoot, relativePath)

  if (await existsFile(candidate)) {
    await respondFile(res, candidate)
    return
  }

  const fallback404 = path.join(distRoot, '404.html')
  if (await existsFile(fallback404)) {
    await respondFile(res, fallback404, 200)
    return
  }

  res.statusCode = 404
  res.end('Not Found')
})

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[subpath-preview] serving dist at http://127.0.0.1:${PORT}${basePrefix}/`)
})
