import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
