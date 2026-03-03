import { expect, test } from './guardedTest'

test('deep link stays under /kuupeli base path', async ({ page }) => {
  await page.goto('play')

  await expect(page.getByRole('button', { name: 'Aloita' })).toBeVisible()
  await expect(page).toHaveURL(/\/kuupeli\/play$/)
})
