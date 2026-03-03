import { expect, test } from './guardedTest'

test('story progress can be rewound and reset from Stories view', async ({ page }) => {
  const fileName = 'story-progress-controls.txt'
  await page.goto('/stories')

  await page.getByLabel('Import File').setInputFiles({
    name: fileName,
    mimeType: 'text/plain',
    buffer: Buffer.from('Yksi. Kaksi. Kolme.', 'utf8')
  })

  const storyItem = page.locator('.story-list-item', { hasText: 'story-progress-controls' })
  await expect(storyItem).toBeVisible()
  await expect(storyItem).toContainText('Progress: 1/3')

  await page.getByRole('link', { name: /back to play/i }).click()
  await page.getByRole('radio', { name: /story-progress-controls/i }).click()
  await page.getByRole('button', { name: 'Aloita' }).click()

  await expect(page.getByText(/story-progress-controls: 1\/3/i)).toBeVisible()
  await page.getByRole('button', { name: /skip sentence/i }).click()
  await page.getByRole('button', { name: /skip sentence/i }).click()
  await expect(page.getByText(/story-progress-controls: 3\/3/i)).toBeVisible()

  await page.getByRole('link', { name: 'Stories' }).click()
  await expect(storyItem).toContainText('Progress: 3/3')

  await storyItem.getByRole('button', { name: /rewind story-progress-controls/i }).click()
  await expect(storyItem).toContainText('Progress: 2/3')

  await storyItem.getByRole('button', { name: /reset progress for story-progress-controls/i }).click()
  await expect(storyItem).toContainText('Progress: 1/3')
})
