import { expect, test } from './guardedTest'

const RUN_LIVE_PIPER = process.env.KUUPELI_RUN_LIVE_PIPER === '1'

test('optional live piper download and synthesis smoke test', async ({ page, browserName }, testInfo) => {
  test.skip(!RUN_LIVE_PIPER, 'Set KUUPELI_RUN_LIVE_PIPER=1 to enable live Piper smoke coverage.')
  test.skip(browserName !== 'chromium', 'Live Piper smoke test runs only on the desktop Chromium project.')
  testInfo.setTimeout(240_000)

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
      { timeout: 45_000 }
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
      { timeout: 45_000 }
    )
    .toBeTruthy()
})
