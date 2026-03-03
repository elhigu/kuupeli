import { expect, test } from './guardedTest'

test('imported story can be selected from start modal', async ({ page }) => {
  await page.goto('/stories')

  await page.getByLabel('Import File').setInputFiles('tests/fixtures/story-library-sample.txt')
  await expect(page.getByText('story-library-sample')).toBeVisible()

  await page.getByRole('link', { name: /back to play/i }).click()
  await expect(page.getByText('Oletko valmis ensimmäiseen lauseeseen?')).toBeVisible()

  await page.getByRole('radio', { name: /story-library-sample/i }).click()
  await page.getByRole('button', { name: 'Aloita' }).click()

  await expect(page.getByText(/story-library-sample: 1\/2/i)).toBeVisible()
})
