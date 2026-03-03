import { expect, test } from './guardedTest'

test('start modal gates first sentence and allows immediate typing after Aloita', async ({ page }) => {
  await page.goto('/play')

  await expect(page.getByText('Oletko valmis ensimmäiseen lauseeseen?')).toBeVisible()
  await page.getByRole('button', { name: 'Aloita' }).click()
  await expect(page.getByText('Oletko valmis ensimmäiseen lauseeseen?')).toBeHidden()

  const composer = page.getByLabel('Sentence answer input')
  await composer.pressSequentially('olipakerran')
  await composer.press('Enter')

  await expect(page.getByText(/Stars:/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Skip sentence' })).toBeDisabled()
})
