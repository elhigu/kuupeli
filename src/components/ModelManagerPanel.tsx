import { useEffect, useMemo, useState } from 'react'
import { MODEL_CATALOG } from '../models/catalog'
import {
  getActiveModel,
  getModelVoiceType,
  installModel,
  listModels,
  removeModel,
  setActiveModel,
  setModelVoiceType
} from '../models/modelManager'
import { logError, logEvent } from '../observability/devLogger'
import { playSentenceAudioWithModel } from '../tts/playback'

const DEFAULT_TEST_PHRASE = 'Olipa kerran kauan kauan sitten.'

type InstallProgressState = Record<string, number>
type VoiceTypeState = Record<string, string>

export function ModelManagerPanel() {
  const [installed, setInstalled] = useState<string[]>([])
  const [activeModel, setActiveModelState] = useState<string>('')
  const [storageError, setStorageError] = useState<string | null>(null)
  const [voiceTypes, setVoiceTypes] = useState<VoiceTypeState>({})
  const [installProgress, setInstallProgress] = useState<InstallProgressState>({})
  const [testPhrase, setTestPhrase] = useState(DEFAULT_TEST_PHRASE)

  const installedSet = useMemo(() => new Set(installed), [installed])

  async function refresh() {
    try {
      const models = await listModels()
      const active = await getActiveModel()

      const nextVoiceTypes: VoiceTypeState = {}
      for (const model of models) {
        nextVoiceTypes[model.id] = await getModelVoiceType(model.id)
      }

      setInstalled(models.map((model) => model.id))
      setActiveModelState(active)
      setStorageError(null)
      setVoiceTypes(nextVoiceTypes)
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
        Manage local speech models used by Kuupeli. Downloadable Piper voices are stored on device and can be removed
        later.
      </p>
      {storageError && <p role="alert">{storageError}</p>}
      <label className="model-test-phrase">
        <span>Test phrase</span>
        <input
          aria-label="Model test phrase"
          type="text"
          value={testPhrase}
          onChange={(event) => setTestPhrase(event.target.value)}
        />
      </label>
      <ul className="model-list">
        {MODEL_CATALOG.map((model) => {
          const isInstalled = installedSet.has(model.id)
          const isActive = activeModel === model.id
          const progressPercent = installProgress[model.id] ?? 0
          const selectedVoiceType = voiceTypes[model.id] ?? model.voiceTypes[0]?.id ?? 'default'

          return (
            <li key={model.id} className="model-list-item">
              <div>
                <strong>{model.name}</strong> ({model.qualityTier}) - {model.engine}
              </div>
              <div>{model.description}</div>
              <div>Estimated size: {model.sizeMb.toFixed(1)} MB</div>

              {!isInstalled ? (
                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      logEvent('models', 'install_clicked', { modelId: model.id })
                      try {
                        setInstallProgress((current) => ({ ...current, [model.id]: 0 }))
                        await installModel(model.id, (progress) => {
                          setInstallProgress((current) => ({ ...current, [model.id]: progress.percent }))
                        })
                        setInstallProgress((current) => ({ ...current, [model.id]: 100 }))
                        await refresh()
                      } catch (error) {
                        setStorageError(error instanceof Error ? error.message : 'Model storage is unavailable.')
                        logError('models', 'install_failed', error, { modelId: model.id })
                      }
                    }}
                  >
                    Download model
                  </button>
                  {model.installMode === 'download' && progressPercent > 0 && progressPercent < 100 && (
                    <p aria-live="polite">Download progress: {progressPercent}%</p>
                  )}
                </div>
              ) : (
                <div className="model-installed-controls">
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
                    {isActive ? 'Active model' : 'Set active'}
                  </button>

                  {model.voiceTypes.length > 0 && (
                    <label>
                      <span>Voice type</span>
                      <select
                        aria-label={`${model.name} voice type`}
                        value={selectedVoiceType}
                        onChange={async (event) => {
                          const nextVoiceTypeId = event.target.value
                          setVoiceTypes((current) => ({ ...current, [model.id]: nextVoiceTypeId }))
                          try {
                            await setModelVoiceType(model.id, nextVoiceTypeId)
                          } catch (error) {
                            logError('models', 'voice_type_set_failed', error, {
                              modelId: model.id,
                              voiceTypeId: nextVoiceTypeId
                            })
                          }
                        }}
                      >
                        {model.voiceTypes.map((voiceType) => (
                          <option key={voiceType.id} value={voiceType.id}>
                            {voiceType.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      logEvent('models', 'test_phrase_clicked', {
                        modelId: model.id,
                        voiceTypeId: selectedVoiceType,
                        phraseLength: testPhrase.length
                      })
                      try {
                        await playSentenceAudioWithModel(testPhrase, {
                          modelId: model.id,
                          voiceTypeId: selectedVoiceType
                        })
                        logEvent('models', 'test_phrase_completed', { modelId: model.id })
                      } catch (error) {
                        logError('models', 'test_phrase_failed', error, { modelId: model.id })
                      }
                    }}
                  >
                    Play test phrase
                  </button>

                  {model.installMode === 'download' && (
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
                      Delete downloaded data
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
