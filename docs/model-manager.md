# Model Manager

Kuupeli uses a curated local TTS model catalog.

## Current capabilities
- List curated models
- Install model locally
- Set active model
- Remove installed model (except starter model)

## Starter model
`fi-starter-small` is treated as the default bootstrap model.

## Storage
Installed model metadata is persisted in browser local storage for now.

## Finnish Piper Coverage (Snapshot: 2026-03-03)
- Available browser-WASM Finnish Piper voices in current upstream catalog:
  - `fi_FI-harri-low`
  - `fi_FI-harri-medium`
- Higher Finnish quality tiers (for example `high`) are currently unavailable in the upstream voice list used by Kuupeli.

Primary sources:
- https://huggingface.co/rhasspy/piper-voices/tree/main/fi/fi_FI/harri
- https://github.com/Mintplex-Labs/piper-tts-web
