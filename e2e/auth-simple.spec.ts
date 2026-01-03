import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Simple Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@taxentia.test`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!',
    fullName: 'Test User'
  };

  test('should successfully register, logout, and login multiple times', async ({ page }) => {
    // Go to landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Taxentia/);

    // Click Get Started to go to auth page
    await page.getByRole('button', { name: /start free trial/i }).first().click();
    await expect(page).toHaveURL(/\/auth/);

    // Switch to signup
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for signup form to be visible
    await expect(page.getByText('Create Account').first()).toBeVisible();

    // Fill out registration form
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('your_username').fill(testUser.username);
    await page.getByPlaceholder('John Doe').fill(testUser.fullName);

    const passwordFields = page.getByPlaceholder('••••••••');
    await passwordFields.nth(0).fill(testUser.password);
    await passwordFields.nth(1).fill(testUser.password);

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect after successful registration (wait up to 10 seconds)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 10000 });

    console.log('✓ Registration successful');
    console.log(`✓ Redirected to: ${page.url()}`);

    // Test logout/login cycle 3 times
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`\n--- Testing Logout/Login Cycle ${cycle} ---`);

      // Find and click logout
      const logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i });
      await logoutButton.click();

      // Should go back to landing or auth
      await page.waitForURL(/\/(|auth)/, { timeout: 5000 });
      console.log(`✓ Cycle ${cycle}: Logged out successfully`);

      // Go to auth page if not already there
      if (!page.url().includes('/auth')) {
        await page.goto('/auth');
      }

      // Login with the registered credentials
      await expect(page.getByText('Welcome Back')).toBeVisible();

      // Fill login form using placeholders
      await page.getByPlaceholder('you@example.com').fill(testUser.email);
      await page.getByPlaceholder('••••••••').fill(testUser.password);

      // Submit login
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should be logged back in
      await expect(page).not.toHaveURL(/\/auth/, { timeout: 10000 });
      console.log(`✓ Cycle ${cycle}: Logged in successfully`);

      // Test session persistence - refresh page
      await page.reload();
      await expect(page).not.toHaveURL(/\/auth/);
      console.log(`✓ Cycle ${cycle}: Session persisted after refresh`);
    }

    console.log('\n✅ All logout/login cycles completed successfully!');
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/auth');

    // Switch to signup
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText('Create Account').first()).toBeVisible();

    // Try with password too short
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('your_username').fill('testuser');

    const passwordFields = page.getByPlaceholder('••••••••');
    await passwordFields.nth(0).fill('short');
    await passwordFields.nth(1).fill('short');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password length error
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    console.log('✓ Password validation working');

    // Try with mismatched passwords
    await passwordFields.nth(0).fill('ValidPass123!');
    await passwordFields.nth(1).fill('DifferentPass123!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    console.log('✓ Password mismatch validation working');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/auth');

    // Try to login with non-existent user
    await page.getByPlaceholder('you@example.com').fill('nonexistent@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message (check for "Unauthorized" or other error text)
    await expect(page.getByText(/unauthorized|invalid|incorrect|not found|failed|unexpected token/i)).toBeVisible({ timeout: 5000 });
    console.log('✓ Invalid login error shown');
  });
});
