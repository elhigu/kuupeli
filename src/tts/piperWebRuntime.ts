import { logEvent } from '../observability/devLogger'

type PiperModule = typeof import('@mintplex-labs/piper-tts-web')

export interface PiperProgress {
  url: string
  total: number
  loaded: number
}

let piperModulePromise: Promise<PiperModule> | null = null

const ONNX_WASM_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/'
const PIPER_PHONEMIZE_BASE = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize'

const PIPER_WASM_PATHS = {
  onnxWasm: ONNX_WASM_BASE,
  piperData: `${PIPER_PHONEMIZE_BASE}.data`,
  piperWasm: `${PIPER_PHONEMIZE_BASE}.wasm`
}

async function getPiperModule(): Promise<PiperModule> {
  if (typeof window === 'undefined') {
    throw new Error('Piper runtime requires browser environment')
  }

  if (!piperModulePromise) {
    piperModulePromise = import('@mintplex-labs/piper-tts-web')
  }

  return piperModulePromise
}

function preferWasmExecutionBackend() {
  if (typeof navigator === 'undefined') {
    return
  }

  try {
    Object.defineProperty(navigator, 'gpu', {
      value: undefined,
      configurable: true
    })
    logEvent('piper_runtime', 'webgpu_disabled_for_stability')
  } catch {
    // Ignore environments where navigator.gpu is not configurable.
  }
}

export async function downloadPiperVoice(
  voiceId: string,
  callback?: (progress: PiperProgress) => void
): Promise<void> {
  const runtime = await getPiperModule()
  logEvent('piper_runtime', 'download_started', { voiceId })
  await runtime.download(voiceId, (progress) => {
    callback?.({
      url: progress.url,
      total: progress.total,
      loaded: progress.loaded
    })
  })
  logEvent('piper_runtime', 'download_completed', { voiceId })
}

export async function removePiperVoice(voiceId: string): Promise<void> {
  const runtime = await getPiperModule()
  await runtime.remove(voiceId)
  logEvent('piper_runtime', 'removed', { voiceId })
}

export async function listPiperStoredVoices(): Promise<string[]> {
  const runtime = await getPiperModule()
  const stored = await runtime.stored()
  logEvent('piper_runtime', 'stored_listed', { count: stored.length })
  return stored
}

export async function predictPiperVoice(voiceId: string, text: string): Promise<ArrayBuffer> {
  const runtime = await getPiperModule()
  preferWasmExecutionBackend()
  const session = await runtime.TtsSession.create({
    voiceId,
    wasmPaths: PIPER_WASM_PATHS
  })
  logEvent('piper_runtime', 'session_created', {
    voiceId,
    onnxWasmBase: ONNX_WASM_BASE
  })
  const blob = await session.predict(text)
  const buffer = await blob.arrayBuffer()
  logEvent('piper_runtime', 'predicted', { voiceId, bytes: buffer.byteLength, textLength: text.length })
  return buffer
}
