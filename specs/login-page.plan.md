# Login Page Test Plan - automationexercise.com/login

## Application Overview

This plan covers the `/login` page of automationexercise.com, which hosts both the "Login to your account" form and the "New User Signup!" form side by side. Scope: the login form (happy path, negative/validation cases, boundary conditions), the signup entry point that lives on this same page, and session/navigation behaviors reachable from this page (logout, re-visiting /login while authenticated, browser back after login).

Key facts confirmed by manual exploration in a real browser session (Chromium):
- Login form fields: `[data-qa="login-email"]` (type=email, required, placeholder "Email Address"), `[data-qa="login-password"]` (type=password, required, placeholder "Password"), `[data-qa="login-button"]` ("Login").
- Signup form fields (same page): `[data-qa="signup-name"]` (type=text, required, placeholder "Name"), `[data-qa="signup-email"]` (type=email, required, placeholder "Email Address"), `[data-qa="signup-button"]` ("Signup").
- Both email fields are native `type="email"` and both email/password/name fields have the HTML5 `required` attribute, and no `maxlength` restriction on either login field.
- Submitting the login form with an empty email and/or empty password does NOT reach the server - the browser blocks submission via native HTML5 validation (`validationMessage` = "Please fill out this field.", `checkValidity()` = false). No custom app error text appears and the page does not navigate.
- Submitting a syntactically invalid email (e.g. "notanemail", missing "@") is also blocked client-side by native HTML5 email-format validation (message like "Please include an '@' in the email address...") - it never reaches the server, so the app's "incorrect" error text is NOT shown in this case.
- Both "wrong password for a registered email" and "unregistered email" produce the identical server-rendered error text: "Your email or password is incorrect!" (a `<p>` inside the login form, matched by the existing `authPage.loginError` locator). The app does not distinguish which field was wrong (expected security behavior - do not assert otherwise).
- Signup with an email that is already registered shows the error text "Email Address already exist!" inside the signup form, and the browser URL changes to `/signup` (page title becomes "Automation Exercise - Signup / Login") even though the visible layout is still the combined login/signup page.
- Signup with a brand-new name+email navigates to `/signup` with page title "Automation Exercise - Signup" and heading "Enter Account Information" (the `AccountPage` form) - this is the successful-advance case, distinguishable from the existing-email case by the page heading/title, not the URL alone.
- Successful login (valid registered email + correct password) redirects to `/` (home) and the header shows a "Logged in as <Name>" link plus a "Logout" link. Pressing Enter while focused in the password field submits the form the same as clicking the Login button.
- Visiting `/logout` (or the header Logout link) while authenticated redirects to `/login`.
- Visiting `/login` directly while already authenticated auto-redirects to `/` (home) - the login form is never shown to a logged-in user.
- Because `/login` redirects logged-in users away, browser "back" after a successful login also lands back on the home/logged-in state rather than exposing a stale login form.
- Browser-level `type="email"` value sanitization strips leading/trailing whitespace from the email field automatically (confirmed via DOM: setting "  user@x.com  " yields value "user@x.com"), so a whitespace-padded valid email still logs in successfully. The password field (type="password") has no such sanitization - leading/trailing spaces are preserved as literal characters, and logging in with a valid password padded with spaces FAILS with the generic "Your email or password is incorrect!" error (confirmed live).
- The valid email is treated case-sensitively by the backend: submitting the registered email fully upper-cased with the correct password FAILS with the generic incorrect-credentials error (confirmed live).
- Neither field has a `maxlength`, so very long strings are accepted by the input UI; expect the same generic incorrect-credentials error server-side (not a crash/hang) since the value won't match any account.

Existing automated coverage (do not duplicate, only restate lightly as a baseline sanity check if needed): `tests/auth/login.spec.ts` already has (1) a test asserting the three login form elements are visible, and (2) a test asserting the error is shown for invalid credentials. New scenarios below focus on what's currently missing.

Fixtures/data available: `authPage` fixture (`fixtures/test.fixture.ts`) wrapping `pages/auth.page.ts`'s `AuthPage` (goto/login/signup helpers + `loginError`/`loggedInAs` locators); `accountPage` fixture (`pages/account.page.ts`) with `heading` = "Enter Account Information"; `data/users.data.ts` exports `validUser`, `loginCredentials`, `invalidCredentials`, and `createSignupUser()` for unique emails. All auth-flow tests run in the `auth` Playwright project, which starts logged out (no storage state), matching the "assume fresh/logged-out state" requirement for every scenario below.

## Test Scenarios

