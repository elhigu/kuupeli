# Kuupeli UX Route Split + Masked Input Design

Date: 2026-03-02
Status: Approved
Scope: UX-focused restructuring of the game loop and navigation (no backend)

## 1. Product UX Goal
Reshape Kuupeli into a focused dictation game experience where:
- `/play` is dedicated to the sentence loop only.
- Story and model management are moved away from the play surface.
- Sentence answering uses a custom masked letter field that supports continuous typing (for example `olipakerran` for `Olipa kerran`).

## 2. Confirmed Decisions
- Navigation model: route-first (`/play`, `/stories`, `/models`).
- Main typing UX: custom masked sentence input, not plain text fields.
- Backspace behavior: delete current slot and move cursor left, skipping separators.
- Enter behavior: submit only when all fillable slots are filled.
- Enter on incomplete sentence: no submit and cursor position stays unchanged.
- Validation emphasis: word-level invalid highlighting.
- On valid submit: star animation then auto-advance after about 700 ms.
- Audio: autoplay on load when browser allows; replay is always available.
- Answer strictness: case-insensitive, diacritics-sensitive (`a` != `ä`).
- Punctuation: pre-rendered as static characters.
- Story selection behavior for v1: always start from beginning.
- Deferred feature: per-story resume/reset/rewind position management.

## 3. Information Architecture
### 3.1 `/play`
Primary game canvas only:
- top bar with navigation actions to `Stories` and `Models`
- sentence progress indicator
- replay control
- masked sentence answer surface
- submit and skip actions
- retry/error feedback and star result feedback

### 3.2 `/stories`
Separate story management surface:
- list available built-in and imported stories
- select active story
- import TXT/PDF story assets
- selecting a story starts from sentence 1 in v1

### 3.3 `/models`
Separate model/profile management surface:
- local runtime profile list
- install/remove/select active profile
- clear explanation that v1 profiles are local Kuupeli runtime profiles (not external downloadable cloud model bundles yet)

## 4. `/play` Interaction Design
### 4.1 Masked Sentence Surface
- Each letter is represented by one fillable slot.
- Spaces and punctuation are fixed tokens in the mask and are never typed.
- Cursor visibly blinks on the active fillable slot.

### 4.2 Input Flow
- Typing letters fills the next fillable slot.
- Pressing space is ignored.
- Continuous typing auto-crosses word boundaries.
- Backspace removes the current letter and moves left to previous fillable slot.

### 4.3 Submit Rules
- Enter attempts submit only if all fillable slots are populated.
- If not complete, nothing is submitted and cursor stays where it is.
- Submit button behavior matches Enter behavior.

### 4.4 Retry Rules
- On wrong submit, invalid words are highlighted at word level.
- Tapping/clicking a highlighted word starts editing from that word’s first letter slot.
- User can retry until sentence is correct.

### 4.5 Success Rules
- On correct answer, show star result animation.
- Auto-advance to next sentence after about 700 ms.

## 5. Error Handling UX
- If autoplay is blocked, show subtle guidance to use replay.
- Audio failures must be non-blocking; gameplay remains available.
- Route/view transitions must not lose current unsent masked input state unexpectedly.

## 6. Accessibility and Responsive Behavior
- Keyboard and touch parity for all gameplay actions.
- Visible focus styling for active slot and controls.
- `aria-live` regions for important state changes (retry needed, success, stars, next sentence).
- Mobile-first single-column layout for `/play`.
- `/stories` and `/models` remain fully usable on narrow touch screens.

## 7. Testing Requirements
- Unit tests for masked input tokenization and cursor behavior.
- Unit tests for keyboard behavior (space ignore, backspace traversal, Enter gating).
- Unit tests for invalid word click-to-edit behavior.
- Route-level integration tests for `/play`, `/stories`, `/models`.
- E2E for full dictation loop with masked input and auto-advance.

## 8. Non-Goals (This Iteration)
- Grammar-mode parsing and grammar token gameplay.
- Backend/cloud services.
- Per-story resume/reset/rewind UX controls (tracked as future feature).

## 9. Linear MCP Issue Map
Linear MCP access is not available in this terminal session. Mirror the following items in Linear and keep synced during implementation:

1. `UX-Play-Routes`: route split to `/play`, `/stories`, `/models`.
2. `UX-Masked-Input-Core`: custom sentence mask engine with cursor and keyboard model.
3. `UX-Play-Submit-Retry`: enter/submit gating, invalid-word highlight, click-to-edit flow.
4. `UX-Play-Feedback`: star animation and timed auto-advance.
5. `UX-Stories-View`: story selection/import view (start-from-beginning behavior).
6. `UX-Models-View`: separate model/profile view and explanation copy.
7. `UX-Regression-Tests`: unit/e2e coverage for new UX behavior.

