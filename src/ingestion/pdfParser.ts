import { logEvent } from '../observability/devLogger'

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs')
type PdfTextItem = { str?: string }

let pdfJsModulePromise: Promise<PdfJsModule> | null = null

function readAsArrayBufferWithFileReader(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0))
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read PDF file'))
    }
    reader.readAsArrayBuffer(file)
  })
}

async function getPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  }

  return pdfJsModulePromise
}

export async function parsePdfFile(file: File): Promise<string> {
  logEvent('ingestion_pdf', 'parse_started', { fileName: file.name, fileSize: file.size })
  const bytes = typeof file.arrayBuffer === 'function' ? await file.arrayBuffer() : await readAsArrayBufferWithFileReader(file)
  const pdfjs = await getPdfJsModule()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes)
  })
  const documentProxy = await loadingTask.promise
  const pages: string[] = []

  for (let pageIndex = 1; pageIndex <= documentProxy.numPages; pageIndex += 1) {
    const page = await documentProxy.getPage(pageIndex)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => {
        const maybeText = item as PdfTextItem
        return typeof maybeText.str === 'string' ? maybeText.str : ''
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (line.length > 0) {
      pages.push(line)
    }
  }

  const text = pages.join('\n')
  logEvent('ingestion_pdf', 'parse_completed', {
    byteLength: bytes.byteLength,
    pageCount: documentProxy.numPages,
    characterCount: text.length
  })
  await documentProxy.destroy()
  return text
}
