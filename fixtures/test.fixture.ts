import { test as base, request as apiRequest } from '@playwright/test';
import type { APIRequestContext, Browser, BrowserContextOptions, Page } from '@playwright/test';
import { createAccount, deleteAccount } from '../api/account.api';
import { createAccountInformation, createSignupUser } from '../data/users.data';
import { AuthPage } from '../pages/auth.page';
import { AccountPage } from '../pages/account.page';
import { ProductsPage } from '../pages/products.page';
import { NavBar } from '../pages/nav-bar.page';
import type { LoginCredentials, User } from '../types/user.types';

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>;

type AccountCleanup = {
  register(credentials: LoginCredentials): void;
};

type TestFixtures = {
  authPage: AuthPage;
  accountPage: AccountPage;
  productsPage: ProductsPage;
  navBar: NavBar;
  accountCleanup: AccountCleanup;
  /** A fresh account created via the API before the test and deleted after it. */
  apiUser: User;
};

export type WorkerFixtures = {
  /** Set per project in playwright.config.ts: start tests logged in as the worker's account. */
  loggedIn: boolean;
  /** Logged-in session for an account owned by this worker, or undefined when loggedIn is false. */
  workerStorageState: StorageState | undefined;
};

// Block third-party ad requests (e.g. Google AdSense "vignette" interstitials)
// that otherwise intercept clicks and cause flaky navigation on automationexercise.com.
const AD_REQUEST = /googlesyndication\.com|doubleclick\.net|googleadservices\.com|adservice\.google\.|pagead/;

async function blockAds(page: Page): Promise<void> {
  await page.route(AD_REQUEST, (route) => route.abort());
}

async function createApiUser(request: APIRequestContext): Promise<User> {
  const { name, email } = createSignupUser();
  const info = createAccountInformation();
  const user: User = { name, email, password: info.password };

  await createAccount(request, user, info);
  return user;
}

/** Logs in through the UI in a throwaway context and returns the resulting session. */
async function logIn(browser: Browser, baseURL: string | undefined, credentials: LoginCredentials): Promise<StorageState> {
  const context = await browser.newContext({ baseURL });
  try {
    const page = await context.newPage();
    await blockAds(page);
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login(credentials);
    await new NavBar(page).loggedInAs.waitFor();
    return await context.storageState();
  } finally {
    await context.close();
  }
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  loggedIn: [false, { option: true, scope: 'worker' }],

  // One account per parallel worker, so logged-in tests never share state across workers.
  workerStorageState: [
    async ({ loggedIn, browser }, use, workerInfo) => {
      if (!loggedIn) {
        await use(undefined);
        return;
      }

      const baseURL = workerInfo.project.use.baseURL;
      const request = await apiRequest.newContext({ baseURL });
      try {
        const user = await createApiUser(request);

        // Delete the account even if logging in or the tests fail.
        try {
          await use(await logIn(browser, baseURL, user));
        } finally {
          await deleteAccount(request, user);
        }
      } finally {
        await request.dispose();
      }
    },
    { scope: 'worker' },
  ],

  storageState: async ({ workerStorageState, storageState }, use) => {
    await use(workerStorageState ?? storageState);
  },

  page: async ({ page }, use) => {
    await blockAds(page);
    await use(page);
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  accountCleanup: async ({ request }, use) => {
    const accounts: LoginCredentials[] = [];

    await use({
      register(credentials) {
        accounts.push(credentials);
      },
    });

    // Attempt every delete, then report all failures together.
    const results = await Promise.allSettled(accounts.map((credentials) => deleteAccount(request, credentials)));
    const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []));
    if (errors.length) {
      throw new AggregateError(errors, `Failed to delete ${errors.length} of ${accounts.length} test accounts`);
    }
  },
  apiUser: async ({ request, accountCleanup }, use) => {
    const user = await createApiUser(request);
    accountCleanup.register(user);

    await use(user);
  },
});

export { expect } from '@playwright/test';
