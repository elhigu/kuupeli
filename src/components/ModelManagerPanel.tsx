import { useEffect, useState } from 'react'
import { MODEL_CATALOG } from '../models/catalog'
import { getActiveModel, installModel, listModels, removeModel, setActiveModel } from '../models/modelManager'
import { logError, logEvent } from '../observability/devLogger'

export function ModelManagerPanel() {
  const [installed, setInstalled] = useState<string[]>([])
  const [activeModel, setActiveModelState] = useState<string>('')
  const [storageError, setStorageError] = useState<string | null>(null)

  async function refresh() {
    try {
      const models = await listModels()
      const active = await getActiveModel()

      setInstalled(models.map((model) => model.id))
      setActiveModelState(active)
      setStorageError(null)
      logEvent('models', 'panel_refreshed', {
        installedModelIds: models.map((model) => model.id),
        activeModelId: active
      })
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Model storage is unavailable.')
      logError('models', 'panel_refresh_failed', error)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <section>
      <h2>Model Manager</h2>
      <p>
        Models are local Kuupeli runtime profiles in this version. They do not download separate cloud or external
        AI model files yet.
      </p>
      {storageError && <p role="alert">{storageError}</p>}
      <ul>
        {MODEL_CATALOG.map((model) => {
          const isInstalled = installed.includes(model.id)
          const isActive = activeModel === model.id

          return (
            <li key={model.id}>
              <strong>{model.name}</strong> ({model.qualityTier})
              {!isInstalled ? (
                <button
                  type="button"
                  onClick={async () => {
                    logEvent('models', 'install_clicked', { modelId: model.id })
                    try {
                      await installModel(model.id)
                      await refresh()
                    } catch (error) {
                      setStorageError(error instanceof Error ? error.message : 'Model storage is unavailable.')
                      logError('models', 'install_failed', error, { modelId: model.id })
                    }
                  }}
                >
                  Install
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      logEvent('models', 'set_active_clicked', { modelId: model.id })
                      try {
                        await setActiveModel(model.id)
                        await refresh()
                      } catch (error) {
                        setStorageError(error instanceof Error ? error.message : 'Model storage is unavailable.')
                        logError('models', 'set_active_failed', error, { modelId: model.id })
                      }
                    }}
                    disabled={isActive}
                  >
                    {isActive ? 'Active' : 'Set Active'}
                  </button>
                  {model.id !== 'fi-starter-small' && (
                    <button
                      type="button"
                      onClick={async () => {
                        logEvent('models', 'remove_clicked', { modelId: model.id })
                        try {
                          await removeModel(model.id)
                          await refresh()
                        } catch (error) {
                          setStorageError(error instanceof Error ? error.message : 'Model storage is unavailable.')
                          logError('models', 'remove_failed', error, { modelId: model.id })
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
