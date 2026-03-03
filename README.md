# kuupeli

Offline-first standalone PWA for Finnish dictation practice.

## Model Manager Note

Kuupeli Model Manager supports:
- bundled `espeak-ng` Finnish voices (available immediately)
- downloadable Finnish Piper voices (`fi_FI-harri-low`, `fi_FI-harri-medium`) stored locally on device

Each installed model can be set active, voice type can be selected where applicable, and a local test phrase can be played.

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test:unit
npm run test:e2e
```

Optional live Piper smoke test (real download + synthesis in browser, Chromium only):

```bash
KUUPELI_RUN_LIVE_PIPER=1 npm run test:e2e -- tests/e2e/live-piper-smoke.spec.ts --project=chromium
```

In development mode, Kuupeli also auto-preloads `fi-piper-harri-low` in the background to make manual model testing easier.
Set `VITE_PRELOAD_TEST_MODEL=0` to disable this behavior.

## Build

```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages)

- Automatic deploy runs via `.github/workflows/deploy-pages.yml` on every push to `main`.
- The workflow builds with `VITE_BASE_PATH=/kuupeli/` and publishes `dist/` to the `gh-pages` branch.
- GitHub Pages should be configured to serve from the `gh-pages` branch (root folder).

### Post-Deploy Check

1. Open the published app URL: `https://elhigu.github.io/kuupeli/`.
2. Confirm app shell loads with no missing asset errors in browser console.
3. Confirm route navigation (`Play`, `Stories`, `Models`) and audio replay still work.
