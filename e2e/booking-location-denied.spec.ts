import { test, expect } from '@playwright/test';
import { loadTestUsers, loginEmail } from './helpers';

/**
 * Verifies the booking-form location UX degrades correctly when the customer
 * blocks geolocation: the denied Arabic guidance shows, the map stays usable
 * for a manual pin, and the address field remains editable.
 */
test('booking form: denied geolocation keeps map + address usable', async ({ browser }) => {
  const users = loadTestUsers();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    locale: 'ar-EG',
  });

  // Force geolocation to deny (PERMISSION_DENIED) before any page script runs.
  await context.addInitScript(() => {
    const geo = {
      getCurrentPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError);
      },
      watchPosition: () => 0,
      clearWatch: () => {},
    };
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
  });

  const page = await context.newPage();
  await loginEmail(page, users.customer.email, users.customer.password, '/services');
  await page.goto('/customer/bookings/new');
  await page.waitForSelector('#description', { timeout: 90_000 });

  // 1) Denied Arabic guidance is visible.
  await expect(page.getByText('لم يتم السماح بالوصول إلى موقعك.')).toBeVisible();

  // 2) Map remains usable for a manual pin.
  await expect(page.locator('.leaflet-container')).toBeVisible();

  // 3) Address field is still editable.
  const address = page.locator('#location_address');
  await address.fill('15 شارع مصطفى النحاس، مدينة نصر، القاهرة');
  expect(await address.inputValue()).toContain('مدينة نصر');

  await context.close();
});
