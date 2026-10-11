import type { APIRequestContext } from '@playwright/test';
import type { AccountInformation, LoginCredentials, User } from '../types/user.types';

const CREATE_ACCOUNT_PATH = '/api/createAccount';
const DELETE_ACCOUNT_PATH = '/api/deleteAccount';

function isCleanupSuccess(body: string): boolean {
  return body.includes('Account deleted!') || body.includes('Account not found!');
}

function isMethodError(body: string): boolean {
  return /"responseCode"\s*:\s*405/.test(body) || body.toLowerCase().includes('not supported');
}

async function send(
  request: APIRequestContext,
  credentials: LoginCredentials,
  method: 'delete' | 'post',
): Promise<string> {
  const options = {
    form: {
      email: credentials.email,
      password: credentials.password,
    },
  };

  const response =
    method === 'delete'
      ? await request.delete(DELETE_ACCOUNT_PATH, options)
      : await request.post(DELETE_ACCOUNT_PATH, options);

  return response.text();
}

export async function deleteAccount(request: APIRequestContext, credentials: LoginCredentials): Promise<void> {
  let body = await send(request, credentials, 'delete');

  // Docs specify DELETE. If the server rejects that method, retry the same form as POST.
  if (isMethodError(body)) {
    body = await send(request, credentials, 'post');
  }

  if (!isCleanupSuccess(body)) {
    throw new Error(`Failed to delete account ${credentials.email}: ${body}`);
  }
}

export async function createAccount(request: APIRequestContext, user: User, info: AccountInformation): Promise<void> {
  const response = await request.post(CREATE_ACCOUNT_PATH, {
    form: {
      name: user.name,
      email: user.email,
      password: user.password,
      title: info.title ?? 'Mr',
      birth_date: info.day ?? '',
      birth_month: info.month ?? '',
      birth_year: info.year ?? '',
      firstname: info.firstName,
      lastname: info.lastName,
      company: info.company ?? '',
      address1: info.address,
      address2: info.address2 ?? '',
      country: info.country ?? '',
      zipcode: info.zipcode,
      state: info.state,
      city: info.city,
      mobile_number: info.mobileNumber,
    },
  });

  // The API always answers HTTP 200; the real status is in the JSON body.
  const body = await response.text();
  if (!body.includes('User created!')) {
    throw new Error(`Failed to create account ${user.email}: ${body}`);
  }
}
