import { useEffect, useState } from 'react'
import { MODEL_CATALOG } from '../models/catalog'
import { getActiveModel, installModel, listModels, removeModel, setActiveModel } from '../models/modelManager'

export function ModelManagerPanel() {
  const [installed, setInstalled] = useState<string[]>([])
  const [activeModel, setActiveModelState] = useState<string>('')

  async function refresh() {
    const models = await listModels()
    setInstalled(models.map((model) => model.id))
    setActiveModelState(await getActiveModel())
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <section>
      <h2>Model Manager</h2>
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
                    await installModel(model.id)
                    await refresh()
                  }}
                >
                  Install
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      await setActiveModel(model.id)
                      await refresh()
                    }}
                    disabled={isActive}
                  >
                    {isActive ? 'Active' : 'Set Active'}
                  </button>
                  {model.id !== 'fi-starter-small' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await removeModel(model.id)
                        await refresh()
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