### 1. Happy Path Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Valid credentials log the user in and redirect to home

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login via authPage.goto().
    - expect: The login form (email, password, Login button) is visible; the signup form is also visible on the same page.
  2. Fill the login email field with loginCredentials.email and the password field with loginCredentials.password (the registered validUser), then click the Login button.
    - expect: The browser navigates away from /login to the home page (/).
    - expect: The header shows a 'Logged in as Robert' link (authPage.loggedInAs) and a 'Logout' link.
    - expect: No error message is shown.

#### 1.2. Pressing Enter in the password field submits the login form

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login.
    - expect: Login form is visible.
  2. Fill the email field with the valid registered email, fill the password field with the valid password, then press Enter while focus is in the password field (do not click the Login button).
    - expect: The form submits exactly as if the Login button were clicked.
    - expect: The page redirects to home (/) and the header shows 'Logged in as Robert'.

### 2. Negative Login - Credential Validation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Wrong password for a registered email shows the generic incorrect-credentials error (baseline - already covered by existing spec, restate as smoke check only if consolidating)

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email with the registered validUser email and an incorrect password (e.g. 'WrongPass123'), then click Login.
    - expect: The page stays on /login (no navigation).
    - expect: The error paragraph 'Your email or password is incorrect!' becomes visible inside the login form (authPage.loginError).

#### 2.2. Unregistered email shows the same generic incorrect-credentials error

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email with a syntactically valid but never-registered address (e.g. 'definitely-not-registered-xyz123@example.com') and any password, then click Login.
    - expect: The page stays on /login.
    - expect: The exact same error text 'Your email or password is incorrect!' is shown - the app does not reveal whether the email or password was the problem.

#### 2.3. Submitting with an empty email triggers native HTML5 validation, not a server error

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Leave the email field empty, fill the password field with any value, then click Login.
    - expect: The form is NOT submitted to the server: the page URL remains /login and no navigation/network POST occurs.
    - expect: The email input's native validity is false with validationMessage 'Please fill out this field.' (checkValidity() === false).
    - expect: The custom 'Your email or password is incorrect!' text is NOT rendered.

#### 2.4. Submitting with an empty password triggers native HTML5 validation, not a server error

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email field with a valid-looking address, leave the password field empty, then click Login.
    - expect: Page stays on /login, no server round trip occurs.
    - expect: The password input reports checkValidity() === false with the native 'Please fill out this field.' message.
    - expect: No custom incorrect-credentials error text appears.

#### 2.5. Submitting with both email and password empty triggers native HTML5 validation on the first invalid field

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Leave both email and password empty and click Login.
    - expect: Page stays on /login.
    - expect: The email field (first in tab/DOM order) is reported invalid via checkValidity() === false with the native required-field message; submission is blocked before either field reaches the server.

#### 2.6. Malformed email (missing @) is blocked by native validation, distinct from the server-side incorrect-credentials error

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email field with 'notanemail' (no @ symbol) and the password field with any value, then click Login.
    - expect: Page stays on /login; no navigation occurs and no server request for login is made.
    - expect: The email input's checkValidity() is false and validationMessage mentions the missing '@' (native browser email-format validation), NOT the app's 'Your email or password is incorrect!' text.
    - expect: This distinguishes malformed-email (client-side blocked) from wrong/unregistered credentials (server-side generic error) - assert the specific behavior for each rather than assuming they look the same.

### 3. Signup Entry Point (on the /login page)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Signup with an already-registered email shows 'Email Address already exist!'

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. In the 'New User Signup!' form, fill Name with any value and Email Address with the already-registered validUser.email, then click Signup.
    - expect: The URL changes to /signup and the page title becomes 'Automation Exercise - Signup / Login', but the visible layout is still the combined login/signup page (not the account-information form).
    - expect: The paragraph 'Email Address already exist!' is visible inside the signup form, directly above the Signup button.
    - expect: The previously entered Name and Email values remain populated in the signup fields.

#### 3.2. Signup with a new unique name and email advances to the Enter Account Information page

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Use createSignupUser() (or an equivalent unique-email generator) to get a fresh name+email, fill the signup Name and Email Address fields, then click Signup.
    - expect: The URL becomes /signup with page title 'Automation Exercise - Signup' (no '/ Login' suffix - distinguishing this success path from the existing-email error path).
    - expect: The heading 'Enter Account Information' (accountPage.heading) is visible, confirming the flow advanced past the login page into account creation.
    - expect: No 'Email Address already exist!' error is shown.

### 4. Session and Navigation State

