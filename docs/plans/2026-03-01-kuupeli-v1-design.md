# Kuupeli v1 Design (Standalone Offline PWA)

Date: 2026-03-01
Status: Approved
Scope: v1 core only (dictation gameplay + PDF/TXT training material ingestion)
Out of Scope for v1: grammar learning mode (tracked as future phase)

## 1. Product Goal
Kuupeli is a gamified app for learning Finnish writing through dictation.

Core loop:
1. App plays a Finnish sentence.
2. User writes the sentence into masked answer slots.
3. App scores attempts with 1-3 stars.
4. User progresses through imported story content in order.

## 2. Fixed Constraints and Decisions
- Standalone Progressive Web App (PWA).
- Device-local only for v1 (no backend/cloud account features).
- Responsive from day one: desktop + mobile, touch + mouse parity.
- Offline-first after initial install.
- TTS is local from day one, with model download/remove manager.
- Model manager uses curated in-app catalog only (no custom model file imports in v1).
- Story mode only: sentences presented in source order.

## 3. Chosen Architecture
Chosen approach: pure web PWA with in-browser local ML/TTS runtime.

Tech direction:
- Frontend: React + TypeScript + Vite.
- Offline + caching: Service Worker + Cache Storage.
- Local persistence: IndexedDB.
- TTS runtime: local WASM/ONNX-compatible inference runtime with downloadable Finnish models.

Primary modules:
- Content Ingestion: reads TXT/PDF, extracts text, splits into ordered sentence list.
- Session Engine: controls story progression, attempts, retries, stars.
- Input Mask Engine: renders letter-slot answer UI with fixed punctuation.
- TTS Engine: synthesizes current sentence and pre-generates next sentence audio.
- Model Manager: install/select/remove curated local models.
- Progress Store: local training pack progress and history.

## 4. Gameplay and Scoring Design
### 4.1 Round UI
For each sentence:
- Display masked answer slots for letters and spaces.
- Render punctuation directly in UI (not typed by user).
- Provide replay button for sentence audio.

Example target sentence:
`Olipa kerran kauan kauan sitten.`

UI pattern (illustrative):
`_____ ______ _____ _____ ______.`

### 4.2 Scoring Rules
- 3 stars: every letter is correct on first submission.
- 2 stars: sentence becomes fully correct on second submission.
- 1 star: sentence becomes fully correct on third+ submission, or user used skip/hint flow.

### 4.3 Retry Behavior
- First submit validates per-word correctness.
- Incorrect words are highlighted in distinct color.
- User edits invalid words and resubmits until sentence is fully correct.
- Progress continues to next sentence after successful completion or explicit skip.

## 5. Content Ingestion and Story Progression
Supported inputs:
- `.txt`
- `.pdf`

Pipeline:
1. Read local file.
2. Extract plain text.
3. Normalize whitespace and obvious extraction artifacts.
4. Split into sentence list while preserving source order.
5. Save as a local training pack.

Story mode behavior:
- Sentences always asked in source order.
- Per-pack progress stores current sentence index.
- Resume continues from last completed sentence.

## 6. TTS and Model Management
### 6.1 Runtime Behavior
- Local synthesis only.
- Replay uses cached clip when available.
- While user writes current sentence, app pre-generates next sentence audio.

### 6.2 Model Manager (v1)
- Curated catalog view: model name, size, quality tier, estimated speed.
- Install model to local storage.
- Set active model.
- Remove model to reclaim storage.
- Provide tiny starter model for immediate usability.

### 6.3 Offline Guarantees
After app shell and selected model are installed:
- Gameplay works without network.
- Ingestion, scoring, playback, retries, and progress persistence are local-only.

## 7. Error Handling
- Import errors: explicit cause + retry.
- Corrupt/missing model: show recovery path to reinstall or switch model.
- Storage quota exceeded: prompt cleanup via model/audio cache manager.
- Autosave after each submit to avoid progress loss.

## 8. Testing Strategy (Mandatory Widget Coverage)
Every interactive widget must have functionality tests.

Coverage layers:
1. Component/widget tests for each UI control and state transitions.
2. Integration tests for screen-level interaction flows.
3. E2E tests for complete user journeys in desktop and mobile viewports.

Required widget test coverage includes at minimum:
- answer slot input widget
- submit action
- replay audio button
- incorrect-word highlighting and retry editing
- import controls (TXT/PDF)
- model manager controls (download/select/remove)
- progress/session controls
- dialogs/toasts/error surfaces

Release gate:
- No widget ships without at least one functional test.
- CI must block merges on widget test failures.

## 9. Future Phase (v2+)
Future scope intentionally deferred from v1:
- Grammar learning mode (identify parts of speech and sub-word structures/suffixes).
- Potential leaderboard with pseudonym/nickname identities.

## 10. Initial Delivery Milestones
- M1: app shell + local storage + story session skeleton.
- M2: TXT/PDF ingestion and ordered sentence packs.
- M3: local TTS integration + replay + next-audio pre-generation.
- M4: scoring/retry mechanics + highlighting + stars.
- M5: model manager and offline hardening.
- M6: widget-level test completion and E2E acceptance.
