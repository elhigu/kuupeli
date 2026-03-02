import { logEvent } from '../observability/devLogger'
import ESpeakNg from 'espeak-ng'
import wasmUrl from 'espeak-ng/dist/espeak-ng.wasm?url'

const DEFAULT_VOICE = 'fi'
const OUTPUT_FILE = 'kuupeli.wav'
const SAMPLE_RATE = 22050

export interface SynthesisOptions {
  voice?: string
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copied = new Uint8Array(bytes)
  return copied.buffer
}

async function synthesizeFallbackBuffer(text: string): Promise<ArrayBuffer> {
  const durationSeconds = Math.max(0.2, Math.min(1.2, text.length / 25))
  const sampleCount = Math.max(1, Math.floor(SAMPLE_RATE * durationSeconds))
  const bytesPerSample = 2
  const dataByteLength = sampleCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataByteLength)
  const view = new DataView(buffer)
  let offset = 0

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset, value.charCodeAt(i))
      offset += 1
    }
  }

  writeString('RIFF')
  view.setUint32(offset, 36 + dataByteLength, true)
  offset += 4
  writeString('WAVE')
  writeString('fmt ')
  view.setUint32(offset, 16, true)
  offset += 4
  view.setUint16(offset, 1, true)
  offset += 2
  view.setUint16(offset, 1, true)
  offset += 2
  view.setUint32(offset, SAMPLE_RATE, true)
  offset += 4
  view.setUint32(offset, SAMPLE_RATE * bytesPerSample, true)
  offset += 4
  view.setUint16(offset, bytesPerSample, true)
  offset += 2
  view.setUint16(offset, 16, true)
  offset += 2
  writeString('data')
  view.setUint32(offset, dataByteLength, true)
  offset += 4

  const amplitude = 0.2 * 0x7fff
  const toneHz = 440

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const time = sample / SAMPLE_RATE
    const envelope = Math.min(1, sample / 200, (sampleCount - sample) / 200)
    const sineSample = Math.sin(2 * Math.PI * toneHz * time) * amplitude * Math.max(0.05, envelope)
    view.setInt16(offset, Math.round(sineSample), true)
    offset += 2
  }

  return buffer
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown error'
}

export async function synthesizeSentence(text: string, options: SynthesisOptions = {}): Promise<ArrayBuffer> {
  const voice = options.voice ?? DEFAULT_VOICE
  logEvent('tts_runtime', 'synthesize_started', { textLength: text.length, voice })

  try {
    const runtime = await ESpeakNg({
      arguments: ['-w', OUTPUT_FILE, '-v', voice, text],
      locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
      print: () => {},
      printErr: () => {}
    })

    const bytes = runtime.FS.readFile(OUTPUT_FILE) as Uint8Array
    const buffer = toArrayBuffer(bytes)
    logEvent('tts_runtime', 'synthesize_completed', { outputBytes: bytes.byteLength, voice })
    return buffer
  } catch (error) {
    logEvent('tts_runtime', 'synthesize_fallback_placeholder', {
      voice,
      reason: describeError(error)
    })
    const buffer = await synthesizeFallbackBuffer(text)
    logEvent('tts_runtime', 'synthesize_completed', { outputBytes: buffer.byteLength, voice, fallback: true })
    return buffer
  }
}
