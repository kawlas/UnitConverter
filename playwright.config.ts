import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.pw\.ts/,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "VITE_GA4_MANUAL_PAGEVIEWS_READY=true VITE_ADSENSE_PLACEHOLDERS=true npm run build && node scripts/serve-dist.mjs",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
