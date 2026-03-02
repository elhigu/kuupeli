import { getActiveModel } from '../models/modelManager'
import { logEvent } from '../observability/devLogger'
import { synthesizeSentence } from './ttsRuntime'

export interface PlaybackOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

const MODEL_TO_VOICE: Record<string, string> = {
  'fi-starter-small': 'fi',
  'fi-balanced-medium': 'fi'
}

function getVoiceForModel(modelId: string): string {
  return MODEL_TO_VOICE[modelId] ?? 'fi'
}

function playWavBuffer(buffer: ArrayBuffer): Promise<void> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || typeof URL === 'undefined') {
    return Promise.reject(new Error('Audio element playback not available'))
  }

  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(blobUrl)
    const cleanup = () => URL.revokeObjectURL(blobUrl)

    audio.onended = () => {
      cleanup()
      resolve()
    }

    audio.onerror = () => {
      cleanup()
      reject(new Error('Audio element playback failed'))
    }

    const playPromise = audio.play()
    if (playPromise) {
      void playPromise.catch((error: unknown) => {
        cleanup()
        reject(error instanceof Error ? error : new Error('Audio play was rejected'))
      })
    }
  })
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

function playSpeechSynthesisFallback(text: string, options: PlaybackOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.reject(new Error('Speech synthesis API not available'))
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.lang ?? 'fi-FI'
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? 1
  utterance.volume = options.volume ?? 1

  return new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Speech synthesis failed'))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    // Some mocked/browser implementations may never fire onend.
    setTimeout(() => resolve(), 0)
  })
}

export async function playSentenceAudio(text: string, options: PlaybackOptions = {}): Promise<void> {
  const activeModelId = await getActiveModel()
  const voice = getVoiceForModel(activeModelId)

  logEvent('audio_playback', 'start', {
    textLength: text.length,
    sentence: text,
    activeModelId,
    voice
  })

  try {
    const wavBuffer = await synthesizeSentence(text, { voice })
    logEvent('audio_playback', 'wasm_synthesized', { bytes: wavBuffer.byteLength, voice })
    await playWavBuffer(wavBuffer)
    logEvent('audio_playback', 'wasm_playback_completed', { voice })
    return
  } catch (error) {
    logEvent('audio_playback', 'wasm_playback_failed', {
      voice,
      reason: describeError(error)
    })
  }

  logEvent('audio_playback', 'fallback_speech_synthesis_start', {
    requestedLang: options.lang ?? 'fi-FI'
  })

  await playSpeechSynthesisFallback(text, options)
  logEvent('audio_playback', 'fallback_speech_synthesis_completed')
}
