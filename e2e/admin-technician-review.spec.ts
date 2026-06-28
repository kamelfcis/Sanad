import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import {
  loadTestUsers,
  waitForAdminReady,
  BASE_URL,
} from './helpers';

const adminAuth = path.join(process.cwd(), 'e2e', '.auth', 'admin.json');

test.describe('Admin technician review page', () => {
  const users = loadTestUsers();

  test.beforeAll(() => {
    execSync('npx tsx --env-file=.env.local scripts/set-e2e-tech-pending.ts', {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  });

  test('shows application sections and confirm dialog on approve', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: adminAuth,
      locale: 'en-US',
      baseURL: BASE_URL,
    });
    const page = await context.newPage();

    await page.goto(`/admin/technicians/${users.technician.id}`);
    await waitForAdminReady(page);

    await expect(page.getByRole('heading', { name: /Technician|Unnamed/i })).toBeVisible({
      timeout: 30_000,
    });

    const documentsSection = page.getByTestId('technician-documents-section');
    await expect(documentsSection).toBeVisible();
    await expect(documentsSection.getByText(/Documents|المستندات/i)).toBeVisible();

    await expect(page.getByText(/Application Details|تفاصيل الطلب/i)).toBeVisible();
    await expect(page.getByText(/Skills|المهارات/i).first()).toBeVisible();

    const approveBtn = page.getByRole('button', { name: /Approve|موافقة/i });
    await expect(approveBtn).toBeEnabled({ timeout: 30_000 });
    await approveBtn.click();

    const dialog = page.getByTestId('admin-status-confirm-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Approve technician|الموافقة على الفني/i)).toBeVisible();

    const patchPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/admin/technicians/${users.technician.id}/status`) &&
        r.request().method() === 'PATCH',
      { timeout: 30_000 },
    );

    await page.getByTestId('admin-status-confirm-btn').click();
    const patchResp = await patchPromise;
    expect(patchResp.status()).toBeLessThan(400);

    await expect(dialog).toBeHidden({ timeout: 10_000 });

    await context.close();
  });
});
