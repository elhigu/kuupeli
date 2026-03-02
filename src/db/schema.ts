import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export const DB_NAME = 'kuupeli-db'
const DB_VERSION = 1

export interface TrainingPack {
  id: string
  title: string
  sentences: string[]
}

export interface SessionProgress {
  packId: string
  sentenceIndex: number
  updatedAt: string
}

interface KuupeliSchema extends DBSchema {
  trainingPacks: {
    key: string
    value: TrainingPack
  }
  progress: {
    key: string
    value: SessionProgress
  }
}

let dbPromise: Promise<IDBPDatabase<KuupeliSchema>> | undefined

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<KuupeliSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('trainingPacks')) {
          db.createObjectStore('trainingPacks', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'packId' })
        }
      }
    })
  }

  return dbPromise
}
