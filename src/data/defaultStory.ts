import type { TrainingPack } from '../db/schema'
import { STARTER_SENTENCES } from './starterSentences'

export const DEFAULT_STORY_ID = 'starter-pack'

export const DEFAULT_STORY: TrainingPack = {
  id: DEFAULT_STORY_ID,
  title: 'Starter Pack',
  sentences: STARTER_SENTENCES
}
