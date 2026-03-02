import { logEvent } from '../observability/devLogger'

export async function parseTxtFile(file: File): Promise<string> {
  logEvent('ingestion_txt', 'parse_started', { fileName: file.name, fileSize: file.size })
  const text = await file.text()
  logEvent('ingestion_txt', 'parse_completed', { characterCount: text.length })
  return text
}
