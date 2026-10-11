// spec: specs/login-page.plan.md

import type { Locator } from '@playwright/test';
import { test, expect } from '../../fixtures/test.fixture';
import { invalidCredentials, malformedEmailCredentials } from '../../data/users.data';

/** Asserts the input failed native HTML validation and returns its validation message. */
async function expectNativeValidationError(input: Locator): Promise<string> {
  const validity = await input.evaluate((el: HTMLInputElement) => ({
    valid: el.checkValidity(),
    message: el.validationMessage,
  }));
  expect(validity.valid).toBe(false);
  expect(validity.message.length).toBeGreaterThan(0);
  return validity.message;
}

test.describe('Login', { tag: '@smoke' }, () => {
  test('should display login page', async ({ authPage }) => {
    await authPage.goto();

    await expect(authPage.loginEmailInput).toBeVisible();
    await expect(authPage.loginPasswordInput).toBeVisible();
    await expect(authPage.loginButton).toBeVisible();
  });

  test('should log in with valid credentials and redirect to home', async ({ authPage, navBar, page, apiUser }) => {
    // 1. Start logged out. Navigate to /login.
    await authPage.goto();
    await expect(authPage.loginEmailInput).toBeVisible();
    await expect(authPage.signupNameInput).toBeVisible();

    // 2. Log in with a fresh account created via the API (see the apiUser fixture).
    await authPage.login(apiUser);

    await expect(page).toHaveURL(/automationexercise\.com\/$/);
    await expect(navBar.loggedInAs).toContainText(apiUser.name);
    await expect(navBar.logoutLink).toBeVisible();
    await expect(authPage.loginError).not.toBeVisible();
  });

  test('should show error for invalid credentials', async ({ authPage }) => {
    await authPage.goto();
    await authPage.login(invalidCredentials);

    await expect(authPage.loginError).toBeVisible();
  });

  test('should show error for registered email with wrong password', async ({ authPage, page, apiUser }) => {
    // 1. Start logged out. Navigate to /login. Fill the email of a registered account (created via the API) and an incorrect password, then click Login.
    await authPage.goto();
    await authPage.login({ email: apiUser.email, password: invalidCredentials.password });

    await expect(page).toHaveURL(/\/login$/);
    await expect(authPage.loginError).toBeVisible();
  });

  test('should block submission with native validation when email is empty', async ({ authPage, page }) => {
    // 1. Start logged out. Navigate to /login. Leave the email field empty, fill the password field with any value, then click Login.
    await authPage.goto();
    await authPage.loginPasswordInput.fill(invalidCredentials.password);
    await authPage.loginButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expectNativeValidationError(authPage.loginEmailInput);
    await expect(authPage.loginError).not.toBeVisible();
  });

  test('should block submission with native validation when password is empty', async ({ authPage, page }) => {
    // 1. Start logged out. Navigate to /login. Fill the email field with a valid-looking address, leave the password field empty, then click Login.
    await authPage.goto();
    await authPage.loginEmailInput.fill(invalidCredentials.email);
    await authPage.loginButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expectNativeValidationError(authPage.loginPasswordInput);
    await expect(authPage.loginError).not.toBeVisible();
  });

  test('should block submission with native validation when both fields are empty', async ({ authPage, page }) => {
    // 1. Start logged out. Navigate to /login. Leave both email and password empty and click Login.
    await authPage.goto();
    await authPage.loginButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expectNativeValidationError(authPage.loginEmailInput);
    await expect(authPage.loginError).not.toBeVisible();
  });

  test('should block submission with native validation for a malformed email', async ({ authPage, page }) => {
    // 1. Start logged out. Navigate to /login. Fill the email field with a malformed email (no @ symbol) and the password field with any value, then click Login.
    await authPage.goto();
    await authPage.loginEmailInput.fill(malformedEmailCredentials.email);
    await authPage.loginPasswordInput.fill(malformedEmailCredentials.password);
    await authPage.loginButton.click();

    await expect(page).toHaveURL(/\/login$/);
    const message = await expectNativeValidationError(authPage.loginEmailInput);
    expect(message).toContain('@');
    await expect(authPage.loginError).not.toBeVisible();
  });
});
