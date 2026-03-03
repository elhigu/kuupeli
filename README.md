# kuupeli

Offline-first standalone PWA for Finnish dictation practice.

## Model Manager Note

In v1, Model Manager entries are local Kuupeli runtime profiles (quality/speed presets stored on device). They are
not external downloadable cloud models yet.

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
