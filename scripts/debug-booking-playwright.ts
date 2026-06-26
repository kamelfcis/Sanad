import { chromium, devices } from '@playwright/test';
import { loadTestUsers, BASE_URL } from '../e2e/helpers';

const DIRECT_URL =
  '/customer/bookings/new?service_id=64a17c1e-c5c3-4dd0-921e-dc73ca64e81b&technician_id=75fa181f-0c59-4f5f-90d5-9c8fc5e71756';

async function waitForPageReady(page: import('@playwright/test').Page, timeoutMs = 20_000) {
  await page.waitForLoadState('domcontentloaded');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const busy = await page.locator('[aria-busy="true"][aria-label="Loading"]').count();
    const skeletons = await page.locator('[data-testid="skeleton"]').count();
    if (busy === 0 && skeletons === 0) break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(200);
}

async function customLogin(page: import('@playwright/test').Page, email: string, password: string) {
  await page.request.post(`${BASE_URL}/api/auth/signout`, { data: { scope: 'global' } });
  await page.goto('/auth/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((url) => url.pathname.includes('/services'), { timeout: 60_000 });
  await waitForPageReady(page, 30_000);
}

async function main() {
  const users = loadTestUsers();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: 'http://localhost:3000',
    locale: 'ar-EG',
  });
  const page = await context.newPage();

  await customLogin(page, users.customer.email, users.customer.password);
  console.log('after login:', page.url());

  await page.goto(DIRECT_URL);
  await page.waitForTimeout(15000);
  console.log('after 15s:', page.url());
  console.log('has #description:', await page.locator('#description').count());

  await browser.close();
}

main().catch(console.error);
