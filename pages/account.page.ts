import type { Page, Locator } from '@playwright/test';
import type { AccountInformation } from '../types/user.types';

export class AccountPage {
  readonly page: Page;

  // Account Information 
  readonly heading: Locator;
  readonly titleMr: Locator;
  readonly titleMrs: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly daySelect: Locator;
  readonly monthSelect: Locator;
  readonly yearSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly specialOffersCheckbox: Locator;

  // Address Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly addressInput: Locator;
  readonly address2Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;

  readonly createAccountButton: Locator;

  // Account Created confirmation
  readonly accountCreated: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Account Information
    this.heading = page.getByRole('heading', { name: 'Enter Account Information' });
    this.titleMr = page.locator('#id_gender1');
    this.titleMrs = page.locator('#id_gender2');
    this.nameInput = page.locator('[data-qa="name"]');
    this.emailInput = page.locator('[data-qa="email"]');
    this.passwordInput = page.locator('[data-qa="password"]');
    this.daySelect = page.locator('[data-qa="days"]');
    this.monthSelect = page.locator('[data-qa="months"]');
    this.yearSelect = page.locator('[data-qa="years"]');
    this.newsletterCheckbox = page.locator('#newsletter');
    this.specialOffersCheckbox = page.locator('#optin');

    // Address Information
    this.firstNameInput = page.locator('[data-qa="first_name"]');
    this.lastNameInput = page.locator('[data-qa="last_name"]');
    this.companyInput = page.locator('[data-qa="company"]');
    this.addressInput = page.locator('[data-qa="address"]');
    this.address2Input = page.locator('[data-qa="address2"]');
    this.countrySelect = page.locator('[data-qa="country"]');
    this.stateInput = page.locator('[data-qa="state"]');
    this.cityInput = page.locator('[data-qa="city"]');
    this.zipcodeInput = page.locator('[data-qa="zipcode"]');
    this.mobileNumberInput = page.locator('[data-qa="mobile_number"]');

    this.createAccountButton = page.locator('[data-qa="create-account"]');

    // Account Created confirmation
    this.accountCreated = page.locator('[data-qa="account-created"]');
    this.continueButton = page.locator('[data-qa="continue-button"]');
  }

  async fillAccountInformation(info: AccountInformation) {
    if (info.title === 'Mr') {
      await this.titleMr.check();
    } else if (info.title === 'Mrs') {
      await this.titleMrs.check();
    }

    await this.passwordInput.fill(info.password);

    if (info.day) await this.daySelect.selectOption(info.day);
    if (info.month) await this.monthSelect.selectOption(info.month);
    if (info.year) await this.yearSelect.selectOption(info.year);

    if (info.newsletter) await this.newsletterCheckbox.check();
    if (info.specialOffers) await this.specialOffersCheckbox.check();

    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    if (info.company) await this.companyInput.fill(info.company);
    await this.addressInput.fill(info.address);
    if (info.address2) await this.address2Input.fill(info.address2);
    if (info.country) await this.countrySelect.selectOption(info.country);
    await this.stateInput.fill(info.state);
    await this.cityInput.fill(info.city);
    await this.zipcodeInput.fill(info.zipcode);
    await this.mobileNumberInput.fill(info.mobileNumber);
  }

  async createAccount(info: AccountInformation) {
    await this.fillAccountInformation(info);
    await this.createAccountButton.click();
  }

  async continue() {
    await this.continueButton.click();
  }
}
