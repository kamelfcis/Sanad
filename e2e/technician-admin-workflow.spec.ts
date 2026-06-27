import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import {
  loadTestUsers,
  loginEmail,
  screenshot,
  record,
  saveEvidence,
  apiGet,
  getCookiesHeader,
  waitForPageReady,
  waitForAdminReady,
  BASE_URL,
} from './helpers';

const adminAuth = path.join(process.cwd(), 'e2e', '.auth', 'admin.json');

test.describe.serial('Technician admin approval + notifications', () => {
  const users = loadTestUsers();

  test.beforeAll(() => {
    execSync('npx tsx --env-file=.env.local scripts/set-e2e-tech-pending.ts', {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  });

  test.afterAll(() => {
    saveEvidence();
  });

  test('Technician: pending login reaches jobs (no complete=1 redirect)', async ({ page }) => {
    const { consoleErrors, networkErrors } = await loginEmail(
      page,
      users.technician.phone,
      users.technician.password,
      '/technician',
    );

    expect(page.url()).not.toContain('complete=1');
    expect(page.url()).toMatch(/\/technician\/(jobs|profile)/);

    const shot = await screenshot(page, 'tech-01-pending-login');
    record({
      step: 'Technician — pending login (complete profile)',
      result: !page.url().includes('complete=1') ? 'PASS' : 'FAIL',
      url: page.url(),
      consoleErrors: consoleErrors.slice(0, 5),
      networkErrors: networkErrors.slice(0, 5),
      screenshot: shot,
    });
  });

  test('Admin: approve pending technician from UI', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: adminAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const page = await context.newPage();

    await page.goto(`/admin/technicians/${users.technician.id}`);
    await waitForAdminReady(page);

    const approveBtn = page.getByRole('button', { name: /Approve|موافقة/i });
    await expect(approveBtn).toBeEnabled({ timeout: 30_000 });

    const patchPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/admin/technicians/${users.technician.id}/status`) &&
        r.request().method() === 'PATCH',
      { timeout: 30_000 },
    );
    await approveBtn.click();
    const patchResp = await patchPromise;
    expect(patchResp.status()).toBeLessThan(400);

    await page.waitForTimeout(1000);
    const shot = await screenshot(page, 'tech-02-admin-approved');

    record({
      step: 'Admin — approve technician (UI)',
      result: patchResp.status() < 400 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'PATCH',
        path: `/api/admin/technicians/${users.technician.id}/status`,
        status: patchResp.status(),
        snippet: (await patchResp.text()).slice(0, 200),
      },
      screenshot: shot,
    });

    await context.close();
  });

  test('Technician: receives approval notification (API + page)', async ({ page, request, context }) => {
    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });

    const cookies = await getCookiesHeader(context);
    const deadline = Date.now() + 45_000;
    let found = false;
    let lastBody = '';

    while (Date.now() < deadline && !found) {
      const notifs = await apiGet(request, '/api/notifications', cookies);
      lastBody = notifs.body;
      if (notifs.status === 200) {
        try {
          const parsed = JSON.parse(notifs.body) as {
            notifications?: { type?: string; title?: string }[];
          };
          const list = parsed.notifications ?? (Array.isArray(parsed) ? parsed : []);
          found = list.some(
            (n) =>
              n.type === 'technician_approved' ||
              (n.title?.includes('موافقة') ?? false) ||
              (n.title?.includes('Approved') ?? false),
          );
        } catch {
          /* retry */
        }
      }
      if (!found) await page.waitForTimeout(2000);
    }

    await page.goto('/notifications');
    await waitForPageReady(page);
    const shot = await screenshot(page, 'tech-03-approval-notification');

    record({
      step: 'Technician — approval notification',
      result: found ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/notifications',
        status: 200,
        snippet: lastBody.slice(0, 400),
      },
      notes: found ? 'technician_approved notification received' : 'Notification not found within 45s',
      screenshot: shot,
    });
    expect(found).toBe(true);
  });

  test('Technician: toggle available for work (no redirect loop)', async ({ page, request, context }) => {
    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });

    await page.goto('/technician/profile');
    await waitForPageReady(page);
    await page.getByText('Available for jobs').waitFor({ state: 'visible', timeout: 60_000 });

    const toggle = page.getByRole('switch').first();
    const wasChecked = await toggle.isChecked();

    const putPromise = page.waitForResponse(
      (r) => r.url().includes('/api/technician/profile') && r.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await toggle.click();
    const putResp = await putPromise;
    expect(putResp.status()).toBeLessThan(400);

    await page.waitForTimeout(800);
    expect(page.url()).not.toContain('complete=1');
    expect(page.url()).toContain('/technician/profile');

    const cookies = await getCookiesHeader(context);
    const profile = await apiGet(request, '/api/technician/profile', cookies);
    const shot = await screenshot(page, 'tech-04-availability-toggle');

    let isAvailable: boolean | null = null;
    try {
      isAvailable = JSON.parse(profile.body).is_available as boolean;
    } catch {
      /* ignore */
    }

    record({
      step: 'Technician — toggle availability',
      result:
        putResp.status() < 400 && isAvailable === !wasChecked && !page.url().includes('complete=1')
          ? 'PASS'
          : 'FAIL',
      url: page.url(),
      api: {
        method: 'PUT',
        path: '/api/technician/profile',
        status: putResp.status(),
        snippet: profile.body.slice(0, 200),
      },
      notes: `was=${wasChecked}, now=${isAvailable}`,
      screenshot: shot,
    });

    expect(putResp.status()).toBeLessThan(400);
    expect(isAvailable).toBe(!wasChecked);
  });

  test('Customer: verified technician appears in browse', async ({ page, request, context }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });
    await page.goto('/services');
    await waitForPageReady(page);

    const cookies = await getCookiesHeader(context);
    const browse = await apiGet(request, '/api/technicians/browse?limit=20', cookies);
    const includesTech = browse.body.includes(users.technician.id);
    const shot = await screenshot(page, 'tech-05-customer-browse');

    record({
      step: 'Customer — browse shows approved technician',
      result: browse.status === 200 && includesTech ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/technicians/browse',
        status: browse.status,
        snippet: browse.body.slice(0, 300),
      },
      screenshot: shot,
    });

    expect(browse.status).toBe(200);
    expect(includesTech).toBe(true);
  });
});
