import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  globalSetup: "./scripts/seed-auth-states.ts",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["iPad Pro"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: [
    {
      command: "uvicorn backend.api.app:create_app --factory --port 8000",
      cwd: "..",
      port: 8000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "yarn dev --port 5173",
      cwd: "../frontend",
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
