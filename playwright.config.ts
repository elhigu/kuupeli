import fs from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const nixChromiumPath = '/home/elhigu/.nix-profile/bin/chromium'
const configuredExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const fallbackExecutablePath = fs.existsSync(nixChromiumPath) ? nixChromiumPath : undefined

const launchOptions = configuredExecutablePath || fallbackExecutablePath
  ? { executablePath: configuredExecutablePath ?? fallbackExecutablePath }
  : undefined

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    ...(launchOptions ? { launchOptions } : {})
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }
  ]
})
