import { test, expect } from '@playwright/test';
import { loadTestUsers, loginEmail, screenshot, waitForPageReady } from './helpers';

test.describe('Hero slides', () => {
  const users = loadTestUsers();

  test('Home page shows hero carousel with slide content', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    await expect(page.getByTestId('hero-carousel')).toBeVisible();
    await expect(page.getByTestId('hero-slide-title')).toBeVisible();
    await expect(page.getByTestId('hero-slide-subtitle')).toContainText('خدمة احترافية');

    const title = await page.getByTestId('hero-slide-title').textContent();
    expect(title?.trim().length).toBeGreaterThan(0);

    await screenshot(page, 'hero-home');
  });

  test('Admin can view hero slides management', async ({ page }) => {
    await loginEmail(page, users.admin.email, users.admin.password, '/admin');
    await page.goto('/admin/hero-slides');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Hero Slides' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Slide/i })).toBeVisible();

    await screenshot(page, 'hero-admin');
  });
});
