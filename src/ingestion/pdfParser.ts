import { logEvent } from '../observability/devLogger'

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

export async function parsePdfFile(file: File): Promise<string> {
  // Placeholder implementation for v1 scaffolding; full PDF extraction lands in later task work.
  logEvent('ingestion_pdf', 'parse_started', { fileName: file.name, fileSize: file.size })
  const bytes = typeof file.arrayBuffer === 'function' ? await file.arrayBuffer() : await readAsArrayBufferWithFileReader(file)
  const text = new TextDecoder().decode(bytes)
  logEvent('ingestion_pdf', 'parse_completed', { byteLength: bytes.byteLength, characterCount: text.length })
  return text
}
