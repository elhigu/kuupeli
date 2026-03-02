import { logEvent } from '../observability/devLogger'
import ESpeakNg from 'espeak-ng'

const encoder = new TextEncoder()
const DEFAULT_VOICE = 'fi'
const OUTPUT_FILE = 'kuupeli.wav'

export interface SynthesisOptions {
  voice?: string
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copied = new Uint8Array(bytes)
  return copied.buffer
}

async function synthesizeFallbackBuffer(text: string): Promise<ArrayBuffer> {
  const encoded = encoder.encode(text)
  const wavHeader = new Uint8Array([82, 73, 70, 70]) // RIFF marker bytes
  const merged = new Uint8Array(wavHeader.length + encoded.length)
  merged.set(wavHeader, 0)
  merged.set(encoded, wavHeader.length)
  return merged.buffer
}

export async function synthesizeSentence(text: string, options: SynthesisOptions = {}): Promise<ArrayBuffer> {
  const voice = options.voice ?? DEFAULT_VOICE
  logEvent('tts_runtime', 'synthesize_started', { textLength: text.length, voice })

  try {
    const runtime = await ESpeakNg({
      arguments: ['-w', OUTPUT_FILE, '-v', voice, text]
    })

    const bytes = runtime.FS.readFile(OUTPUT_FILE) as Uint8Array
    const buffer = toArrayBuffer(bytes)
    logEvent('tts_runtime', 'synthesize_completed', { outputBytes: bytes.byteLength, voice })
    return buffer
  } catch {
    logEvent('tts_runtime', 'synthesize_fallback_placeholder', { voice })
    const buffer = await synthesizeFallbackBuffer(text)
    logEvent('tts_runtime', 'synthesize_completed', { outputBytes: buffer.byteLength, voice, fallback: true })
    return buffer
  }
}
