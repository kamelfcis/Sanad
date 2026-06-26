import { chromium } from '@playwright/test';

async function main() {
  const DIRECT =
    'http://localhost:3000/customer/bookings/new?service_id=64a17c1e-c5c3-4dd0-921e-dc73ca64e81b&technician_id=75fa181f-0c59-4f5f-90d5-9c8fc5e71756';
  const BASE = 'http://localhost:3000';

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const chain: string[] = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) chain.push(f.url());
  });

  // simulate switchUser logout
  await page.request.post(`${BASE}/api/auth/signout`, { data: { scope: 'global' } });
  await page.goto(`${BASE}/auth/login`);

  await page.fill('#email', 'test-customer@sanad.app');
  await page.fill('#password', 'TestCustomer2025!');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((u) => u.pathname.includes('/services'), { timeout: 60_000 });
  console.log('logged in:', page.url());

  await page.goto(`${BASE}${DIRECT.replace(BASE, '')}`);
  await page.waitForTimeout(8000);
  console.log('final:', page.url());
  console.log('chain:\n', chain.join('\n'));

  await browser.close();
}

main().catch(console.error);
