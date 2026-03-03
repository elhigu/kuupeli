# Kuupeli v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build v1 of Kuupeli as a standalone offline-first PWA for Finnish dictation practice with local TXT/PDF ingestion, local TTS, masked-input gameplay, retries, and star scoring.

**Architecture:** A client-only React + TypeScript + Vite PWA with IndexedDB for persistent local state and a local TTS runtime for offline audio generation. Story-mode sessions progress sentence-by-sentence in source order with retry correction and attempt-based scoring. Service worker and local caches provide offline operation after first install.

**Tech Stack:** React, TypeScript, Vite, vite-plugin-pwa, idb, Vitest, React Testing Library, Playwright, pdfjs-dist, local TTS runtime wrapper (WASM/ONNX compatible)

---

Implementation standards:
- Use @superpowers:test-driven-development for all feature work.
- Use @superpowers:systematic-debugging for any failure.
- Use @superpowers:verification-before-completion before done claims.

### Task 1: Project Bootstrap and Test Harness

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `tests/unit/app-shell.test.tsx`
- Create: `playwright.config.ts`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import App from '../../src/App'

it('renders Kuupeli app shell heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /kuupeli/i })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/app-shell.test.tsx`
Expected: FAIL due to missing app scaffold/dependencies.

**Step 3: Write minimal implementation**

```tsx
export default function App() {
  return <h1>Kuupeli</h1>
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/app-shell.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json vite.config.ts tsconfig.json src/main.tsx src/App.tsx src/styles.css tests/unit/app-shell.test.tsx playwright.config.ts
git commit -m "chore: bootstrap kuupeli pwa project with test harness"
```

### Task 2: PWA Manifest and Service Worker Shell

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `vite.config.ts`
- Create: `tests/unit/pwa-manifest.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs'

it('includes app manifest with standalone display mode', () => {
  const raw = fs.readFileSync('public/manifest.webmanifest', 'utf8')
  const manifest = JSON.parse(raw)
  expect(manifest.display).toBe('standalone')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/pwa-manifest.test.ts`
Expected: FAIL because manifest file does not yet exist.

**Step 3: Write minimal implementation**

```json
{
  "name": "Kuupeli",
  "short_name": "Kuupeli",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#0b2e4f",
  "background_color": "#f8f6f1"
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/pwa-manifest.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add public/manifest.webmanifest public/icons/icon-192.png public/icons/icon-512.png vite.config.ts tests/unit/pwa-manifest.test.ts
git commit -m "feat: add pwa manifest and offline shell configuration"
```

### Task 3: IndexedDB Schema and Repository Layer

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/repositories/trainingPackRepo.ts`
- Create: `src/db/repositories/progressRepo.ts`
- Create: `tests/unit/db-repositories.test.ts`

**Step 1: Write the failing test**

```ts
import { saveTrainingPack, getTrainingPack } from '../../src/db/repositories/trainingPackRepo'

it('stores and retrieves a training pack', async () => {
  await saveTrainingPack({ id: 'pack-1', title: 'Book', sentences: ['Hei maailma.'] })
  const pack = await getTrainingPack('pack-1')
  expect(pack?.title).toBe('Book')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/db-repositories.test.ts`
Expected: FAIL due to missing repository implementations.

**Step 3: Write minimal implementation**

```ts
export async function saveTrainingPack(pack: TrainingPack) { /* idb put */ }
export async function getTrainingPack(id: string) { /* idb get */ }
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/db-repositories.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/db/schema.ts src/db/repositories/trainingPackRepo.ts src/db/repositories/progressRepo.ts tests/unit/db-repositories.test.ts
git commit -m "feat: add indexeddb schema and core repositories"
```

### Task 4: TXT and PDF Ingestion Pipeline

**Files:**
- Create: `src/ingestion/txtParser.ts`
- Create: `src/ingestion/pdfParser.ts`
- Create: `src/ingestion/sentenceSplitter.ts`
- Create: `tests/unit/ingestion.test.ts`

**Step 1: Write the failing test**

```ts
import { splitSentences } from '../../src/ingestion/sentenceSplitter'

it('preserves story order when splitting text', () => {
  const result = splitSentences('Olipa kerran. Sitten tuli ilta.')
  expect(result).toEqual(['Olipa kerran.', 'Sitten tuli ilta.'])
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ingestion.test.ts`
Expected: FAIL due to missing split function.

**Step 3: Write minimal implementation**

```ts
export function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]/g)?.map((s) => s.trim()) ?? []
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ingestion.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ingestion/txtParser.ts src/ingestion/pdfParser.ts src/ingestion/sentenceSplitter.ts tests/unit/ingestion.test.ts
git commit -m "feat: add local txt/pdf ingestion and sentence extraction"
```

### Task 5: Story-Mode Session Engine and Resume

**Files:**
- Create: `src/session/sessionEngine.ts`
- Create: `src/session/types.ts`
- Create: `tests/unit/session-engine.test.ts`

**Step 1: Write the failing test**

```ts
import { createSessionEngine } from '../../src/session/sessionEngine'

it('resumes from persisted sentence index', () => {
  const engine = createSessionEngine(['A.', 'B.', 'C.'], 1)
  expect(engine.currentSentence()).toBe('B.')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/session-engine.test.ts`
Expected: FAIL due to missing engine implementation.

**Step 3: Write minimal implementation**

```ts
export function createSessionEngine(sentences: string[], startIndex = 0) {
  let index = startIndex
  return {
    currentSentence: () => sentences[index],
    next: () => { index += 1 }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/session-engine.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/session/sessionEngine.ts src/session/types.ts tests/unit/session-engine.test.ts
git commit -m "feat: add story-mode session engine with resume index"
```

### Task 6: Masked Input Widget with Fixed Punctuation

**Files:**
- Create: `src/components/MaskedSentenceInput.tsx`
- Create: `tests/unit/masked-input.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { MaskedSentenceInput } from '../../src/components/MaskedSentenceInput'

it('renders punctuation as fixed characters', () => {
  render(<MaskedSentenceInput sentence="Olipa kerran." />)
  expect(screen.getByText('.')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/masked-input.test.tsx`
Expected: FAIL due to missing component.

**Step 3: Write minimal implementation**

```tsx
export function MaskedSentenceInput({ sentence }: { sentence: string }) {
  return <div>{sentence.replace(/[A-Za-zÅÄÖåäö]/g, '_')}</div>
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/masked-input.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/MaskedSentenceInput.tsx tests/unit/masked-input.test.tsx
git commit -m "feat: add masked input widget with fixed punctuation rendering"
```

### Task 7: Retry Flow and Invalid-Word Highlighting

**Files:**
- Create: `src/scoring/retryEvaluator.ts`
- Create: `src/components/RetryFeedback.tsx`
- Create: `tests/unit/retry-flow.test.ts`

**Step 1: Write the failing test**

```ts
import { findInvalidWords } from '../../src/scoring/retryEvaluator'

it('returns invalid word indexes', () => {
  const invalid = findInvalidWords('Olipa kerran kauan sitten', 'Olipa kerran kauna sitten')
  expect(invalid).toEqual([2])
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/retry-flow.test.ts`
Expected: FAIL due to missing evaluator.

**Step 3: Write minimal implementation**

```ts
export function findInvalidWords(target: string, input: string): number[] { /* token compare */ }
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/retry-flow.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scoring/retryEvaluator.ts src/components/RetryFeedback.tsx tests/unit/retry-flow.test.ts
git commit -m "feat: implement retry feedback with invalid-word detection"
```

### Task 8: Star Scoring Rules

**Files:**
- Create: `src/scoring/starScorer.ts`
- Create: `tests/unit/star-scorer.test.ts`

**Step 1: Write the failing test**

```ts
import { scoreStars } from '../../src/scoring/starScorer'

it('awards stars based on successful attempt number', () => {
  expect(scoreStars(1)).toBe(3)
  expect(scoreStars(2)).toBe(2)
  expect(scoreStars(4)).toBe(1)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/star-scorer.test.ts`
Expected: FAIL due to missing scorer.

**Step 3: Write minimal implementation**

```ts
export function scoreStars(successAttempt: number) {
  if (successAttempt === 1) return 3
  if (successAttempt === 2) return 2
  return 1
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/star-scorer.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scoring/starScorer.ts tests/unit/star-scorer.test.ts
git commit -m "feat: add attempt-based star scoring rules"
```

### Task 9: Local Finnish TTS Runtime and Replay Control

**Files:**
- Create: `src/tts/ttsRuntime.ts`
- Create: `src/components/ReplayButton.tsx`
- Create: `tests/unit/tts-runtime.test.ts`

**Step 1: Write the failing test**

```ts
import { synthesizeSentence } from '../../src/tts/ttsRuntime'

it('returns playable audio buffer from local runtime', async () => {
  const buffer = await synthesizeSentence('Olipa kerran.')
  expect(buffer.byteLength).toBeGreaterThan(0)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/tts-runtime.test.ts`
Expected: FAIL due to missing runtime wrapper.

**Step 3: Write minimal implementation**

```ts
export async function synthesizeSentence(text: string): Promise<ArrayBuffer> { /* runtime call */ }
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/tts-runtime.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/tts/ttsRuntime.ts src/components/ReplayButton.tsx tests/unit/tts-runtime.test.ts
git commit -m "feat: integrate local finnish tts playback and replay control"
```

### Task 10: Next-Sentence Audio Pre-generation and Clip Cache

**Files:**
- Create: `src/tts/audioPrefetchQueue.ts`
- Create: `src/tts/clipCache.ts`
- Create: `tests/unit/audio-prefetch.test.ts`

**Step 1: Write the failing test**

```ts
import { AudioPrefetchQueue } from '../../src/tts/audioPrefetchQueue'

it('prefetches next sentence clip', async () => {
  const queue = new AudioPrefetchQueue()
  await queue.prefetch('Sitten tuli ilta.')
  expect(queue.has('Sitten tuli ilta.')).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/audio-prefetch.test.ts`
Expected: FAIL due to missing queue implementation.

**Step 3: Write minimal implementation**

```ts
export class AudioPrefetchQueue { /* prefetch + has + get */ }
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/audio-prefetch.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/tts/audioPrefetchQueue.ts src/tts/clipCache.ts tests/unit/audio-prefetch.test.ts
git commit -m "feat: add next-sentence audio prefetch and caching"
```

### Task 11: TTS Model Manager (Curated Catalog)

**Files:**
- Create: `src/models/catalog.ts`
- Create: `src/models/modelManager.ts`
- Create: `src/components/ModelManagerPanel.tsx`
- Create: `tests/unit/model-manager.test.ts`

**Step 1: Write the failing test**

```ts
import { installModel, listModels } from '../../src/models/modelManager'

it('installs and lists a curated model', async () => {
  await installModel('fi-starter-small')
  const models = await listModels()
  expect(models.some((m) => m.id === 'fi-starter-small')).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/model-manager.test.ts`
Expected: FAIL due to missing manager functions.

**Step 3: Write minimal implementation**

```ts
export async function installModel(id: string) { /* download/store */ }
export async function listModels() { /* read installed */ }
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/model-manager.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/models/catalog.ts src/models/modelManager.ts src/components/ModelManagerPanel.tsx tests/unit/model-manager.test.ts
git commit -m "feat: add curated tts model manager with install/select/remove"
```

### Task 12: Offline Hardening and Error Recovery UX

**Files:**
- Modify: `src/main.tsx`
- Create: `src/offline/cachePolicy.ts`
- Create: `src/components/StorageErrorBanner.tsx`
- Create: `tests/unit/offline-hardening.test.ts`

**Step 1: Write the failing test**

```ts
import { shouldServeFromCache } from '../../src/offline/cachePolicy'

it('serves app shell assets from cache when offline', () => {
  expect(shouldServeFromCache('/assets/main.js')).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/offline-hardening.test.ts`
Expected: FAIL due to missing policy module.

**Step 3: Write minimal implementation**

```ts
export function shouldServeFromCache(path: string) {
  return path.startsWith('/assets/') || path === '/'
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/offline-hardening.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/main.tsx src/offline/cachePolicy.ts src/components/StorageErrorBanner.tsx tests/unit/offline-hardening.test.ts
git commit -m "feat: harden offline caching and storage error handling"
```

### Task 13: Widget-Level Test Completion (All Interactive UI)

**Files:**
- Create: `tests/unit/widgets/replay-button.test.tsx`
- Create: `tests/unit/widgets/submit-button.test.tsx`
- Create: `tests/unit/widgets/import-controls.test.tsx`
- Create: `tests/unit/widgets/model-manager-panel.test.tsx`
- Create: `tests/unit/widgets/masked-input-interaction.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReplayButton } from '../../../src/components/ReplayButton'

it('invokes replay callback on click and touch', async () => {
  const user = userEvent.setup()
  const onReplay = vi.fn()
  render(<ReplayButton onReplay={onReplay} />)
  await user.click(screen.getByRole('button', { name: /replay/i }))
  expect(onReplay).toHaveBeenCalledTimes(1)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/widgets/replay-button.test.tsx`
Expected: FAIL initially until widget behavior is fully wired.

**Step 3: Write minimal implementation**

```tsx
export function ReplayButton({ onReplay }: { onReplay: () => void }) {
  return <button onClick={onReplay}>Replay</button>
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/widgets/*.test.tsx`
Expected: PASS for all interactive widget tests.

**Step 5: Commit**

```bash
git add tests/unit/widgets
git commit -m "test: add required functional coverage for interactive widgets"
```

### Task 14: End-to-End Coverage (Desktop + Mobile)

**Files:**
- Create: `tests/e2e/story-flow.spec.ts`
- Create: `tests/e2e/mobile-story-flow.spec.ts`
- Modify: `playwright.config.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test'

test('desktop story round supports replay, retry, and scoring', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Replay' }).click()
  await page.getByRole('textbox', { name: 'Word 1' }).fill('Olipa')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/stars/i)).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/story-flow.spec.ts`
Expected: FAIL until end-to-end flow is complete.

**Step 3: Write minimal implementation**

```tsx
// Ensure accessible labels for replay, submit, and word inputs
// Wire submit/retry flow through visible score state
```

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS on desktop and mobile profile.

**Step 5: Commit**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: add e2e coverage for desktop and mobile story gameplay"
```

### Task 15: Documentation and Developer Runbook

**Files:**
- Modify: `README.md`
- Create: `docs/testing.md`
- Create: `docs/model-manager.md`
- Create: `tests/unit/docs-readme.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs'

it('documents required test commands', () => {
  const readme = fs.readFileSync('README.md', 'utf8')
  expect(readme).toMatch(/npm run test:unit/)
  expect(readme).toMatch(/npm run test:e2e/)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/docs-readme.test.ts`
Expected: FAIL until docs are updated.

**Step 3: Write minimal implementation**

```md
## Development
- npm install
- npm run dev
- npm run test:unit
- npm run test:e2e
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/docs-readme.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/testing.md docs/model-manager.md tests/unit/docs-readme.test.ts
git commit -m "docs: add developer runbook and testing instructions"
```

### Task 16: Full Verification Gate

**Files:**
- Modify: `.github/workflows/ci.yml` (if CI is configured)
- Modify: `package.json`
- Create: `tests/unit/ci-script.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs'

it('defines CI script for unit and e2e tests', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  expect(pkg.scripts.ci).toContain('test:unit')
  expect(pkg.scripts.ci).toContain('test:e2e')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/ci-script.test.ts`
Expected: FAIL until CI command exists.

**Step 3: Write minimal implementation**

```json
{
  "scripts": {
    "ci": "npm run test:unit && npm run test:e2e"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/ci-script.test.ts && npm run ci`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json .github/workflows/ci.yml tests/unit/ci-script.test.ts
git commit -m "chore: enforce ci verification gate for unit and e2e tests"
```

### Task 17: GitHub Pages Deployment

**Linear:** `KUU-22`

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Create: `tests/unit/github-pages-deploy.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs'

it('defines gh-pages deployment workflow for dist publishing', () => {
  const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8')
  expect(workflow).toMatch(/push:/)
  expect(workflow).toMatch(/branches:\\s*\\n\\s*- main/)
  expect(workflow).toMatch(/github-pages-deploy-action/)
  expect(workflow).toMatch(/branch: gh-pages/)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/github-pages-deploy.test.ts`
Expected: FAIL until merge-to-main deployment workflow is configured.

**Step 3: Write minimal implementation**

```ts
// vite.config.ts
// Configure GitHub Pages project base path (for example, '/kuupeli/').
```

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: dist
```

```md
## GitHub Pages Deployment
- Every merge/push to `main` triggers an automated deploy workflow.
- The workflow builds the app and pushes `dist/` contents to `gh-pages`.
- Open the Pages URL and verify static assets + app shell load correctly.
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/github-pages-deploy.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add vite.config.ts .github/workflows/deploy-pages.yml README.md tests/unit/github-pages-deploy.test.ts
git commit -m "feat: auto-deploy gh-pages branch after merges to main"
```