**Seed:** `tests/seed.spec.ts`

#### 4.1. Logging out returns the user to the login page

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login and log in with valid credentials (loginCredentials).
    - expect: Login succeeds; header shows 'Logged in as Robert' and a Logout link.
  2. Click the header 'Logout' link (or navigate to /logout).
    - expect: The browser navigates to /login.
    - expect: The login form (email, password, Login button) is visible again, and the header no longer shows 'Logged in as Robert' - it shows the 'Signup / Login' nav item instead.

#### 4.2. Visiting /login while already authenticated redirects to home

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login and log in with valid credentials so the session is authenticated.
    - expect: User is redirected to home (/) and is logged in.
  2. While still authenticated, navigate directly to /login again (e.g. via page.goto or clicking a link to /login).
    - expect: The app immediately redirects away from /login back to the home page (/); the login form is never rendered to an already-authenticated user.
    - expect: The header still shows 'Logged in as Robert'.

#### 4.3. Browser back navigation after a successful login does not expose a stale login form

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login and log in with valid credentials, landing on home (/).
    - expect: Redirected to home, logged in.
  2. Invoke the browser's back navigation (page.goBack()).
    - expect: Because an authenticated visit to /login auto-redirects to home, back navigation does not show a stale/cached login form - the page settles back on the home page with the logged-in header state intact (Logged in as Robert / Logout visible).

### 5. UI and Accessibility Basics

**Seed:** `tests/seed.spec.ts`

#### 5.1. Password field masks input and email/name fields do not

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Inspect the `type` attribute of the login email field, login password field, signup name field, and signup email field.
    - expect: Login email field has type='email'.
    - expect: Login password field has type='password' (value visually masked).
    - expect: Signup name field has type='text'.
    - expect: Signup email field has type='email'.
    - expect: Typing a value into the password field is not shown in plaintext (input.type stays 'password').

#### 5.2. All login and signup fields are marked required and show correct placeholders

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Check the `required` attribute and `placeholder` text of login-email, login-password, signup-name, and signup-email fields.
    - expect: All four fields report required === true.
    - expect: Placeholders read exactly: 'Email Address' (login email), 'Password' (login password), 'Name' (signup name), 'Email Address' (signup email).

#### 5.3. Tab order moves logically from email to password to the Login button

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Click into the login email field, then press Tab.
    - expect: Focus moves to the login password field.
  2. Press Tab again.
    - expect: Focus moves to the Login button (or the next logical focusable element in the login form) - verify focus does not jump unexpectedly into the signup form fields before the Login button is reachable.

### 6. Boundary and Edge Cases

**Seed:** `tests/seed.spec.ts`

#### 6.1. Leading/trailing whitespace in the email field is auto-trimmed and login still succeeds

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Set the email field's value to the valid registered email padded with leading and trailing spaces (e.g. '  testuser+...@example.com  ') - note the native type=email input sanitizes this automatically, so even a raw DOM value assignment collapses to the trimmed string. Fill the password field with the correct password and click Login.
    - expect: Login succeeds and redirects to home, the same as the untrimmed happy path, because the browser strips the whitespace from the email value before it is ever submitted.

#### 6.2. Leading/trailing whitespace in the password field is preserved and causes login to fail

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email field with the valid registered email. Fill the password field with the correct password padded with leading and trailing spaces (e.g. '  <password>  '), then click Login.
    - expect: Login FAILS: the page stays on /login and shows 'Your email or password is incorrect!' - because password fields are not whitespace-sanitized by the browser, the padded value does not match the stored password.

#### 6.3. Email is case-sensitive - an upper-cased valid email fails login

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email field with the valid registered email fully upper-cased (e.g. 'TESTUSER+...@EXAMPLE.COM') and the correct password, then click Login.
    - expect: Login FAILS with 'Your email or password is incorrect!' shown - the backend treats the email as case-sensitive for this account, so an exact-case mismatch is rejected the same as any other invalid credential.

#### 6.4. Very long input values are accepted by the UI and rejected gracefully by the server

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Start logged out. Navigate to /login. Fill the email field with a very long but syntactically valid email (e.g. 200+ character local-part @example.com) and the password field with a very long string (e.g. 500 characters), then click Login.
    - expect: Neither field truncates the input (there is no maxlength attribute) - the full value is accepted into the input.
    - expect: Submitting reaches the server (values are syntactically valid) and results in the generic 'Your email or password is incorrect!' error rather than a crash, timeout, or unhandled exception.
    - expect: The page remains responsive and stays on /login.
