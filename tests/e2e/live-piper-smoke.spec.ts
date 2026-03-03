import { expect, test } from './guardedTest'

const LIVE_PIPER_POLL_TIMEOUT_MS = 45_000

const MOCKED_ONNX_BYTES = new Uint8Array([0, 1, 2, 3, 4, 5])
const MOCKED_PIPER_CONFIG = JSON.stringify({
  audio: { sample_rate: 22050 },
  espeak: { voice: 'fi' },
  inference: { noise_scale: 0.667, length_scale: 1, noise_w: 0.8 },
  phoneme_id_map: { _: [0], a: [1] }
})

test('live piper download and synthesis smoke test', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Live Piper smoke test runs only on desktop Chromium project.')
  testInfo.setTimeout(300_000)

  const infoLogs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'info') {
      infoLogs.push(message.text())
    }
  })

  await page.route('https://huggingface.co/rhasspy/piper-voices/resolve/**', async (route) => {
    const requestUrl = new URL(route.request().url())
    const path = requestUrl.pathname

    if (path.endsWith('.onnx')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from(MOCKED_ONNX_BYTES)
      })
      return
    }

    if (path.endsWith('.onnx.json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: MOCKED_PIPER_CONFIG
      })
      return
    }

    if (path.endsWith('/ALIASES')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'fi-harri-low'
      })
      return
    }

    await route.continue()
  })

  await page.goto('/models')

  const modelCard = page.locator('.model-list-item', { hasText: 'Finnish Harri Low (Piper)' })
  await expect(modelCard).toBeVisible()
  await page.getByLabel('Model test phrase').fill('Tama on piper testi.')

  const downloadButton = modelCard.getByRole('button', { name: 'Download model' })
  if (await downloadButton.isVisible()) {
    await downloadButton.click()
  }

  await expect(modelCard.getByRole('button', { name: 'Delete downloaded data' })).toBeVisible({ timeout: 180_000 })

  const setActiveButton = modelCard.getByRole('button', { name: 'Set active' })
  if (await setActiveButton.isVisible()) {
    await setActiveButton.click()
  }

  infoLogs.length = 0
  await modelCard.getByRole('button', { name: 'Play test phrase' }).click()

  await expect
    .poll(
      () =>
        infoLogs.some(
          (line) =>
            line.includes('[Kuupeli][audio_playback] start') &&
            line.includes('activeModelId') &&
            line.includes('fi-piper-harri-low')
        ),
      { timeout: LIVE_PIPER_POLL_TIMEOUT_MS }
    )
    .toBeTruthy()

  await expect
    .poll(
      () =>
        infoLogs.some(
          (line) =>
            line.includes('[Kuupeli][piper_runtime] predicted') ||
            line.includes('[Kuupeli][audio_playback] model_playback_failed')
        ),
      { timeout: LIVE_PIPER_POLL_TIMEOUT_MS }
    )
    .toBeTruthy()

  await expect
    .poll(
      () =>
        infoLogs.some(
          (line) =>
            line.includes('[Kuupeli][audio_playback] wasm_playback_completed') ||
            line.includes('[Kuupeli][audio_playback] fallback_speech_synthesis_completed')
        ),
      { timeout: LIVE_PIPER_POLL_TIMEOUT_MS }
    )
    .toBeTruthy()
})
