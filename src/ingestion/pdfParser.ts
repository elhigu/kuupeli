import { logEvent } from '../observability/devLogger'

export async function parsePdfFile(file: File): Promise<string> {
  // Placeholder implementation for v1 scaffolding; full PDF extraction lands in later task work.
  logEvent('ingestion_pdf', 'parse_started', { fileName: file.name, fileSize: file.size })
  const bytes = await file.arrayBuffer()
  const text = new TextDecoder().decode(bytes)
  logEvent('ingestion_pdf', 'parse_completed', { byteLength: bytes.byteLength, characterCount: text.length })
  return text
}
