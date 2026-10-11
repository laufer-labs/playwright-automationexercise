import type { Page, Locator } from '@playwright/test';

/**
 * Site-wide header/navigation bar, visible on every page.
 */
export class NavBar {
  readonly page: Page;
  readonly loggedInAs: Locator;
  readonly productsTab: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loggedInAs = page.locator('a', { hasText: 'Logged in as' });
    this.productsTab = page.locator('.shop-menu a[href="/products"]');
    this.logoutLink = page.locator('.shop-menu a[href="/logout"]');
  }

  async openProductsTab() {
    await this.productsTab.click();
  }
}
