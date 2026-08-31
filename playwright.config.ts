import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const isLocalhost = BASE_URL.startsWith("http://localhost");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // In CI, pair the github reporter (inline annotations) with an html one so
  // playwright-report/ is actually written for the workflow's upload step.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
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
        // Under CI, serve a production build: dev-mode compile-on-first-request
        // adds seconds to every first navigation and never exercises the built
        // output that production actually ships.
        command: process.env.CI
          ? "npm run build && npx next start --port 3000"
          : "npx next dev --port 3000",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        // Generous enough to cover the CI build, not just server startup.
        timeout: 180_000,
      }
    : undefined,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
