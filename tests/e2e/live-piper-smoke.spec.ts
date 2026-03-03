import { expect, test } from './guardedTest'

const LIVE_PIPER_POLL_TIMEOUT_MS = 120_000

test('live piper download and synthesis smoke test', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Live Piper smoke test runs only on desktop Chromium project.')
  testInfo.setTimeout(300_000)

  const infoLogs: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'info') {
      infoLogs.push(message.text())
    }
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
          (line) => line.includes('[Kuupeli][piper_runtime] predicted') && line.includes('fi_FI-harri-low')
        ),
      { timeout: LIVE_PIPER_POLL_TIMEOUT_MS }
    )
    .toBeTruthy()

  await expect
    .poll(
      () =>
        infoLogs.some(
          (line) =>
            line.includes('[Kuupeli][audio_playback] synthesized') &&
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
            line.includes('[Kuupeli][audio_playback] wasm_playback_completed') ||
            line.includes('[Kuupeli][audio_playback] fallback_speech_synthesis_completed')
        ),
      { timeout: LIVE_PIPER_POLL_TIMEOUT_MS }
    )
    .toBeTruthy()
})
