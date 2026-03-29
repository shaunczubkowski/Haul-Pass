import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const isLocalhost = BASE_URL.startsWith("http://localhost");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // Block service workers so page.route() mocks are not shadowed by the PWA
    // service worker when tests run against https://www.getfillright.com.
    // See: https://playwright.dev/docs/network#service-worker
    serviceWorkers: "block",
  },
  // Only start the local dev server when running against localhost.
  // When BASE_URL points at a deployed environment the server is already up.
  webServer: isLocalhost
    ? {
        command: "npx next dev --port 3000",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
