import { logEvent } from '../observability/devLogger'

type PiperModule = typeof import('@mintplex-labs/piper-tts-web')

export interface PiperProgress {
  url: string
  total: number
  loaded: number
}

let piperModulePromise: Promise<PiperModule> | null = null

async function getPiperModule(): Promise<PiperModule> {
  if (typeof window === 'undefined') {
    throw new Error('Piper runtime requires browser environment')
  }

  if (!piperModulePromise) {
    piperModulePromise = import('@mintplex-labs/piper-tts-web')
  }

  return piperModulePromise
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
  const blob = await runtime.predict({ text, voiceId })
  const buffer = await blob.arrayBuffer()
  logEvent('piper_runtime', 'predicted', { voiceId, bytes: buffer.byteLength, textLength: text.length })
  return buffer
}
