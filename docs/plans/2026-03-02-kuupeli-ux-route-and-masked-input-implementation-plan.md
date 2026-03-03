# Kuupeli UX Route Split + Masked Input Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the approved UX refresh by splitting gameplay and management into dedicated routes and replacing word text inputs with a custom masked sentence input engine.

**Architecture:** Introduce route-level separation (`/play`, `/stories`, `/models`) and keep gameplay state centered in the play route. Build a deterministic masked-input engine that models fillable slots vs fixed separators, then map existing submit/retry/scoring/audio flow to the new interaction layer without backend dependencies.

**Tech Stack:** React, TypeScript, Vite, React Router, Vitest, React Testing Library, Playwright

---

Implementation standards:
- Use @superpowers:test-driven-development for all implementation steps.
- Use @superpowers:systematic-debugging for any failing/unclear behavior.
- Use @superpowers:verification-before-completion before completion claims.
- Keep Linear MCP updated per `AGENTS.md`:
  - create/update linked tasks for each task below,
  - move statuses during execution,
  - link commits/PR updates to the corresponding Linear issues.

### Task 1: Add App Routing Shell (`/play`, `/stories`, `/models`)

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`
- Create: `src/routes/AppRoutes.tsx`
- Create: `src/routes/PlayPage.tsx`
- Create: `src/routes/StoriesPage.tsx`
- Create: `src/routes/ModelsPage.tsx`
- Test: `tests/unit/app-routes.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../../src/routes/AppRoutes'

