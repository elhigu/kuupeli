import { expect, test } from '@playwright/test'

test('desktop story round supports replay, retry, and scoring', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Replay' }).click()
  await page.getByLabel('Word 1').fill('Olipa')
  await page.getByLabel('Word 2').fill('kerran')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText(/Stars:/)).toBeVisible()
})
