import { expect, test } from './guardedTest'

test('play page links to stories and models routes', async ({ page }) => {
  await page.goto('/play')
  await page.getByRole('button', { name: 'Aloita' }).click()

  await page.getByRole('link', { name: 'Stories' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Stories' })).toBeVisible()
  await expect(page.getByLabel('Import File')).toBeVisible()

  await page.getByRole('link', { name: /back to play/i }).click()
  await page.getByRole('button', { name: 'Aloita' }).click()
  await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible()

  await page.getByRole('link', { name: 'Models' }).click()
  await expect(page.getByRole('heading', { name: /models/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /model manager/i })).toBeVisible()
})