it('renders stories route heading', () => {
  render(
    <MemoryRouter initialEntries={['/stories']}>
      <AppRoutes />
    </MemoryRouter>
  )
  expect(screen.getByRole('heading', { name: /stories/i })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/app-routes.test.tsx`  
Expected: FAIL because route components do not exist.

**Step 3: Write minimal implementation**

```tsx
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/play" element={<PlayPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/models" element={<ModelsPage />} />
      <Route path="*" element={<Navigate to="/play" replace />} />
    </Routes>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/app-routes.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json src/main.tsx src/routes/AppRoutes.tsx src/routes/PlayPage.tsx src/routes/StoriesPage.tsx src/routes/ModelsPage.tsx tests/unit/app-routes.test.tsx
git commit -m "feat: add route shell for play stories and models views"
```

### Task 2: Build Masked Sentence Engine Model

**Files:**
- Create: `src/play/maskedInputModel.ts`
- Test: `tests/unit/masked-input-model.test.ts`

**Step 1: Write the failing test**

```ts
import { buildMaskModel } from '../../src/play/maskedInputModel'

it('marks letters as fillable and punctuation as static', () => {
  const model = buildMaskModel('Olipa kerran.')
  expect(model.fillableCount).toBe(11)
  expect(model.tokens.at(-1)?.kind).toBe('static')
  expect(model.tokens.at(-1)?.value).toBe('.')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/masked-input-model.test.ts`  
Expected: FAIL due to missing model module.

**Step 3: Write minimal implementation**

```ts
export function buildMaskModel(sentence: string): MaskModel {
  // produce token list: fillable slots for letters, static tokens for separators
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/masked-input-model.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/play/maskedInputModel.ts tests/unit/masked-input-model.test.ts
git commit -m "feat: add masked input token model for letters and separators"
```

### Task 3: Implement Custom Masked Input Component Keyboard Flow

**Files:**
- Create: `src/components/MaskedSentenceComposer.tsx`
- Test: `tests/unit/masked-sentence-composer.test.tsx`

**Step 1: Write the failing test**

```tsx
it('fills slots by continuous typing and ignores spaces', async () => {
  render(<MaskedSentenceComposer sentence="Olipa kerran" onChange={vi.fn()} />)
  await userEvent.keyboard('olipa kerran')
  expect(screen.getByTestId('mask-value')).toHaveTextContent('olipakerran')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/masked-sentence-composer.test.tsx`  
Expected: FAIL due to missing component.

**Step 3: Write minimal implementation**

```tsx
// hidden input + rendered slot surface
// key handling: letters fill next slot, space ignored
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/masked-sentence-composer.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/MaskedSentenceComposer.tsx tests/unit/masked-sentence-composer.test.tsx
git commit -m "feat: add masked sentence composer with continuous typing flow"
```

### Task 4: Add Backspace and Enter Submit-Gating Behavior

**Files:**
- Modify: `src/components/MaskedSentenceComposer.tsx`
- Test: `tests/unit/masked-sentence-composer.test.tsx`

**Step 1: Write the failing tests**

```tsx
it('backspace deletes current slot and moves left across separators', async () => {
  // type + backspace and assert cursor/value state
})

it('does not submit on Enter when mask is incomplete', async () => {
  // assert onSubmit not called and cursor unchanged
})

it('submits on Enter when all fillable slots are filled', async () => {
  // assert onSubmit called once with collected value
})
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- tests/unit/masked-sentence-composer.test.tsx`  
Expected: FAIL on new keyboard behavior assertions.

**Step 3: Write minimal implementation**

```tsx
// implement backspace traversal and enter gating rules
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- tests/unit/masked-sentence-composer.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/MaskedSentenceComposer.tsx tests/unit/masked-sentence-composer.test.tsx
git commit -m "feat: implement backspace traversal and enter submit gating in masked composer"
```

### Task 5: Integrate Composer into `/play` and Apply Word-Level Retry Highlighting

**Files:**
- Modify: `src/routes/PlayPage.tsx`
- Modify: `src/scoring/retryEvaluator.ts`
- Modify: `src/scoring/starScorer.ts` (if needed for animation timing state only)
- Test: `tests/unit/play-page-flow.test.tsx`

**Step 1: Write the failing test**

```tsx
it('highlights invalid words and focuses selected invalid word for editing', async () => {
  // submit wrong answer, assert word-level invalid class,
  // click invalid word, assert cursor starts at first letter of that word
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/play-page-flow.test.tsx`  
Expected: FAIL due to missing integration behavior.

**Step 3: Write minimal implementation**

```tsx
// replace old per-word inputs with MaskedSentenceComposer
// connect submit/retry/invalid-word click-to-edit flow
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/play-page-flow.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/routes/PlayPage.tsx src/scoring/retryEvaluator.ts src/scoring/starScorer.ts tests/unit/play-page-flow.test.tsx
git commit -m "feat: integrate masked composer with word-level retry highlight flow"
```

### Task 6: Move Story and Model Management to Dedicated Views

**Files:**
- Modify: `src/routes/PlayPage.tsx`
- Modify: `src/routes/StoriesPage.tsx`
- Modify: `src/routes/ModelsPage.tsx`
- Modify: `src/components/ImportControls.tsx`
- Modify: `src/components/ModelManagerPanel.tsx`
- Test: `tests/unit/stories-page.test.tsx`
- Test: `tests/unit/models-page.test.tsx`

**Step 1: Write failing tests**

```tsx
it('shows story management controls on /stories and not on /play', () => {})
it('shows model manager only on /models', () => {})
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- tests/unit/stories-page.test.tsx tests/unit/models-page.test.tsx`  
Expected: FAIL because controls still live on play surface.

**Step 3: Write minimal implementation**

```tsx
// move import + model controls to dedicated route components
// keep /play focused on game loop
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- tests/unit/stories-page.test.tsx tests/unit/models-page.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/routes/PlayPage.tsx src/routes/StoriesPage.tsx src/routes/ModelsPage.tsx src/components/ImportControls.tsx src/components/ModelManagerPanel.tsx tests/unit/stories-page.test.tsx tests/unit/models-page.test.tsx
git commit -m "feat: split story and model management into dedicated routes"
```

### Task 7: Add Success Animation Timing and Auto-Advance

**Files:**
- Modify: `src/routes/PlayPage.tsx`
- Modify: `src/styles.css`
- Test: `tests/unit/play-page-success-transition.test.tsx`

**Step 1: Write the failing test**

```tsx
it('auto-advances after successful submit with transition delay', async () => {
  vi.useFakeTimers()
  // submit correct answer
  // assert sentence index advances after ~700ms
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/play-page-success-transition.test.tsx`  
Expected: FAIL due to missing delayed transition behavior.

**Step 3: Write minimal implementation**

```tsx
// on success set transition state + delay next sentence advance by 700ms
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/play-page-success-transition.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/routes/PlayPage.tsx src/styles.css tests/unit/play-page-success-transition.test.tsx
git commit -m "feat: add success star transition and timed auto-advance"
```

### Task 8: Update E2E Coverage for New Route and Input UX

**Files:**
- Modify: `tests/e2e/story-flow.spec.ts`
- Modify: `tests/e2e/mobile-story-flow.spec.ts`
- Create: `tests/e2e/routes-navigation.spec.ts`
- Create: `tests/e2e/masked-input-flow.spec.ts`

**Step 1: Write failing e2e tests**

```ts
test('typing contiguous letters fills masked sentence across spaces', async ({ page }) => {})
test('play page links to stories and models routes', async ({ page }) => {})
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/masked-input-flow.spec.ts tests/e2e/routes-navigation.spec.ts`  
Expected: FAIL before route/input UX changes are fully wired.

**Step 3: Write minimal implementation updates**

```ts
// adjust selectors and assertions to route-based UX and masked input flow
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/masked-input-flow.spec.ts tests/e2e/routes-navigation.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/e2e/story-flow.spec.ts tests/e2e/mobile-story-flow.spec.ts tests/e2e/routes-navigation.spec.ts tests/e2e/masked-input-flow.spec.ts
git commit -m "test: add e2e coverage for masked input flow and route navigation"
```

### Task 9: Final Verification + Docs/Linear Sync

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-03-02-kuupeli-ux-route-and-masked-input-design.md` (only if final deltas exist)

**Step 1: Verify CI locally**

Run: `npm run ci`  
Expected: all unit and e2e tests PASS.

**Step 2: Update user-facing docs**

Document:
- new route structure,
- masked input behavior (space ignore, Enter gating),
- v1 story selection start behavior.

**Step 3: Sync Linear MCP**

For each linked UX ticket:
- set status to done/in review as appropriate,
- link commit hashes and PR URL,
- add short implementation summary.

**Step 4: Commit docs update**

```bash
git add README.md docs/plans/2026-03-02-kuupeli-ux-route-and-masked-input-design.md
git commit -m "docs: update ux flow and route behavior documentation"
```
