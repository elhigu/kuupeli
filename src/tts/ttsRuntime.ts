import { logEvent } from '../observability/devLogger'

const encoder = new TextEncoder()

export async function synthesizeSentence(text: string): Promise<ArrayBuffer> {
  logEvent('tts_runtime', 'synthesize_started', { textLength: text.length })
  const encoded = encoder.encode(text)
  const wavHeader = new Uint8Array([82, 73, 70, 70]) // RIFF marker bytes
  const merged = new Uint8Array(wavHeader.length + encoded.length)

  merged.set(wavHeader, 0)
  merged.set(encoded, wavHeader.length)
  logEvent('tts_runtime', 'synthesize_completed', { outputBytes: merged.byteLength })

  return merged.buffer
}
