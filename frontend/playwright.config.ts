import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    reducedMotion: "reduce",
    baseURL: "http://127.0.0.1:3001",
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: "**/smoke.spec.ts",
    },
  ],
  webServer: [
    {
      command: "../backend/.venv/bin/python tests/start_e2e.py",
      cwd: "../backend",
      url: "http://127.0.0.1:8001/api/health",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --port 3001",
      url: "http://127.0.0.1:3001",
      env: {
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8001/api",
        NEXT_DIST_DIR: ".next-e2e",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
