import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@taxentia.test`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!',
    fullName: 'Test User'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with Get Started button', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveTitle(/Taxentia/);

    // Check for key landing page elements - look for the main hero heading
    await expect(page.getByRole('heading', { name: /authoritative tax guidance/i })).toBeVisible();
  });

  test('should navigate to auth page and show login form by default', async ({ page }) => {
    // Navigate to auth page by clicking Get Started button
    const getStartedButton = page.getByRole('button', { name: /get started|start free trial/i }).first();
    await getStartedButton.click();

    // Should be on auth page
    await expect(page).toHaveURL(/\/auth/);

    // Should show login form by default - check for the "Welcome Back" heading
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // Go to auth page
    await page.goto('/auth');

    // Switch to signup form
    const signUpLink = page.getByRole('button', { name: /sign up/i });
    await signUpLink.click();

    // Verify we're on the signup form - check for "Create Account" text
    await expect(page.getByText(/create account/i).first()).toBeVisible();

    // Fill out registration form using placeholders
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('your_username').fill(testUser.username);
    await page.getByPlaceholder('John Doe').fill(testUser.fullName);

    // Get password fields by their position
    const passwordFields = page.getByPlaceholder('••••••••');
    await passwordFields.nth(0).fill(testUser.password); // First password field
    await passwordFields.nth(1).fill(testUser.password); // Confirm password field

    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard or main app after successful registration
    await expect(page).toHaveURL(/\/(dashboard|queries|app)/);

    // User should be logged in - check for user menu or logout button
    await expect(page.getByText(testUser.username).or(page.getByText(testUser.fullName))).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/auth');

    // Switch to signup
    await page.getByRole('button', { name: /sign up/i }).click();

    // Try to submit with empty fields
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message
    await expect(page.getByText(/required/i)).toBeVisible();

    // Try with password too short
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/^password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password length error
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    // Try with mismatched passwords
    await page.getByLabel(/^password$/i).fill('ValidPass123!');
    await page.getByLabel(/confirm password/i).fill('DifferentPass123!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should allow user to log out and log back in', async ({ page }) => {
    // First register a user
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/username/i).fill(testUser.username);
    await page.getByLabel(/full name/i).fill(testUser.fullName);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for successful login
    await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    await logoutButton.click();

    // Should redirect to landing or auth page
    await expect(page).toHaveURL(/\/(|auth)/);

    // Now try to log back in
    await page.goto('/auth');

    // Should show login form
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();

    // Fill in login credentials
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be logged back in
    await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });
    await expect(page.getByText(testUser.username).or(page.getByText(testUser.fullName))).toBeVisible();
  });

  test('should persist session across page refreshes', async ({ page }) => {
    // Register and login
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/username/i).fill(testUser.username);
    await page.getByLabel(/full name/i).fill(testUser.fullName);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });

    // Refresh the page
    await page.reload();

    // User should still be logged in
    await expect(page).toHaveURL(/\/(dashboard|queries|app)/);
    await expect(page.getByText(testUser.username).or(page.getByText(testUser.fullName))).toBeVisible();
  });

  test('should log out and log in multiple times', async ({ page }) => {
    // Register user
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/username/i).fill(testUser.username);
    await page.getByLabel(/full name/i).fill(testUser.fullName);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });

    // Test multiple logout/login cycles
    for (let i = 0; i < 3; i++) {
      // Logout
      await page.getByRole('button', { name: /log out|sign out/i }).click();
      await expect(page).toHaveURL(/\/(|auth)/);

      // Login again
      await page.goto('/auth');
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should be logged in
      await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });
      await expect(page.getByText(testUser.username).or(page.getByText(testUser.fullName))).toBeVisible();
    }
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/auth');

    // Try to login with non-existent user
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should prevent duplicate username registration', async ({ page }) => {
    // Register first user
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/username/i).fill(testUser.username);
    await page.getByLabel(/full name/i).fill(testUser.fullName);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|queries|app)/, { timeout: 5000 });

    // Logout
    await page.getByRole('button', { name: /log out|sign out/i }).click();

    // Try to register again with same username but different email
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(`different-${testUser.email}`);
    await page.getByLabel(/username/i).fill(testUser.username); // Same username
    await page.getByLabel(/full name/i).fill(testUser.fullName);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error about duplicate username
    await expect(page.getByText(/username.*already|already.*username|exists/i)).toBeVisible();
  });
});
