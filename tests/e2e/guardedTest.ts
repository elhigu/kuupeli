import { expect, test as base } from '@playwright/test'

interface ErrorCollector {
  consoleErrors: string[]
  pageErrors: string[]
}

export const test = base.extend<{ errorCollector: ErrorCollector }>({
  errorCollector: [
    async ({ page }, use) => {
      const collector: ErrorCollector = {
        consoleErrors: [],
        pageErrors: []
      }

      page.on('console', (message) => {
        if (message.type() === 'error') {
          collector.consoleErrors.push(message.text())
        }
      })

      page.on('pageerror', (error) => {
        collector.pageErrors.push(error.message)
      })

      await use(collector)

      const allErrors = [...collector.consoleErrors, ...collector.pageErrors]
      expect(
        allErrors,
        `Browser runtime errors detected:\n${allErrors.map((error) => `- ${error}`).join('\n')}`
      ).toEqual([])
    },
    { auto: true }
  ]
})

export { expect }
