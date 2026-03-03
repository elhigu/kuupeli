import { MODEL_CATALOG, type ModelCatalogEntry } from './catalog'
import { logError, logEvent } from '../observability/devLogger'
import { storageRecoveryGuidance } from '../storage/storageGuidance'

const STORAGE_KEY = 'kuupeli-installed-models'
const ACTIVE_MODEL_KEY = 'kuupeli-active-model'
const DEFAULT_MODEL = 'fi-starter-small'

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

function readInstalledModelIds(): string[] {
  const raw = readStorageItem(STORAGE_KEY)

  if (!raw) {
    return [DEFAULT_MODEL]
  }

  try {
    const parsed = JSON.parse(raw) as string[]
    return parsed.length > 0 ? parsed : [DEFAULT_MODEL]
  } catch {
    return [DEFAULT_MODEL]
  }
}

function writeInstalledModelIds(ids: string[]) {
  writeStorageItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export async function listModels(): Promise<ModelCatalogEntry[]> {
  const installed = new Set(readInstalledModelIds())
  const models = MODEL_CATALOG.filter((model) => installed.has(model.id))
  logEvent('models_store', 'listed', { installedModelIds: models.map((model) => model.id) })
  return models
}

export async function installModel(modelId: string): Promise<void> {
  const installed = readInstalledModelIds()
  writeInstalledModelIds([...installed, modelId])
  logEvent('models_store', 'installed', { modelId })

  if (!readStorageItem(ACTIVE_MODEL_KEY)) {
    writeStorageItem(ACTIVE_MODEL_KEY, modelId)
    logEvent('models_store', 'active_auto_set', { modelId })
  }
}

export async function removeModel(modelId: string): Promise<void> {
  const installed = readInstalledModelIds().filter((id) => id !== modelId)
  writeInstalledModelIds(installed.length > 0 ? installed : [DEFAULT_MODEL])
  logEvent('models_store', 'removed', { modelId })

  if (readStorageItem(ACTIVE_MODEL_KEY) === modelId) {
    writeStorageItem(ACTIVE_MODEL_KEY, DEFAULT_MODEL)
    logEvent('models_store', 'active_reset_to_default', { modelId: DEFAULT_MODEL })
  }
}

export async function setActiveModel(modelId: string): Promise<void> {
  const installed = new Set(readInstalledModelIds())
  if (!installed.has(modelId)) {
    logEvent('models_store', 'set_active_rejected_not_installed', { modelId })
    throw new Error(`Model not installed: ${modelId}`)
  }

  writeStorageItem(ACTIVE_MODEL_KEY, modelId)
  logEvent('models_store', 'active_set', { modelId })
}

export async function getActiveModel(): Promise<string> {
  const active = readStorageItem(ACTIVE_MODEL_KEY)
  const activeModel = active ?? DEFAULT_MODEL
  logEvent('models_store', 'active_read', { modelId: activeModel })
  return activeModel
}
