# Playwright Automation Exercise

End-to-end test suite for [automationexercise.com](https://automationexercise.com), a public practice site for test automation. Written in TypeScript with [Playwright Test](https://playwright.dev), using page objects, custom fixtures and API-based test data.

## Highlights

- **No shared test account.** Every account a test needs is created through the site's API and deleted afterwards, so there are no credentials to manage and parallel runs never interfere with each other.
- **One logged-in account per worker.** Tests that need a session start already logged in, without repeating the login in every test.
- **Page Object Model** with locators and actions kept out of the tests.
- **Ad blocking** for third-party ad requests that otherwise cover the page and make clicks flaky.
- **CI on GitHub Actions**, with optional [Currents](https://currents.dev) reporting.

## Getting started

Requires Node.js 20 or newer.

```bash
npm ci
npx playwright install chromium
npm test
```

No `.env` file is needed to run the tests. See [Configuration](#configuration) for the optional Currents setup.

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Run the whole suite headless |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Open Playwright's UI mode to run and debug tests |
| `npm run report` | Open the HTML report from the last run |
| `npm run typecheck` | Type-check the project with `tsc` |

Useful filters:

```bash
npx playwright test --grep @smoke          # only tests tagged @smoke
npx playwright test --project=auth         # only the login/signup tests
npx playwright test tests/auth/login.spec.ts
```

## Project structure

```
├── api/            API helpers (create / delete accounts)
├── data/           Test data and random data generators
├── fixtures/       Custom Playwright fixtures (page objects, accounts, login)
├── pages/          Page objects
├── specs/          Test plans
├── tests/
│   ├── auth/       Login and signup tests (run logged out)
│   └── products/   Tests that run logged in
├── types/          Shared TypeScript types
└── playwright.config.ts
```

## How it works

### Projects

[playwright.config.ts](playwright.config.ts) defines two projects, both on Desktop Chrome:

| Project | Runs | Starts |
| --- | --- | --- |
| `auth` | `tests/auth/**` | Logged out, because these tests exercise login and signup themselves |
| `chromium` | Everything else | Logged in as an account owned by the worker |

### Test accounts

All account handling lives in [fixtures/test.fixture.ts](fixtures/test.fixture.ts):

- **`apiUser`**: creates a fresh account through `POST /api/createAccount` for a single test and deletes it when the test ends. Use it when a test needs a registered user, for example to log in.
- **Worker accounts**: in the `chromium` project, each parallel worker creates one account, logs in once through the UI, and shares that session with all of its tests. The account is deleted when the worker shuts down, even if the login or tests fail.
- **`accountCleanup`**: register any account a test creates through the UI (as the signup test does) and it is deleted after the test via `DELETE /api/deleteAccount`.

Generated user data comes from [data/users.data.ts](data/users.data.ts) and uses unique emails, so runs never collide.

### Writing a test

Import `test` and `expect` from the fixtures file rather than from `@playwright/test`, so the page objects and account fixtures are available:

```ts
import { test, expect } from '../../fixtures/test.fixture';

test('should log in with a fresh account', async ({ authPage, navBar, apiUser }) => {
  await authPage.goto();
  await authPage.login(apiUser);

  await expect(navBar.loggedInAs).toContainText(apiUser.name);
});
```

Put tests that should start logged out under `tests/auth/`. Everything else starts logged in.

### Tags

| Tag | Used for |
| --- | --- |
| `@smoke` | Core login checks |
| `@regression` | Broader feature checks |

## Configuration

Copy [.env.example](.env.example) to `.env` if you want to report runs to Currents:

| Variable | Purpose |
| --- | --- |
| `CURRENTS_RECORD_KEY` | Currents record key |
| `CURRENTS_PROJECT_ID` | Currents project ID |

The Currents reporter only turns on when both are set. Otherwise the suite runs with the `list` and `html` reporters only.

## Continuous integration

[.github/workflows/playwright.yml](.github/workflows/playwright.yml) runs the suite on every push to `main`, and can also be started manually from the Actions tab. It:

1. installs dependencies and the Playwright browsers;
2. runs the tests with 2 workers and up to 2 retries;
3. uploads the HTML report as a build artifact, kept for 7 days.

To enable Currents in CI, add `CURRENTS_RECORD_KEY` and `CURRENTS_PROJECT_ID` as repository secrets.

## AI-assisted test authoring

The repo includes [Playwright's test agents](https://playwright.dev/docs/test-agents) for Claude Code in [.claude/agents](.claude/agents), backed by the Playwright MCP server in [.mcp.json](.mcp.json):

- **planner**: explores the site and writes test plans to `specs/`, such as [specs/login-page.plan.md](specs/login-page.plan.md);
- **generator**: turns a plan into test files;
- **healer**: debugs and fixes failing tests.

## Notes

- automationexercise.com is a shared public site, so occasional slowness or failures can come from the site itself. Worker counts are kept modest (4 locally, 2 on CI) to go easy on it.
- Each full run creates and deletes a handful of accounts on the site.
