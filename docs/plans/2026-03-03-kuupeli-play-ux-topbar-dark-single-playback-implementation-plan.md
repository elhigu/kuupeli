# Kuupeli Play UX Topbar + Dark-Only + Single-Playback Plan (2026-03-03)

## Linear Tracking
- Umbrella: KUU-36
- Feature A: KUU-37
- Feature B: KUU-38
- Feature C: KUU-39
- Separate scoring track: GitHub PR #17 (not in this branch set)

## Scope Summary
1. Move the main gameplay area to the top of play view and add a compact top bar with menu actions for story/model managers.
2. Remove all theme switching paths and enforce dark mode as the only supported theme.
3. Ensure replay/autoplay is single-concurrency: starting a new playback must stop any current playback immediately.

## Constraints
- Keep app fully responsive for desktop/mobile/touch.
- Preserve existing game mechanics (masked input, submit/skip flow, scoring behavior) unless explicitly changed.
- Keep existing routes for story/model management; top bar is navigation entry, not feature rewrite.
- Do not implement sentence-level scoring logic changes in this plan; that work is handled in PR #17.

## Proposed Delivery Slices

### Slice 1: Play Layout and Information Hierarchy (KUU-37)
- Add top navigation bar in play view header with items:
  - `Stories`
  - `Models`
- Place game card (replay + masked composer + submit/skip) directly below top bar.
- Move secondary information below game card:
  - current story progress (e.g., `storyId: x/y`)
  - current score summary for the active story/session (display-only wiring in this branch set).
- Remove large top whitespace so first interactive controls appear immediately on load.

#### Acceptance
- Game controls are in top section without odd bottom anchoring.
- Top bar navigation works on both desktop/mobile widths.
- Progress/score info remains visible below game card.

### Slice 2: Dark-Only Mode (KUU-38)
- Remove theme toggle controls from UI.
- Force dark theme at app shell initialization.
- Remove theme switching persistence branches that support light mode.
- Keep a single dark token palette in CSS.

#### Acceptance
- No light-mode control exists.
- Reload always stays in dark mode.
- Tests no longer expect theme switching behavior.

### Slice 3: Playback Concurrency Guard (KUU-39)
- Introduce a playback session controller in `src/tts/playback.ts`.
- Before any new replay/autoplay starts:
  - stop currently active HTMLAudioElement playback, if any.
  - cancel in-flight fallback `speechSynthesis` utterance, if any.
- Ensure only the latest replay request can remain active.
- Prevent overlapping sound from rapid replay taps.

#### Acceptance
- Rapid replay clicks never overlap two voices.
- Autoplay/replay replacement is immediate and deterministic.
- Unit test verifies prior playback is stopped on new request.

## File-Level Implementation Targets
- `src/App.tsx`
- `src/styles.css`
- `src/tts/playback.ts`
- `src/components/*` (if extracting top bar or info panel)
- Tests (expected minimum):
  - `tests/unit/play-page-flow.test.tsx`
  - `tests/unit/theme-mode.test.tsx`
  - `tests/unit/app-replay-audio.test.tsx`
  - `tests/e2e/replay-audio.spec.ts`

## Test Plan
1. Layout test: play route renders top bar and game card above metadata.
2. Theme test: no toggle rendered and dark class/tokens always active.
3. Replay concurrency unit test: second replay stops previous audio path.
4. E2E: repeated replay clicks produce single active playback behavior.

## Branch and PR Sequence
1. Branch `feature/kuu-37-play-top-layout` from latest `main`, implement Slice 1, open PR to `main`.
2. Branch `feature/kuu-38-dark-only-mode` from latest `main`, implement Slice 2, open PR to `main`.
3. Branch `feature/kuu-39-single-playback` from latest `main`, implement Slice 3, open PR to `main`.
4. If dependencies emerge, stack temporarily, then rebase each branch to latest `main` before final review.

## Done Criteria
- All three feature tickets merged to `main`.
- CI green for each PR.
- KUU-36 updated with links to merged PRs and marked Done.
- Scoring implementation remains tracked and delivered via PR #17 separately.
