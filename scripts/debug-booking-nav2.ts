import { chromium } from '@playwright/test';
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

async function loginEmail(page: import('@playwright/test').Page, email: string, password: string) {
  await page.request.post(`${BASE_URL}/api/auth/signout`, { data: { scope: 'global' } });
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((url) => url.pathname.includes('/services'), { timeout: 60_000 });
  await waitForPageReady(page, 30_000);
}

async function main() {
  const users = loadTestUsers();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const chain: string[] = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) chain.push(new Date().toISOString() + ' ' + f.url());
  });

  await loginEmail(page, users.customer.email, users.customer.password);
  console.log('after login:', page.url());

  await page.goto(`${BASE_URL}${DIRECT_URL}`);
  console.log('after goto:', page.url());

  await page.waitForURL(
    (url) =>
      url.pathname.includes('/customer/bookings/new') &&
      url.searchParams.has('service_id') &&
      url.searchParams.has('technician_id'),
    { timeout: 90_000 },
  );
  console.log('after waitForURL:', page.url());

  await waitForPageReady(page);
  console.log('after waitForPageReady:', page.url());

  await page.waitForTimeout(3000);
  console.log('after 3s:', page.url());
  console.log('has #description:', await page.locator('#description').count());
  await page.waitForSelector('#description', { timeout: 60_000 }).catch(() => {});
  console.log('after wait #description:', await page.locator('#description').count());
  console.log('chain:\n', chain.join('\n'));

  await browser.close();
}

main().catch(console.error);
