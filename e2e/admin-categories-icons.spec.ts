import { test, expect } from '@playwright/test';
import { join } from 'path';
import { waitForAdminReady } from './helpers';

const ADMIN_AUTH = join(process.cwd(), 'e2e', '.auth', 'admin.json');

test.describe('Admin category icons', () => {
  test.use({ storageState: ADMIN_AUTH });

  test('create category with preset snowflake icon and verify in card view', async ({ page }) => {
    const unique = Date.now();
    const slug = `e2e-snowflake-${unique}`;
    const nameEn = `E2E Snowflake ${unique}`;
    const nameAr = `اختبار ثلج ${unique}`;

    await page.goto('/admin/categories');
    await waitForAdminReady(page);

    await expect(page.getByRole('heading', { name: /Categories|التصنيفات/ })).toBeVisible();

    await page.getByTestId('category-add-button').click();
    await expect(page.getByTestId('category-form')).toBeVisible();

    await page.getByTestId('category-name-ar').fill(nameAr);
    await page.getByTestId('category-name-en').fill(nameEn);
    await page.getByTestId('category-slug').fill(slug);

    await expect(page.getByTestId('category-icon-mode-preset')).toBeVisible();
    await page.getByTestId('category-icon-option-snowflake').click();
    await expect(page.getByTestId('category-icon-preview')).toBeVisible();

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/categories') &&
        response.request().method() === 'POST' &&
        response.status() === 201,
      { timeout: 60_000 },
    );

    await page.getByTestId('category-submit').click();
    const response = await createResponse;
    const body = await response.json();
    expect(body.icon).toBe('snowflake');
    expect(body.icon_type).toBe('preset');

    await expect(page.getByTestId('category-form')).not.toBeVisible();

    await page.getByRole('button', { name: /Cards|بطاقات/ }).click();

    await expect(page.getByTestId(`category-card-${slug}`)).toBeVisible({ timeout: 30_000 });

    const card = page.getByTestId(`category-card-${slug}`);
    await expect(card.getByText(nameAr)).toBeVisible();
    await expect(card.locator('[data-category-icon="snowflake"]')).toBeVisible();
  });
});
