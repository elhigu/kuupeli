import { MODEL_CATALOG, type ModelCatalogEntry } from './catalog'

const STORAGE_KEY = 'kuupeli-installed-models'
const ACTIVE_MODEL_KEY = 'kuupeli-active-model'
const DEFAULT_MODEL = 'fi-starter-small'

function readInstalledModelIds(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY)

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export async function listModels(): Promise<ModelCatalogEntry[]> {
  const installed = new Set(readInstalledModelIds())
  return MODEL_CATALOG.filter((model) => installed.has(model.id))
}

export async function installModel(modelId: string): Promise<void> {
  const installed = readInstalledModelIds()
  writeInstalledModelIds([...installed, modelId])

  if (!localStorage.getItem(ACTIVE_MODEL_KEY)) {
    localStorage.setItem(ACTIVE_MODEL_KEY, modelId)
  }
}

export async function removeModel(modelId: string): Promise<void> {
  const installed = readInstalledModelIds().filter((id) => id !== modelId)
  writeInstalledModelIds(installed.length > 0 ? installed : [DEFAULT_MODEL])

  if (localStorage.getItem(ACTIVE_MODEL_KEY) === modelId) {
    localStorage.setItem(ACTIVE_MODEL_KEY, DEFAULT_MODEL)
  }
}

export async function setActiveModel(modelId: string): Promise<void> {
  const installed = new Set(readInstalledModelIds())
  if (!installed.has(modelId)) {
    throw new Error(`Model not installed: ${modelId}`)
  }

  localStorage.setItem(ACTIVE_MODEL_KEY, modelId)
}

export async function getActiveModel(): Promise<string> {
  const active = localStorage.getItem(ACTIVE_MODEL_KEY)
  return active ?? DEFAULT_MODEL
}
