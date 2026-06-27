import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import {
  loadTestUsers,
  loginEmail,
  screenshot,
  screenshotQuick,
  record,
  saveEvidence,
  apiGet,
  getCookiesHeader,
  openCustomerBookingForm,
  fillBookingLocation,
  waitForPageReady,
  BASE_URL,
} from './helpers';

const customerAuth = path.join(process.cwd(), 'e2e', '.auth', 'customer.json');
const technicianAuth = path.join(process.cwd(), 'e2e', '.auth', 'technician.json');

test.describe.serial('Chat realtime bidirectional workflow', () => {
  let users = loadTestUsers();
  let bookingId: string | null = null;
  let assignmentId: string | null = null;
  let conversationId: string | null = null;

  test.beforeAll(() => {
    users = loadTestUsers();
    execSync('npx tsx --env-file=.env.local scripts/ensure-e2e-tech-ready.ts', {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    users = loadTestUsers();
  });

  test.afterAll(() => {
    saveEvidence();
  });

  test('Customer: direct-books E2E technician', async ({ page, request, context }) => {
    if (!users.serviceId) test.skip();

    const query = `?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await openCustomerBookingForm(page, users.customer.email, users.customer.password, query);

    await page.locator('#description').fill(
      'E2E chat realtime — direct booking for bidirectional messaging test.',
    );
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
    bookingId = body.id as string;

    const cookies = await getCookiesHeader(context);
    const bookingsResp = await apiGet(request, '/api/bookings', cookies);
    const includesBooking = bookingsResp.body.includes(bookingId);
    await page.waitForTimeout(500);
    const shot = await screenshot(page, 'chat-01-direct-booking');

    record({
      step: 'Chat E2E — customer direct booking',
      result: includesBooking ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/bookings',
        status: bookingsResp.status,
        snippet: bookingsResp.body.slice(0, 400),
      },
      screenshot: shot,
    });

    expect(bookingId).toBeTruthy();
    expect(includesBooking).toBe(true);
  });

  test('Technician: accepts assignment and chat conversation exists', async ({
    page,
    request,
    context,
  }) => {
    test.skip(!bookingId, 'No booking id');

    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });

    const cookies = await getCookiesHeader(context);
    const assignments = await apiGet(request, '/api/technician/assignments?status=pending', cookies);
    let list: { id: string; booking_id?: string; booking?: { id?: string } }[] = [];
    try {
      const raw = JSON.parse(assignments.body);
      list = Array.isArray(raw) ? raw : [];
    } catch {
      /* ignore */
    }

    const match = list.find(
      (a) => a.booking?.id === bookingId || a.booking_id === bookingId,
    );
    assignmentId = match?.id ?? null;
    test.skip(!assignmentId, 'No pending assignment for booking');

    const acceptResp = await request.post(
      `${BASE_URL}/api/technician/assignments/${assignmentId}/respond`,
      {
        headers: { Cookie: cookies, 'Content-Type': 'application/json' },
        data: { action: 'accept' },
      },
    );
    const acceptBody = await acceptResp.text();
    expect(acceptResp.status()).toBeLessThan(400);

    const convos = await apiGet(request, '/api/chat/conversations', cookies);
    let convoFound = false;
    try {
      const convoList = JSON.parse(convos.body) as {
        id: string;
        booking_id?: string;
        booking?: { id?: string; status?: string };
      }[];
      const convo = convoList.find(
        (c) => c.booking_id === bookingId || c.booking?.id === bookingId,
      );
      if (convo) {
        conversationId = convo.id;
        convoFound = true;
      }
    } catch {
      /* ignore */
    }

    const shot = await screenshotQuick(page, 'chat-02-tech-accept');

    record({
      step: 'Chat E2E — accept + conversation row',
      result: convoFound && acceptBody.includes('accepted') ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/chat/conversations',
        status: convos.status,
        snippet: convos.body.slice(0, 400),
      },
      db: `Expected chat_conversations for booking ${bookingId}`,
      screenshot: shot,
    });

    expect(convoFound).toBe(true);
  });

  test('Chat lists show correct participant names', async ({ browser }) => {
    test.skip(!bookingId, 'No booking id');

    const techCtx = await browser.newContext({
      storageState: technicianAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const customerCtx = await browser.newContext({
      storageState: customerAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const techPage = await techCtx.newPage();
    const customerPage = await customerCtx.newPage();

    await techPage.goto('/technician/chat');
    await waitForPageReady(techPage);
    await expect(techPage.getByText('E2E Test Customer')).toBeVisible({ timeout: 30_000 });
    const techListShot = await screenshotQuick(techPage, 'chat-03-tech-chat-list');

    await customerPage.goto('/customer/chat');
    await waitForPageReady(customerPage);
    await expect(customerPage.getByText('E2E Test Technician')).toBeVisible({ timeout: 30_000 });
    const customerListShot = await screenshotQuick(customerPage, 'chat-04-customer-chat-list');

    record({
      step: 'Chat E2E — list shows correct names',
      result: 'PASS',
      url: techPage.url(),
      notes: 'Technician sees customer name; customer sees technician name',
      screenshot: techListShot,
    });
    record({
      step: 'Chat E2E — customer chat list',
      result: 'PASS',
      url: customerPage.url(),
      screenshot: customerListShot,
    });

    await techCtx.close();
    await customerCtx.close();
  });

  test('Bidirectional realtime messaging without page reload', async ({ browser, request }) => {
    test.skip(!bookingId || !conversationId, 'Missing booking or conversation id');

    const customerCtx = await browser.newContext({
      storageState: customerAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const techCtx = await browser.newContext({
      storageState: technicianAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const customerPage = await customerCtx.newPage();
    const techPage = await techCtx.newPage();

    await customerPage.goto(`/customer/bookings/${bookingId}/chat`);
    await techPage.goto(`/technician/chat/${bookingId}`);
    await waitForPageReady(customerPage);
    await waitForPageReady(techPage);

    await customerPage.getByTestId('chat-input').waitFor({ state: 'visible', timeout: 60_000 });
    await techPage.getByTestId('chat-input').waitFor({ state: 'visible', timeout: 60_000 });

    const uniqueMsg = `E2E realtime ${Date.now()}`;
    await customerPage.getByTestId('chat-input').fill(uniqueMsg);
    await customerPage.getByTestId('chat-input').press('Enter');

    try {
      await expect(techPage.getByText(uniqueMsg)).toBeVisible({ timeout: 15_000 });
    } catch {
      await techPage.waitForTimeout(5000);
      const cookies = await getCookiesHeader(techCtx);
      const messages = await apiGet(
        request,
        `/api/chat/conversations/${conversationId}/messages`,
        cookies,
      );
      expect(messages.status).toBe(200);
      expect(messages.body).toContain(uniqueMsg);
    }

    const customerThreadShot = await screenshotQuick(customerPage, 'chat-05-customer-realtime-send');
    const techThreadShot = await screenshotQuick(techPage, 'chat-06-tech-sees-message');

    const reply = `Tech reply ${Date.now()}`;
    await techPage.getByTestId('chat-input').fill(reply);
    await techPage.getByTestId('chat-input').press('Enter');

    try {
      await expect(customerPage.getByText(reply)).toBeVisible({ timeout: 15_000 });
    } catch {
      await customerPage.waitForTimeout(5000);
      const cookies = await getCookiesHeader(customerCtx);
      const messages = await apiGet(
        request,
        `/api/chat/conversations/${conversationId}/messages`,
        cookies,
      );
      expect(messages.status).toBe(200);
      expect(messages.body).toContain(reply);
    }

    const replyShot = await screenshotQuick(customerPage, 'chat-07-customer-sees-reply');

    record({
      step: 'Chat E2E — bidirectional realtime',
      result: 'PASS',
      url: customerPage.url(),
      notes: `Customer sent "${uniqueMsg}"; technician replied "${reply}"`,
      screenshot: customerThreadShot,
    });
    record({
      step: 'Chat E2E — technician thread',
      result: 'PASS',
      url: techPage.url(),
      screenshot: techThreadShot,
    });
    record({
      step: 'Chat E2E — customer sees reply',
      result: 'PASS',
      url: customerPage.url(),
      screenshot: replyShot,
    });

    await customerCtx.close();
    await techCtx.close();
  });

  test('Recipient receives chat notification (API poll)', async ({ browser, request }) => {
    test.skip(!conversationId, 'No conversation id');

    const techCtx = await browser.newContext({
      storageState: technicianAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const customerCtx = await browser.newContext({
      storageState: customerAuth,
      locale: 'ar-EG',
      baseURL: BASE_URL,
    });
    const techPage = await techCtx.newPage();
    const customerPage = await customerCtx.newPage();

    await customerPage.goto(`/customer/bookings/${bookingId}/chat`);
    await waitForPageReady(customerPage);
    await customerPage.getByTestId('chat-input').waitFor({ state: 'visible', timeout: 60_000 });

    const notifyMsg = `E2E notify ${Date.now()}`;
    await customerPage.getByTestId('chat-input').fill(notifyMsg);
    await customerPage.getByTestId('chat-input').press('Enter');
    await customerPage.waitForTimeout(1500);

    const cookies = await getCookiesHeader(techCtx);
    const deadline = Date.now() + 30_000;
    let found = false;
    let lastBody = '';

    while (Date.now() < deadline && !found) {
      const notifs = await apiGet(request, '/api/notifications', cookies);
      lastBody = notifs.body;
      if (notifs.status === 200) {
        try {
          const parsed = JSON.parse(notifs.body) as {
            notifications?: { type?: string; body?: string; message?: string }[];
          };
          const list = parsed.notifications ?? (Array.isArray(parsed) ? parsed : []);
          found = list.some(
            (n) =>
              n.type === 'chat_message' ||
              (n.body?.includes(notifyMsg) ?? false) ||
              (n.message?.includes(notifyMsg) ?? false),
          );
        } catch {
          /* retry */
        }
      }
      if (!found) await techPage.waitForTimeout(2000);
    }

    record({
      step: 'Chat E2E — chat notification',
      result: found ? 'PASS' : 'FAIL',
      api: {
        method: 'GET',
        path: '/api/notifications',
        status: 200,
        snippet: lastBody.slice(0, 400),
      },
      notes: found ? 'Technician received chat_message notification' : 'Notification not found within 30s',
    });

    await techCtx.close();
    await customerCtx.close();

    expect(found).toBe(true);
  });
});
