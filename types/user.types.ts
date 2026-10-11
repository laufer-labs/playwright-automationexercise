export interface User {
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
}

export type Title = 'Mr' | 'Mrs';

export interface AccountInformation {
  title?: Title;
  password: string;
  day?: string;
  month?: string;
  year?: string;
  newsletter?: boolean;
  specialOffers?: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  address2?: string;
  country?: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}
