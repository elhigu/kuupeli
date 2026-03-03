import { expect, test } from './guardedTest'

test('typing contiguous letters fills masked sentence across spaces', async ({ page }) => {
  await page.goto('play')
  await page.getByRole('button', { name: 'Aloita' }).click()

  const composer = page.getByLabel('Sentence answer input')
  await composer.focus()
  await composer.pressSequentially('olipa kerran')

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('Stars: 3')).toBeVisible()
})
