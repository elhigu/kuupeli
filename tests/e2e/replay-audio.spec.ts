import { expect, test } from './guardedTest'

test('replay outputs non-empty audio payload', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __kuupeliAudioPlayCalls?: number }).__kuupeliAudioPlayCalls = 0
    ;(window as unknown as { __kuupeliSpeechSpeakCalls?: number }).__kuupeliSpeechSpeakCalls = 0

    const originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      const state = window as unknown as { __kuupeliAudioPlayCalls: number }
      state.__kuupeliAudioPlayCalls += 1
      return originalPlay.apply(this, args)
    }

    if ('speechSynthesis' in window) {
      const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis)
      window.speechSynthesis.speak = ((utterance: SpeechSynthesisUtterance) => {
        const state = window as unknown as { __kuupeliSpeechSpeakCalls: number }
        state.__kuupeliSpeechSpeakCalls += 1
        return originalSpeak(utterance)
      }) as SpeechSynthesis['speak']
    }
  })

  await page.goto('')
  await page.getByRole('button', { name: 'Aloita' }).click()

  const baselinePlaybackCalls = await page.evaluate(() => {
    const state = window as unknown as {
      __kuupeliAudioPlayCalls?: number
      __kuupeliSpeechSpeakCalls?: number
    }

    return (state.__kuupeliAudioPlayCalls ?? 0) + (state.__kuupeliSpeechSpeakCalls ?? 0)
  })

  await page.getByRole('button', { name: 'Replay' }).click()

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const state = window as unknown as {
            __kuupeliAudioPlayCalls?: number
            __kuupeliSpeechSpeakCalls?: number
          }
          return (state.__kuupeliAudioPlayCalls ?? 0) + (state.__kuupeliSpeechSpeakCalls ?? 0)
        }),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(baselinePlaybackCalls)

  await expect
    .poll(() => page.getByRole('button', { name: 'Replay' }).isEnabled())
    .toBeTruthy()
})
