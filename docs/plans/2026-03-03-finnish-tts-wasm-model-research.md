# Finnish TTS WASM Model Research (KUU-23)

## Scope
- Identify Finnish text-to-speech options that can run in-browser with WebAssembly and produce playable audio.
- Recommend what Kuupeli should support now vs later.

## Source-Backed Findings

1. `espeak-ng` is already available as a browser/WASM package and is lightweight for offline-first use.
   - Source: `npm espeak-ng` package metadata and docs
   - URL: https://www.npmjs.com/package/espeak-ng

2. `@mintplex-labs/piper-tts-web` provides browser-side Piper inference with model download/remove APIs and OPFS storage.
   - Source: package README + exported API/types (`predict`, `download`, `stored`, `remove`, `voices`)
   - URL: https://www.npmjs.com/package/@mintplex-labs/piper-tts-web
   - URL: https://github.com/Mintplex-Labs/piper-tts-web

3. Finnish Piper voices are available and explicitly listed, including:
   - `fi_FI-harri-low`
   - `fi_FI-harri-medium`
   - Source: Piper voice catalog listings and typed voice IDs
   - URL: https://huggingface.co/rhasspy/piper-voices/tree/main/fi/fi_FI/harri
   - URL: https://github.com/rhasspy/piper

4. ONNX Runtime Web is actively maintained for browser inference, making Piper-in-browser technically viable.
   - Source: official ONNX Runtime Web docs
   - URL: https://onnxruntime.ai/docs/get-started/with-javascript/web.html

## Practical Recommendation For Kuupeli v1

1. Keep bundled `espeak-ng` as zero-download default.
2. Add downloadable Finnish Piper voices (`harri-low`, `harri-medium`) for higher quality.
3. Expose install/remove lifecycle and active model selection in Model Manager.
4. Support per-model voice type selection where available (e.g., eSpeak variants).
5. Keep fallback path to browser `speechSynthesis` when runtime synthesis fails.

## Constraints / Tradeoffs

1. Piper Finnish voice downloads are much larger than eSpeak (~tens of MB), so install UX must show progress and deletion.
2. Browser autoplay policies still require user interaction for guaranteed audio playback.
3. Device CPU/memory variability affects Piper inference latency more than eSpeak.

## Approved Support Set Implemented In This Workstream

- `fi-starter-small` (eSpeak, bundled)
- `fi-balanced-medium` (eSpeak variant, bundled)
- `fi-piper-harri-low` (Piper, downloadable)
- `fi-piper-harri-medium` (Piper, downloadable)
