export interface ModelCatalogEntry {
  id: string
  name: string
  qualityTier: 'starter' | 'standard' | 'high'
  estimatedCpuSpeed: string
  sizeMb: number
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    id: 'fi-starter-small',
    name: 'Finnish Starter Small',
    qualityTier: 'starter',
    estimatedCpuSpeed: 'fast',
    sizeMb: 6
  },
  {
    id: 'fi-balanced-medium',
    name: 'Finnish Balanced Medium',
    qualityTier: 'standard',
    estimatedCpuSpeed: 'medium',
    sizeMb: 42
  }
]
