import type { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly allProductsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.allProductsHeading = page.getByRole('heading', { name: 'All Products' });
  }
}
