import { test, expect } from '@playwright/test';
import { join } from 'path';
import { screenshot, waitForAdminReady, waitForPageReady } from './helpers';

const ADMIN_AUTH = join(process.cwd(), 'e2e', '.auth', 'admin.json');

test.describe('Admin dashboard i18n', () => {
  test.use({ storageState: ADMIN_AUTH });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await waitForAdminReady(page);
  });

  test('default Arabic: RTL sidebar and html lang/dir', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('sanad_admin_locale');
      document.cookie = 'sanad_admin_locale=; path=/admin; max-age=0';
    });
    await page.reload();
    await waitForAdminReady(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await expect(page.getByRole('heading', { name: 'لوحة تحكم الإدارة' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'الحجوزات' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'الإعدادات' })).toBeVisible();

    const shot = await screenshot(page, 'admin-i18n-ar');
    expect(shot).toContain('admin-i18n-ar.png');
  });

  test('toggle English: LTR labels without reload', async ({ page }) => {
    await page.getByTestId('admin-language-toggle').getByRole('button', { name: /English/i }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bookings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

    const shot = await screenshot(page, 'admin-i18n-en');
    expect(shot).toContain('admin-i18n-en.png');
  });

  test('locale preference persists after refresh', async ({ page }) => {
    await page.getByTestId('admin-language-toggle').getByRole('button', { name: /English/i }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.reload();
    await waitForAdminReady(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('sanad_admin_locale'));
    expect(stored).toBe('en');
  });

  test('mobile viewport: sidebar and toggle work', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('sanad_admin_locale');
      document.cookie = 'sanad_admin_locale=; path=/admin; max-age=0';
    });
    await page.reload();
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForAdminReady(page);

    await expect(page.getByRole('heading', { name: 'لوحة تحكم الإدارة' })).toBeVisible();

    const menuBtn = page.locator('header button').first();
    await menuBtn.click();
    await expect(page.getByRole('link', { name: 'الحجوزات' })).toBeVisible();

    await page.getByTestId('admin-mobile-backdrop').click({ position: { x: 20, y: 400 } });
    await expect(page.getByTestId('admin-mobile-backdrop')).not.toBeVisible();

    await page.getByTestId('admin-language-toggle').getByRole('button', { name: /English/i }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('leaving admin restores public ar/rtl', async ({ page }) => {
    await page.getByTestId('admin-language-toggle').getByRole('button', { name: /English/i }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.goto('/');
    await waitForPageReady(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});
