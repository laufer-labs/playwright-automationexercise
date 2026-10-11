import { test, expect } from '../../fixtures/test.fixture';

test.describe('Products', { tag: '@regression' }, () => {
  test('should open products tab when logged in', async ({ navBar, productsPage, page }) => {
    // Starts logged in as this worker's account (see fixtures/test.fixture.ts) - no manual login needed.
    await page.goto('/');

    await expect(navBar.loggedInAs).toBeVisible();

    await navBar.openProductsTab();

    await expect(page).toHaveURL(/\/products/);
    await expect(productsPage.allProductsHeading).toBeVisible();
  });
});
