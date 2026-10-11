import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';
import type { WorkerFixtures } from './fixtures/test.fixture';
import { currentsReporter } from '@currents/playwright';
import dotenv from 'dotenv';

/* Load secrets (e.g. CURRENTS_RECORD_KEY) from .env (see .env.example). */
dotenv.config({ quiet: true });

/* Currents is optional: it only reports when both values come from the environment,
   so the project ID stays out of the code and runs without them still pass. */
const { CURRENTS_RECORD_KEY, CURRENTS_PROJECT_ID } = process.env;
const currents: ReporterDescription[] =
  CURRENTS_RECORD_KEY && CURRENTS_PROJECT_ID
    ? [currentsReporter({ recordKey: CURRENTS_RECORD_KEY, projectId: CURRENTS_PROJECT_ID })]
    : [];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig<{}, WorkerFixtures>({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Every worker creates its own account via the API (see fixtures/test.fixture.ts),
     so tests never share state. Capped lower on CI to go easy on the public site. */
  workers: process.env.CI ? 2 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html'], ...currents],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://automationexercise.com/',

    /* Collect artifacts to report to Currents. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure-and-retries',
    video: 'retain-on-failure',
    screenshot: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Auth-flow tests (login/signup) run logged out - they test authentication itself */
    {
      name: 'auth',
      testMatch: '**/tests/auth/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    /* All other tests start logged in as an account owned by their worker */
    {
      name: 'chromium',
      testIgnore: ['**/tests/auth/**'],
      use: {
        ...devices['Desktop Chrome'],
        loggedIn: true,
      },
    },
  ],
});
