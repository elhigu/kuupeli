import { expect, test } from './guardedTest'

test('mobile story round supports replay and scoring', async ({ page }) => {
  await page.goto('')

  await page.getByRole('button', { name: 'Aloita' }).click()
  await page.getByRole('button', { name: 'Replay' }).click()
  const composer = page.getByLabel('Sentence answer input')
  await composer.focus()
  await composer.pressSequentially('olipakerran')
  await composer.press('Enter')

  await expect(page.getByText(/Stars:/)).toBeVisible()
})
