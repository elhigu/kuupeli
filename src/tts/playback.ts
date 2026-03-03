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

type PlaybackOutcome = 'completed' | 'stopped'

interface ActivePlaybackSession {
  id: number
  stop: () => void
}

let latestPlaybackId = 0
let activePlaybackSession: ActivePlaybackSession | null = null

function startPlaybackSession(): number {
  if (activePlaybackSession) {
    activePlaybackSession.stop()
    activePlaybackSession = null
  }

  latestPlaybackId += 1
  return latestPlaybackId
}

function isPlaybackCurrent(playbackId: number): boolean {
  return playbackId === latestPlaybackId
}

function registerActivePlayback(playbackId: number, stop: () => void): void {
  activePlaybackSession = { id: playbackId, stop }
}

function clearActivePlayback(playbackId: number): void {
  if (activePlaybackSession?.id === playbackId) {
    activePlaybackSession = null
  }
}

export function stopActivePlayback(): boolean {
  if (!activePlaybackSession) {
    return false
  }

  activePlaybackSession.stop()
  activePlaybackSession = null
  return true
}

function playWavBuffer(buffer: ArrayBuffer, playbackId: number): Promise<PlaybackOutcome> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || typeof URL === 'undefined') {
    return Promise.reject(new Error('Audio element playback not available'))
  }

  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))

  return new Promise<PlaybackOutcome>((resolve, reject) => {
    const audio = new Audio(blobUrl)
    let settled = false

    const cleanup = () => {
      // Defer revoke to avoid transient blob fetch errors during rapid stop/replay churn.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
    }
    const complete = (outcome: PlaybackOutcome) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      clearActivePlayback(playbackId)
      resolve(outcome)
    }

    audio.onended = () => {
      complete('completed')
    }

    audio.onerror = () => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      clearActivePlayback(playbackId)
      reject(new Error('Audio element playback failed'))
    }

    registerActivePlayback(playbackId, () => {
      if (typeof audio.pause === 'function') {
        audio.pause()
      }
      complete('stopped')
    })

    const playPromise = audio.play()
    if (playPromise) {
      void playPromise.catch((error: unknown) => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        clearActivePlayback(playbackId)
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

function playSpeechSynthesisFallback(
  text: string,
  options: PlaybackOptions = {},
  playbackId: number
): Promise<PlaybackOutcome> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.reject(new Error('Speech synthesis API not available'))
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.lang ?? 'fi-FI'
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? 1
  utterance.volume = options.volume ?? 1

  return new Promise<PlaybackOutcome>((resolve, reject) => {
    let settled = false
    const complete = (outcome: PlaybackOutcome) => {
      if (settled) {
        return
      }

      settled = true
      clearActivePlayback(playbackId)
      resolve(outcome)
    }

    utterance.onend = () => complete('completed')
    utterance.onerror = () => {
      if (settled) {
        return
      }
      settled = true
      clearActivePlayback(playbackId)
      reject(new Error('Speech synthesis failed'))
    }

    registerActivePlayback(playbackId, () => {
      window.speechSynthesis.cancel()
      complete('stopped')
    })

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    // Some mocked/browser implementations may never dispatch onend.
    setTimeout(() => complete('completed'), 0)
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
  const playbackId = startPlaybackSession()
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
    playbackId,
    engine: model?.engine ?? 'unknown',
    voiceTypeId,
    voice: selectedVoice
  })

  try {
    const prefetched = selectedVoice ? getPrefetchedSentenceClip(text, selectedVoice) : undefined
    const wavBuffer = prefetched ?? (await synthesizeFromSelection(text, override.modelId, voiceTypeId))
    if (!isPlaybackCurrent(playbackId)) {
      logEvent('audio_playback', 'superseded_before_playback', {
        playbackId,
        activeModelId: override.modelId
      })
      return
    }

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

    const playbackOutcome = await playWavBuffer(wavBuffer, playbackId)
    if (playbackOutcome === 'stopped') {
      logEvent('audio_playback', 'superseded_during_playback', {
        playbackId,
        activeModelId: override.modelId
      })
      return
    }

    logEvent('audio_playback', 'playback_completed', {
      playbackId,
      activeModelId: override.modelId
    })
    logEvent('audio_playback', 'wasm_playback_completed', {
      playbackId,
      activeModelId: override.modelId
    })
    return
  } catch (error) {
    if (!isPlaybackCurrent(playbackId)) {
      logEvent('audio_playback', 'superseded_before_fallback', {
        playbackId,
        activeModelId: override.modelId
      })
      return
    }

    logEvent('audio_playback', 'model_playback_failed', {
      playbackId,
      activeModelId: override.modelId,
      reason: describeError(error)
    })
  }

  logEvent('audio_playback', 'fallback_speech_synthesis_start', {
    requestedLang: options.lang ?? 'fi-FI'
  })

  const fallbackOutcome = await playSpeechSynthesisFallback(text, options, playbackId)
  if (fallbackOutcome === 'stopped') {
    logEvent('audio_playback', 'fallback_superseded', {
      playbackId
    })
    return
  }

  logEvent('audio_playback', 'fallback_speech_synthesis_completed')
}

export async function playSentenceAudio(text: string, options: PlaybackOptions = {}): Promise<void> {
  const activeModelId = await getActiveModel()
  await playSentenceAudioWithModel(text, { modelId: activeModelId }, options)
}
