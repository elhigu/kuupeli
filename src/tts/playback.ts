import { getActiveModel, getModelById, getModelVoiceType } from '../models/modelManager'
import { logEvent } from '../observability/devLogger'
import { getPrefetchedSentenceClip } from './audioPrefetchQueue'
import { predictPiperVoice } from './piperWebRuntime'
import { synthesizeSentence } from './ttsRuntime'

export interface PlaybackOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface PlaybackModelOverride {
  modelId: string
  voiceTypeId?: string
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

async function synthesizeFromSelection(text: string, modelId: string, voiceTypeId?: string): Promise<ArrayBuffer> {
  const model = getModelById(modelId)
  if (!model) {
    throw new Error(`Unknown model id: ${modelId}`)
  }

  if (model.engine === 'piper-web') {
    if (!model.piperVoiceId) {
      throw new Error(`Piper model missing voice id: ${modelId}`)
    }
    return predictPiperVoice(model.piperVoiceId, text)
  }

  const selected = model.voiceTypes.find((option) => option.id === voiceTypeId) ?? model.voiceTypes[0]
  return synthesizeSentence(text, { voice: selected?.runtimeVoice ?? 'fi' })
}

export async function playSentenceAudioWithModel(
  text: string,
  override: PlaybackModelOverride,
  options: PlaybackOptions = {}
): Promise<void> {
  const model = getModelById(override.modelId)
  const voiceTypeId = override.voiceTypeId ?? (await getModelVoiceType(override.modelId))
  const selectedVoice =
    model?.engine === 'espeak-ng'
      ? (model.voiceTypes.find((option) => option.id === voiceTypeId) ?? model.voiceTypes[0])?.runtimeVoice ?? 'fi'
      : undefined

  logEvent('audio_playback', 'start', {
    textLength: text.length,
    sentence: text,
    activeModelId: override.modelId,
    engine: model?.engine ?? 'unknown',
    voiceTypeId,
    voice: selectedVoice
  })

  try {
    const prefetched = selectedVoice ? getPrefetchedSentenceClip(text, selectedVoice) : undefined
    const wavBuffer = prefetched ?? (await synthesizeFromSelection(text, override.modelId, voiceTypeId))

    if (prefetched) {
      logEvent('audio_playback', 'prefetch_cache_hit', {
        textLength: text.length,
        bytes: prefetched.byteLength,
        activeModelId: override.modelId,
        voice: selectedVoice
      })
    } else {
      if (selectedVoice) {
        logEvent('audio_playback', 'prefetch_cache_miss', {
          textLength: text.length,
          activeModelId: override.modelId,
          voice: selectedVoice
        })
      }

      logEvent('audio_playback', 'synthesized', {
        bytes: wavBuffer.byteLength,
        activeModelId: override.modelId,
        engine: model?.engine ?? 'unknown'
      })
      logEvent('audio_playback', 'wasm_synthesized', {
        bytes: wavBuffer.byteLength,
        activeModelId: override.modelId,
        engine: model?.engine ?? 'unknown'
      })
    }

    await playWavBuffer(wavBuffer)
    logEvent('audio_playback', 'playback_completed', {
      activeModelId: override.modelId
    })
    logEvent('audio_playback', 'wasm_playback_completed', {
      activeModelId: override.modelId
    })
    return
  } catch (error) {
    logEvent('audio_playback', 'model_playback_failed', {
      activeModelId: override.modelId,
      reason: describeError(error)
    })
  }

  logEvent('audio_playback', 'fallback_speech_synthesis_start', {
    requestedLang: options.lang ?? 'fi-FI'
  })

  await playSpeechSynthesisFallback(text, options)
  logEvent('audio_playback', 'fallback_speech_synthesis_completed')
}

export async function playSentenceAudio(text: string, options: PlaybackOptions = {}): Promise<void> {
  const activeModelId = await getActiveModel()
  await playSentenceAudioWithModel(text, { modelId: activeModelId }, options)
}
