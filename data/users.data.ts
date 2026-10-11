import type { AccountInformation, LoginCredentials, SignupCredentials } from '../types/user.types';

export const invalidCredentials: LoginCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
};

export const malformedEmailCredentials: LoginCredentials = {
  email: 'notanemail',
  password: 'wrongpassword',
};

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Seattle', 'Denver', 'Boston'];
const STATES = ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Washington', 'Colorado'];
const COUNTRIES = ['United States', 'Canada', 'Australia', 'India', 'Israel', 'New Zealand', 'Singapore'];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) result += randomInt(0, 9);
  return result;
}

export function createSignupUser(): SignupCredentials {
  const unique = `${Date.now()}${randomInt(1000, 9999)}`;

  return {
    name: randomItem(FIRST_NAMES),
    email: `testuser+${unique}@example.com`,
  };
}

export function createAccountInformation(): AccountInformation {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);

  return {
    title: randomItem(['Mr', 'Mrs']),
    password: `Pass${randomDigits(6)}`,
    day: String(randomInt(1, 28)),
    month: String(randomInt(1, 12)),
    year: String(randomInt(1970, 2005)),
    newsletter: Math.random() < 0.5,
    specialOffers: Math.random() < 0.5,
    firstName,
    lastName,
    company: `${lastName} Inc`,
    address: `${randomInt(1, 9999)} ${randomItem(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])} Street`,
    address2: `Apt ${randomInt(1, 200)}`,
    country: randomItem(COUNTRIES),
    state: randomItem(STATES),
    city: randomItem(CITIES),
    zipcode: randomDigits(5),
    mobileNumber: randomDigits(10),
  };
}
