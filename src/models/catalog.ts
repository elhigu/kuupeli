export type SpeechEngine = 'espeak-ng' | 'piper-web'
export type InstallMode = 'bundled' | 'download'

export interface VoiceTypeOption {
  id: string
  label: string
  runtimeVoice: string
}

export interface ModelCatalogEntry {
  id: string
  name: string
  description: string
  installMode: InstallMode
  engine: SpeechEngine
  qualityTier: 'starter' | 'standard' | 'high'
  estimatedCpuSpeed: string
  sizeMb: number
  piperVoiceId?: string
  voiceTypes: VoiceTypeOption[]
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    id: 'fi-starter-small',
    name: 'Finnish Starter Small',
    description: 'Bundled eSpeak NG Finnish voice. Fast startup and smallest footprint.',
    installMode: 'bundled',
    engine: 'espeak-ng',
    qualityTier: 'starter',
    estimatedCpuSpeed: 'fast',
    sizeMb: 6,
    voiceTypes: [
      {
        id: 'fi-default',
        label: 'Default',
        runtimeVoice: 'fi'
      },
      {
        id: 'fi-female-3',
        label: 'Female 3',
        runtimeVoice: 'fi+f3'
      },
      {
        id: 'fi-male-3',
        label: 'Male 3',
        runtimeVoice: 'fi+m3'
      }
    ]
  },
  {
    id: 'fi-balanced-medium',
    name: 'Finnish Balanced Medium (eSpeak)',
    description: 'Bundled eSpeak variant tuned for a slightly richer timbre.',
    installMode: 'bundled',
    engine: 'espeak-ng',
    qualityTier: 'standard',
    estimatedCpuSpeed: 'medium',
    sizeMb: 8,
    voiceTypes: [
      {
        id: 'fi-female-4',
        label: 'Female 4',
        runtimeVoice: 'fi+f4'
      },
      {
        id: 'fi-male-4',
        label: 'Male 4',
        runtimeVoice: 'fi+m4'
      }
    ]
  },
  {
    id: 'fi-piper-harri-low',
    name: 'Finnish Harri Low (Piper)',
    description: 'Downloadable Finnish Piper voice (low quality tier) stored locally in OPFS.',
    installMode: 'download',
    engine: 'piper-web',
    qualityTier: 'starter',
    estimatedCpuSpeed: 'fast',
    sizeMb: 66.4,
    piperVoiceId: 'fi_FI-harri-low',
    voiceTypes: [
      {
        id: 'default',
        label: 'Default',
        runtimeVoice: 'fi_FI-harri-low'
      }
    ]
  },
  {
    id: 'fi-piper-harri-medium',
    name: 'Finnish Harri Medium (Piper)',
    description: 'Downloadable Finnish Piper voice (medium quality tier) stored locally in OPFS.',
    installMode: 'download',
    engine: 'piper-web',
    qualityTier: 'standard',
    estimatedCpuSpeed: 'medium',
    sizeMb: 66.8,
    piperVoiceId: 'fi_FI-harri-medium',
    voiceTypes: [
      {
        id: 'default',
        label: 'Default',
        runtimeVoice: 'fi_FI-harri-medium'
      }
    ]
  }
]
