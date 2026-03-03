import { expect, test } from './guardedTest'

function extractSynthesizedBytes(logLine: string): number | null {
  if (!logLine.includes('[Kuupeli][audio_playback] wasm_synthesized')) {
    return null
  }

  const match = logLine.match(/bytes:\s*(\d+)/)
  if (!match) {
    return null
  }

  return Number.parseInt(match[1], 10)
}

test('replay outputs non-empty audio payload', async ({ page }) => {
  const infoLogs: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'info') {
      infoLogs.push(message.text())
    }
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Aloita' }).click()
  infoLogs.length = 0

  await page.getByRole('button', { name: 'Replay' }).click()

  await expect
    .poll(() => {
      const bytes = infoLogs.map(extractSynthesizedBytes).filter((value): value is number => value !== null)
      return bytes.length > 0 ? Math.max(...bytes) : 0
    })
    .toBeGreaterThan(44)

  await expect
    .poll(() =>
      infoLogs.some(
        (line) =>
          line.includes('[Kuupeli][audio_playback] wasm_playback_completed') ||
          line.includes('[Kuupeli][audio_playback] fallback_speech_synthesis_completed')
      )
    )
    .toBeTruthy()
})
