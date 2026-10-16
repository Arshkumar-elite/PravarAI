import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "**/walkthrough.capture.ts",
  timeout: 240_000,
  webServer: Array.isArray(base.webServer)
    ? base.webServer.map((server, index) =>
        index === 0
          ? { ...server, env: { ...server.env, LEADFLOW_DEMO_REAL_TIME: "1" } }
          : server,
      )
    : base.webServer,
  projects: [
    {
      name: "walkthrough",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
  ],
  use: {
    ...base.use,
    video: { mode: "on", size: { width: 1440, height: 1000 } },
  },
});
