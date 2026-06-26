import { chromium } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BASE_URL } from '../e2e/helpers';

async function main() {
  const users = JSON.parse(readFileSync(join(process.cwd(), 'e2e/test-users.json'), 'utf8'));
  const url = `/customer/bookings/new?service_id=${users.serviceId}&technician_id=${users.technician.id}`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE_URL });

  await page.request.post(`${BASE_URL}/api/auth/signout`, { data: { scope: 'global' } });
  await page.goto('/auth/login');
  await page.fill('#email', users.customer.email);
  await page.fill('#password', users.customer.password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((u) => u.pathname.includes('/services'), { timeout: 60_000 });
  await page.goto(url);
  await page.waitForTimeout(4000);

  console.log('service visible:', await page.getByText('إصلاح أعطال').isVisible());

  await page.locator('#description').fill('وصف تجريبي للمشكلة الكهربائية في المنزل بالتفصيل');
  await page.locator('#location_address').fill('شارع التحرير، القاهرة، مصر');

  const resPromise = page.waitForResponse(
    (r) => r.url().includes('/api/bookings') && r.request().method() === 'POST',
    { timeout: 20_000 },
  );
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  const res = await resPromise;

  console.log('POST status:', res.status());
  console.log('POST body:', (await res.text()).slice(0, 300));
  console.log('final url:', page.url());

  await browser.close();
}

main().catch(console.error);
