import { logEvent } from '../observability/devLogger'

function readAsTextWithFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      const bytes = reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0)
      resolve(new TextDecoder().decode(bytes))
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read text file'))
    }
    reader.readAsText(file)
  })
}

export async function parseTxtFile(file: File): Promise<string> {
  logEvent('ingestion_txt', 'parse_started', { fileName: file.name, fileSize: file.size })
  let text: string
  if (typeof file.text === 'function') {
    text = await file.text()
  } else if (typeof file.arrayBuffer === 'function') {
    const bytes = await file.arrayBuffer()
    text = new TextDecoder().decode(bytes)
  } else {
    text = await readAsTextWithFileReader(file)
  }
  logEvent('ingestion_txt', 'parse_completed', { characterCount: text.length })
  return text
}
