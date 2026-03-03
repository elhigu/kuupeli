import { MODEL_CATALOG, type ModelCatalogEntry } from './catalog'
import { logError, logEvent } from '../observability/devLogger'
import { storageRecoveryGuidance } from '../storage/storageGuidance'
import { downloadPiperVoice, removePiperVoice } from '../tts/piperWebRuntime'

const INSTALLED_STORAGE_KEY = 'kuupeli-installed-models'
const ACTIVE_MODEL_STORAGE_KEY = 'kuupeli-active-model'
const MODEL_VOICE_STORAGE_KEY = 'kuupeli-model-voice-types'
const DEFAULT_MODEL = 'fi-starter-small'

type VoiceTypeMap = Record<string, string>
export type InstallProgress = {
  loaded: number
  total: number
  percent: number
}

function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    logError('models_store', 'storage_read_failed', error, { key })
    throw new Error(storageRecoveryGuidance(error))
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    logError('models_store', 'storage_write_failed', error, { key })
    throw new Error(storageRecoveryGuidance(error))
  }
}

function bundledModelIds(): string[] {
  return MODEL_CATALOG.filter((model) => model.installMode === 'bundled').map((model) => model.id)
}

function getModelByIdUnsafe(modelId: string): ModelCatalogEntry {
  const model = MODEL_CATALOG.find((item) => item.id === modelId)
  if (!model) {
    throw new Error(`Unsupported model: ${modelId}`)
  }

  return model
}

function readInstalledModelIds(): string[] {
  const bundled = bundledModelIds()
  const raw = readStorageItem(INSTALLED_STORAGE_KEY)

  if (!raw) {
    return bundled
  }

  try {
    const parsed = JSON.parse(raw) as string[]
    const all = new Set([...bundled, ...parsed])
    return Array.from(all).filter((id) => MODEL_CATALOG.some((model) => model.id === id))
  } catch {
    return bundled
  }
}

function writeInstalledModelIds(ids: string[]) {
  writeStorageItem(INSTALLED_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
}

function readVoiceTypeMap(): VoiceTypeMap {
  const raw = readStorageItem(MODEL_VOICE_STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as VoiceTypeMap
  } catch {
    return {}
  }
}

function writeVoiceTypeMap(map: VoiceTypeMap) {
  writeStorageItem(MODEL_VOICE_STORAGE_KEY, JSON.stringify(map))
}

export function getModelById(modelId: string): ModelCatalogEntry | undefined {
  return MODEL_CATALOG.find((item) => item.id === modelId)
}

export async function listAvailableModels(): Promise<ModelCatalogEntry[]> {
  logEvent('models_store', 'available_listed', { count: MODEL_CATALOG.length })
  return MODEL_CATALOG
}

export async function listModels(): Promise<ModelCatalogEntry[]> {
  const installed = new Set(readInstalledModelIds())
  const models = MODEL_CATALOG.filter((model) => installed.has(model.id))
  logEvent('models_store', 'listed', { installedModelIds: models.map((model) => model.id) })
  return models
}

export async function installModel(modelId: string, onProgress?: (progress: InstallProgress) => void): Promise<void> {
  const model = getModelByIdUnsafe(modelId)

  if (model.installMode === 'download') {
    if (!model.piperVoiceId) {
      throw new Error(`Download model missing piper voice id: ${modelId}`)
    }

    await downloadPiperVoice(model.piperVoiceId, (progress) => {
      const percent = progress.total > 0 ? Math.round((progress.loaded * 100) / progress.total) : 0
      onProgress?.({ ...progress, percent })
    })
  }

  const installed = readInstalledModelIds()
  writeInstalledModelIds([...installed, modelId])
  logEvent('models_store', 'installed', { modelId, engine: model.engine })

  if (!readStorageItem(ACTIVE_MODEL_STORAGE_KEY)) {
    writeStorageItem(ACTIVE_MODEL_STORAGE_KEY, modelId)
    logEvent('models_store', 'active_auto_set', { modelId })
  }
}

export async function removeModel(modelId: string): Promise<void> {
  const model = getModelByIdUnsafe(modelId)

  if (model.installMode === 'bundled') {
    throw new Error('Bundled model cannot be removed')
  }

  if (model.piperVoiceId) {
    await removePiperVoice(model.piperVoiceId)
  }

  const installed = readInstalledModelIds().filter((id) => id !== modelId)
  writeInstalledModelIds(installed)
  logEvent('models_store', 'removed', { modelId, engine: model.engine })

  if (readStorageItem(ACTIVE_MODEL_STORAGE_KEY) === modelId) {
    writeStorageItem(ACTIVE_MODEL_STORAGE_KEY, DEFAULT_MODEL)
    logEvent('models_store', 'active_reset_to_default', { modelId: DEFAULT_MODEL })
  }
}

export async function setActiveModel(modelId: string): Promise<void> {
  const installed = new Set(readInstalledModelIds())
  if (!installed.has(modelId)) {
    logEvent('models_store', 'set_active_rejected_not_installed', { modelId })
    throw new Error(`Model not installed: ${modelId}`)
  }

  writeStorageItem(ACTIVE_MODEL_STORAGE_KEY, modelId)
  logEvent('models_store', 'active_set', { modelId })
}

export async function getActiveModel(): Promise<string> {
  const active = readStorageItem(ACTIVE_MODEL_STORAGE_KEY)
  const activeModel = active ?? DEFAULT_MODEL
  logEvent('models_store', 'active_read', { modelId: activeModel })
  return activeModel
}

export async function setModelVoiceType(modelId: string, voiceTypeId: string): Promise<void> {
  const model = getModelByIdUnsafe(modelId)
  const isValid = model.voiceTypes.some((option) => option.id === voiceTypeId)
  if (!isValid) {
    throw new Error(`Unsupported voice type ${voiceTypeId} for model ${modelId}`)
  }

  const current = readVoiceTypeMap()
  current[modelId] = voiceTypeId
  writeVoiceTypeMap(current)
  logEvent('models_store', 'voice_type_set', { modelId, voiceTypeId })
}

export async function getModelVoiceType(modelId: string): Promise<string> {
  const model = getModelByIdUnsafe(modelId)
  const current = readVoiceTypeMap()
  const configured = current[modelId]
  if (configured && model.voiceTypes.some((option) => option.id === configured)) {
    return configured
  }

  const defaultVoiceTypeId = model.voiceTypes[0]?.id ?? 'default'
  if (configured && configured !== defaultVoiceTypeId) {
    logError('models_store', 'voice_type_invalid_fallback', new Error('Invalid voice type'), {
      modelId,
      configured,
      defaultVoiceTypeId
    })
  }
  return defaultVoiceTypeId
}
