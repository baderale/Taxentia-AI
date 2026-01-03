import { test, expect } from '@playwright/test';

test.describe('Taxentia UI/UX Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Homepage loads and displays key elements', async ({ page }) => {
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('Test responsive - mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/02-mobile-375.png', fullPage: true });
  });

  test('Test responsive - tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/03-tablet-768.png', fullPage: true });
  });

  test('Test responsive - desktop 1920px', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/04-desktop-1920.png', fullPage: true });
  });

  test('Test keyboard navigation', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    await page.screenshot({ path: 'test-results/05-keyboard-nav.png' });
  });

  test('Check semantic HTML', async ({ page }) => {
    const info = await page.evaluate(() => ({
      hasMain: !!document.querySelector('main'),
      hasHeader: !!document.querySelector('header'),
      hasNav: !!document.querySelector('nav'),
      hasFooter: !!document.querySelector('footer'),
      h1Count: document.querySelectorAll('h1').length
    }));
    console.log('Semantic HTML:', info);
  });
});
