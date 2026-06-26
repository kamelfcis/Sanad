import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { loadTestUsers, loginEmail, BASE_URL, SCREENSHOT_DIR } from './helpers';

const DIRECT_URL =
  '/customer/bookings/new?service_id=64a17c1e-c5c3-4dd0-921e-dc73ca64e81b&technician_id=75fa181f-0c59-4f5f-90d5-9c8fc5e71756';

function isBookingNewUrl(url: URL) {
  return (
    url.pathname.includes('/customer/bookings/new') &&
    url.searchParams.has('service_id') &&
    url.searchParams.has('technician_id')
  );
}

function assertBookingNewUrl(url: string) {
  const parsed = new URL(url);
  const onBookingNew = isBookingNewUrl(parsed);
  const bouncedToServices =
    parsed.pathname === '/services' || parsed.pathname.endsWith('/services');
  const pass = onBookingNew && !bouncedToServices;
  return { pass, onBookingNew, hasService: parsed.searchParams.has('service_id'), hasTechnician: parsed.searchParams.has('technician_id'), bouncedToServices, parsed };
}

async function saveScreenshot(page: import('@playwright/test').Page, filename: string) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const file = join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

test.describe('Book with technician redirect fix', () => {
  const users = loadTestUsers();

  test('services page: click book with technician', async ({ page }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });

    const bookButton = page.getByRole('button', { name: /احجز مع هذا الفني/ }).first();
    await expect(bookButton).toBeVisible({ timeout: 60_000 });

    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('/customer/bookings/new'), { timeout: 90_000 }),
      bookButton.click(),
    ]);
    await page.waitForSelector('#description', { timeout: 90_000 });

    const finalUrl = page.url();
    const check = assertBookingNewUrl(finalUrl);
    const screenshotPath = await saveScreenshot(page, 'book-with-technician-fix.png');

    console.log('TEST:services-book:RESULT=' + (check.pass ? 'PASS' : 'FAIL'));
    console.log('TEST:services-book:URL=' + finalUrl);
    console.log('TEST:services-book:BOUNCE=' + check.bouncedToServices);
    console.log('TEST:services-book:SCREENSHOT=' + screenshotPath);

    expect(check.pass, `Expected /customer/bookings/new with params; got ${finalUrl}`).toBe(true);
  });

  test('direct URL after login', async ({ page }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });

    const bookingLink = page.locator(`a[href="${DIRECT_URL}"]`).first();
    await expect(bookingLink).toBeVisible({ timeout: 60_000 });
    await Promise.all([
      page.waitForURL((url) => isBookingNewUrl(url), { timeout: 90_000 }),
      bookingLink.click(),
    ]);
    await expect(page.locator('#description')).toBeVisible({ timeout: 90_000 });

    const finalUrl = page.url();
    const check = assertBookingNewUrl(finalUrl);
    const screenshotPath = await saveScreenshot(page, 'direct-booking-url-fix.png');

    console.log('TEST:direct-url:RESULT=' + (check.pass ? 'PASS' : 'FAIL'));
    console.log('TEST:direct-url:URL=' + finalUrl);
    console.log('TEST:direct-url:BOUNCE=' + check.bouncedToServices);
    console.log('TEST:direct-url:SCREENSHOT=' + screenshotPath);

    expect(check.pass, `Expected /customer/bookings/new with params; got ${finalUrl}`).toBe(true);
  });

  test('direct URL hard reload after login', async ({ page }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });

    await page.goto(DIRECT_URL);
    await expect(page.locator('#description')).toBeVisible({ timeout: 90_000 });

    const finalUrl = page.url();
    const check = assertBookingNewUrl(finalUrl);
    expect(check.pass, `Expected /customer/bookings/new with params; got ${finalUrl}`).toBe(true);
  });
});
