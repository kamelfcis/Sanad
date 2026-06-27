import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Page, APIRequestContext, BrowserContext } from '@playwright/test';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
export const SCREENSHOT_DIR = join(process.cwd(), 'docs', 'e2e-screenshots');

export interface TestUsers {
  customer: { id: string; email: string; password: string };
  technician: { id: string; email: string; phone: string; password: string };
  admin: { id: string | null; email: string; password: string };
  serviceId: string | null;
}

export interface StepEvidence {
  step: string;
  result: 'PASS' | 'FAIL' | 'MANUAL';
  url?: string;
  api?: { method: string; path: string; status: number; snippet: string };
  db?: string;
  consoleErrors?: string[];
  networkErrors?: string[];
  screenshot?: string;
  notes?: string;
}

export const evidence: StepEvidence[] = [];

export function loadTestUsers(): TestUsers {
  return JSON.parse(readFileSync(join(process.cwd(), 'e2e', 'test-users.json'), 'utf8'));
}

export function record(step: Partial<StepEvidence> & { step: string; result: StepEvidence['result'] }) {
  evidence.push(step as StepEvidence);
}

export async function waitForPageReady(page: Page, timeoutMs = 20_000) {
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

export async function waitForAdminReady(page: Page, timeoutMs = 90_000) {
  await waitForPageReady(page, timeoutMs);
  await page.getByTestId('admin-language-toggle').waitFor({ state: 'visible', timeout: timeoutMs });
}

async function waitForStableContent(page: Page) {
  const path = new URL(page.url()).pathname;

  if (/^\/customer\/bookings\/[^/]+$/.test(path) && !path.endsWith('/new')) {
    await page
      .getByText('Service Information')
      .waitFor({ state: 'visible', timeout: 90_000 });
    return;
  }

  if (path.startsWith('/customer/bookings/new')) {
    await page.locator('#description').waitFor({ state: 'visible', timeout: 90_000 });
    return;
  }

  if (path.startsWith('/technician/jobs')) {
    await page.getByRole('heading', { name: 'Jobs', exact: true }).waitFor({ state: 'visible', timeout: 90_000 });
    return;
  }

  if (path === '/admin') {
    await page
      .getByRole('heading', { name: /Admin Dashboard|لوحة تحكم الإدارة/ })
      .waitFor({ state: 'visible', timeout: 90_000 });
    return;
  }

  if (path === '/admin/categories') {
    await page
      .getByRole('heading', { name: /Categories|التصنيفات/ })
      .waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (path === '/admin/hero-slides') {
    await page
      .getByRole('heading', { name: /Hero Slides|شرائح الصفحة الرئيسية/ })
      .waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (path === '/') {
    await page.getByTestId('hero-carousel').waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (path.startsWith('/admin/payments')) {
    await page.getByRole('heading', { name: /payment/i }).waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (path.includes('/chat')) {
    await page.locator('textarea, [data-testid="chat-input"], main').first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    return;
  }

  if (path.includes('/payment')) {
    await page.getByRole('button', { name: /submit|إرسال|دفع/i }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    return;
  }

  if (path === '/notifications') {
    await page.getByRole('heading', { name: /notification|إشعار/i }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    return;
  }

  if (path === '/services/map') {
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (path === '/services') {
    await page
      .getByRole('button', { name: /احجز مع هذا الفني|Book with/i })
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  await page.locator('main h1, main h2').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
}

export async function screenshot(page: Page, name: string): Promise<string> {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const file = join(SCREENSHOT_DIR, `${name}.png`);
  await waitForPageReady(page);
  await waitForStableContent(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: file, fullPage: true });
  return file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
}

/** Screenshot without strict page-content waits (detail pages, chat threads). */
export async function screenshotQuick(page: Page, name: string): Promise<string> {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const file = join(SCREENSHOT_DIR, `${name}.png`);
  await waitForPageReady(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: file, fullPage: true });
  return file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
}

export async function logoutSession(page: Page) {
  await page.request.post(`${BASE_URL}/api/auth/signout`, {
    data: { scope: 'global' },
  });
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
}

export async function loginEmail(
  page: Page,
  email: string,
  password: string,
  expectedPathPart: string,
  options?: { switchUser?: boolean },
): Promise<{ consoleErrors: string[]; networkErrors: string[] }> {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  if (options?.switchUser) {
    await logoutSession(page);
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (resp) => {
    if (resp.status() >= 400 && resp.url().includes('/api/')) {
      networkErrors.push(`${resp.status()} ${resp.url()}`);
    }
  });

  await page.goto('/auth/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((url) => url.pathname.includes(expectedPathPart), { timeout: 60_000 });
  await waitForPageReady(page, 30_000);

  return { consoleErrors, networkErrors };
}

export async function apiGet(
  request: APIRequestContext,
  path: string,
  cookies?: string,
): Promise<{ status: number; body: string }> {
  const headers: Record<string, string> = {};
  if (cookies) headers.Cookie = cookies;
  const resp = await request.get(`${BASE_URL}${path}`, { headers });
  const body = await resp.text();
  return { status: resp.status(), body };
}

export async function getCookiesHeader(context: BrowserContext): Promise<string> {
  const cookies = await context.cookies();
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

export function saveRunState(state: Record<string, string | null>) {
  writeFileSync(join(process.cwd(), 'e2e', 'run-state.json'), JSON.stringify(state, null, 2));
}

export function loadRunState(): Record<string, string | null> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'e2e', 'run-state.json'), 'utf8'));
  } catch {
    return {};
  }
}

export function saveEvidence() {
  writeFileSync(join(process.cwd(), 'e2e', 'evidence.json'), JSON.stringify(evidence, null, 2));
}

export async function fillBookingLocation(page: Page) {
  const addressInput = page.locator('#location_address');
  await addressInput.fill('مدينة نصر، القاهرة، مصر');
  const search = page.locator('#location_search');
  if (await search.isVisible()) {
    await search.fill('مدينة نصر القاهرة');
    await page.getByRole('button', { name: 'بحث' }).click();
    await page.waitForTimeout(1500);
  }
  if ((await addressInput.inputValue()).length < 5) {
    await addressInput.fill('15 شارع مصطفى النحاس، مدينة نصر، القاهرة');
  }
}

export async function openCustomerBookingForm(
  page: Page,
  email: string,
  password: string,
  query: string,
): Promise<void> {
  const target = `/customer/bookings/new${query}`;
  await page.goto(target);

  if (page.url().includes('/auth/login')) {
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL((url) => url.pathname.includes('/customer/bookings/new'), {
      timeout: 90_000,
    });
  }

  await page.waitForSelector('#description', { timeout: 90_000 });
}

export async function submitBookingForm(page: Page, description: string) {
  await page.locator('#description').fill(description);
  await fillBookingLocation(page);

  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/bookings') && r.request().method() === 'POST',
    { timeout: 90_000 },
  );

  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  const response = await responsePromise;
  const body = await response.json();

  if (response.status() >= 400) {
    throw new Error(`Booking failed: ${response.status()} ${JSON.stringify(body)}`);
  }

  const bookingId = body.id as string;
  await page.goto(`/customer/bookings/${bookingId}`);
  await page.waitForURL(
    (url) => url.pathname === `/customer/bookings/${bookingId}`,
    { timeout: 30_000 },
  );
  await page.getByText('Service Information').waitFor({ state: 'visible', timeout: 90_000 });
  return bookingId;
}
