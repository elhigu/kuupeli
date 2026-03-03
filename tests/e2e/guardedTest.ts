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
          const text = message.text()
          const isKnownOnnxCpuWarning =
            text.includes('[W:onnxruntime:Default, cpuid_info.cc:95 LogEarlyWarning] Unknown CPU vendor')

          if (!isKnownOnnxCpuWarning) {
            collector.consoleErrors.push(text)
          }
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
