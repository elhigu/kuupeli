import { logError, logEvent } from '../observability/devLogger'
import { installModel, listModels } from './modelManager'

const PRELOAD_MODEL_ID = 'fi-piper-harri-low'

export type TestingModelPreloadResult =
  | 'installed'
  | 'already_installed'
  | 'skipped_environment'
  | 'skipped_automation'
  | 'skipped_disabled'
  | 'failed'

export interface TestingModelPreloadOptions {
  isDev?: boolean
  isAutomation?: boolean
  enabled?: boolean
  modelId?: string
}

export async function preloadTestingModelIfNeeded(
  options: TestingModelPreloadOptions = {}
): Promise<TestingModelPreloadResult> {
  const isDev = options.isDev ?? import.meta.env.DEV
  const isAutomation =
    options.isAutomation ??
    (typeof navigator !== 'undefined' && 'webdriver' in navigator ? Boolean(navigator.webdriver) : false)
  const enabled = options.enabled ?? import.meta.env.VITE_PRELOAD_TEST_MODEL !== '0'
  const modelId = options.modelId ?? PRELOAD_MODEL_ID

  if (!isDev) {
    return 'skipped_environment'
  }

  if (isAutomation) {
    logEvent('models_preload', 'skipped_automation', { modelId })
    return 'skipped_automation'
  }

  if (!enabled) {
    return 'skipped_disabled'
  }

  try {
    const installed = await listModels()
    if (installed.some((model) => model.id === modelId)) {
      logEvent('models_preload', 'skipped_already_installed', { modelId })
      return 'already_installed'
    }

    logEvent('models_preload', 'started', { modelId })
    await installModel(modelId)
    logEvent('models_preload', 'completed', { modelId })
    return 'installed'
  } catch (error) {
    logError('models_preload', 'failed', error, { modelId })
    return 'failed'
  }
}
