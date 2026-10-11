import { test, expect } from '../../fixtures/test.fixture';
import { createAccountInformation, createSignupUser } from '../../data/users.data';

test.describe('Signup', () => {
  test('should display signup form', async ({ authPage }) => {
    await authPage.goto();

    await expect(authPage.signupNameInput).toBeVisible();
    await expect(authPage.signupEmailInput).toBeVisible();
    await expect(authPage.signupButton).toBeVisible();
  });

  test('should fill signup form and submit', async ({ authPage, accountPage }) => {
    const user = createSignupUser();

    await authPage.goto();
    await authPage.signup(user);

    await expect(authPage.page).toHaveURL(/\/signup/);
    await expect(accountPage.heading).toBeVisible();
  });

  test('should fill account information and create account', async ({ authPage, accountPage, navBar, accountCleanup }, testInfo) => {
    const user = createSignupUser();
    const accountInfo = createAccountInformation();

    // Attach the generated data to the report so failed runs are reproducible.
    await testInfo.attach('generated-user', {
      body: JSON.stringify({ ...user, ...accountInfo }, null, 2),
      contentType: 'application/json',
    });

    await authPage.goto();
    await authPage.signup(user);

    await expect(accountPage.heading).toBeVisible();

    // The site pre-fills name and email from the signup form.
    await expect(accountPage.nameInput).toHaveValue(user.name);
    await expect(accountPage.emailInput).toHaveValue(user.email);

    accountCleanup.register({ email: user.email, password: accountInfo.password });

    await accountPage.createAccount(accountInfo);

    await expect(accountPage.accountCreated).toBeVisible();

    await accountPage.continue();

    await expect(navBar.loggedInAs).toBeVisible();
    await expect(navBar.loggedInAs).toContainText(user.name);
  });
});
