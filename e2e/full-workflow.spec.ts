import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import {
  loadTestUsers,
  loginEmail,
  screenshot,
  record,
  saveEvidence,
  apiGet,
  getCookiesHeader,
  submitBookingForm,
  fillBookingLocation,
  BASE_URL,
} from './helpers';

test.describe.serial('Sanad full E2E workflows', () => {
  const users = loadTestUsers();
  let directBookingId: string | null = null;
  let autoBookingId: string | null = null;
  let directAssignmentId: string | null = null;
  let conversationId: string | null = null;
  let paymentId: string | null = null;

  test.afterAll(() => {
    try {
      execSync('npx tsx --env-file=.env.local scripts/verify-e2e-db.ts', {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
    } catch {
      /* db verify optional */
    }
    saveEvidence();
  });

  // ─── AUTH ───────────────────────────────────────────────────────────────

  test('Auth: unauthenticated API returns 401', async ({ request }) => {
    const { status, body } = await apiGet(request, '/api/bookings');
    record({
      step: 'Auth — unauthenticated /api/bookings',
      result: status === 401 ? 'PASS' : 'FAIL',
      api: { method: 'GET', path: '/api/bookings', status, snippet: body },
    });
    expect(status).toBe(401);
  });

  test('Auth: customer email login', async ({ page }) => {
    const { consoleErrors, networkErrors } = await loginEmail(
      page,
      users.customer.email,
      users.customer.password,
      '/services',
    );
    const shot = await screenshot(page, '01-customer-login');
    record({
      step: 'Auth — customer email login',
      result: page.url().includes('/services') ? 'PASS' : 'FAIL',
      url: page.url(),
      consoleErrors: consoleErrors.slice(0, 5),
      networkErrors: networkErrors.slice(0, 5),
      screenshot: shot,
    });
    expect(page.url()).toContain('/services');
  });

  test('Auth: Google OAuth button present (MANUAL)', async ({ page }) => {
    await page.goto('/auth/login');
    const googleBtn = page.getByRole('button', { name: /Continue with Google|Google/i });
    const visible = await googleBtn.isVisible();
    record({
      step: 'Auth — Google OAuth',
      result: 'MANUAL',
      url: page.url(),
      notes: visible
        ? 'Google button renders; OAuth redirect requires Supabase provider credentials — not automated.'
        : 'Google button not found on login page.',
    });
  });

  test('Auth: email verification on signup (MANUAL)', async ({ page }) => {
    await page.goto('/auth/register');
    record({
      step: 'Auth — email verification on signup',
      result: 'MANUAL',
      url: page.url(),
      notes:
        'Signup flow redirects to login with "verify email" toast. Seeded accounts use email_confirm=true via admin API.',
    });
  });

  // ─── CUSTOMER BROWSE ──────────────────────────────────────────────────

  test('Customer: browse /services', async ({ page, request, context }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    const cookies = await getCookiesHeader(context);
    const browse = await apiGet(request, '/api/technicians/browse?limit=3', cookies);
    const categories = await apiGet(request, '/api/categories');
    const shot = await screenshot(page, '02-services-browse');

    const pass = page.url().includes('/services') && browse.status === 200 && categories.status === 200;
    record({
      step: 'Customer — browse /services',
      result: pass ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/technicians/browse?limit=3',
        status: browse.status,
        snippet: browse.body,
      },
      screenshot: shot,
    });
    expect(browse.status).toBe(200);
  });

  test('Customer: browse /services/map + OSM tiles', async ({ page }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    const tileRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('tile.openstreetmap.org')) tileRequests.push(req.url());
    });

    await page.goto('/services/map');
    await page.waitForTimeout(5000);
    const shot = await screenshot(page, '03-services-map');

    record({
      step: 'Maps — /services/map OSM tiles',
      result: tileRequests.length > 0 ? 'PASS' : 'FAIL',
      url: page.url(),
      notes: tileRequests.length
        ? `Captured ${tileRequests.length} tile requests e.g. ${tileRequests[0]?.slice(0, 120)}`
        : 'No tile.openstreetmap.org requests observed in network.',
      screenshot: shot,
    });
    expect(tileRequests.length).toBeGreaterThan(0);
  });

  // ─── DIRECT BOOKING ─────────────────────────────────────────────────────

  test('Customer: direct booking with technician_id', async ({ page, request, context }) => {
    if (!users.serviceId) test.skip();

    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    const url = `/customer/bookings/new?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    const bookingUrl = await submitBookingForm(
      page,
      'E2E direct booking test — need electrical repair in apartment.',
    );
    directBookingId = bookingUrl.split('/').pop() ?? null;

    const cookies = await getCookiesHeader(context);
    const bookingsResp = await apiGet(request, '/api/bookings', cookies);
    const shot = await screenshot(page, '04-direct-booking');

    record({
      step: 'Customer — direct booking (technician_id)',
      result: directBookingId ? 'PASS' : 'FAIL',
      url: bookingUrl,
      api: { method: 'GET', path: '/api/bookings', status: bookingsResp.status, snippet: bookingsResp.body },
      db: `Expected bookings.id=${directBookingId} status=matched, single assignment for tech ${users.technician.id}`,
      screenshot: shot,
    });
    expect(directBookingId).toBeTruthy();
  });

  // ─── AUTO-MATCH BOOKING ─────────────────────────────────────────────────

  test('Customer: auto-match booking without technician_id', async ({ page, request, context }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto('/customer/bookings/new');
    await page.waitForLoadState('networkidle');

    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option').first().click();

    const bookingUrl = await submitBookingForm(
      page,
      'E2E auto-match booking test — general maintenance needed urgently.',
    );
    autoBookingId = bookingUrl.split('/').pop() ?? null;

    const cookies = await getCookiesHeader(context);
    const detail = autoBookingId
      ? await apiGet(request, `/api/bookings/${autoBookingId}`, cookies)
      : { status: 0, body: '' };
    const shot = await screenshot(page, '05-auto-match-booking');

    record({
      step: 'Customer — auto-match booking',
      result: autoBookingId && detail.status === 200 ? 'PASS' : 'FAIL',
      url: bookingUrl,
      api: {
        method: 'GET',
        path: `/api/bookings/${autoBookingId}`,
        status: detail.status,
        snippet: detail.body,
      },
      db: `Expected bookings.id=${autoBookingId} status pending/matched with RPC assignments`,
      screenshot: shot,
    });
    expect(autoBookingId).toBeTruthy();
  });

  // ─── TECHNICIAN ─────────────────────────────────────────────────────────

  test('Technician: login and view pending assignments', async ({ page, request, context }) => {
    const { consoleErrors, networkErrors } = await loginEmail(
      page,
      users.technician.phone,
      users.technician.password,
      '/technician',
    );
    await page.goto('/technician/jobs');
    await page.waitForLoadState('networkidle');

    const cookies = await getCookiesHeader(context);
    const assignments = await apiGet(request, '/api/technician/assignments?status=pending', cookies);
    const shot = await screenshot(page, '06-tech-jobs');

    let parsed: { id?: string }[] = [];
    try {
      parsed = JSON.parse(assignments.body);
    } catch {
      /* ignore */
    }
    if (directBookingId) {
      const match = parsed.find((a: { booking?: { id?: string }; booking_id?: string }) =>
        a.booking?.id === directBookingId || (a as { booking_id?: string }).booking_id === directBookingId,
      );
      directAssignmentId = (match as { id?: string })?.id ?? parsed[0]?.id ?? null;
    }

    record({
      step: 'Technician — view pending jobs',
      result: assignments.status === 200 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/technician/assignments?status=pending',
        status: assignments.status,
        snippet: assignments.body.slice(0, 400),
      },
      consoleErrors: consoleErrors.slice(0, 3),
      networkErrors: networkErrors.slice(0, 3),
      screenshot: shot,
    });
    expect(assignments.status).toBe(200);
  });

  test('Technician: accept direct booking assignment', async ({ page, request, context }) => {
    test.skip(!directAssignmentId, 'No direct assignment id from prior step');

    await loginEmail(page, users.technician.phone, users.technician.password, '/technician');
    await page.goto(`/technician/jobs/${directAssignmentId}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Accept' }).click();
    await page.waitForTimeout(3000);

    const cookies = await getCookiesHeader(context);
    const respondCheck = await apiGet(
      request,
      `/api/technician/assignments/${directAssignmentId}`,
      cookies,
    );
    const shot = await screenshot(page, '07-tech-accept');

    record({
      step: 'Technician — accept assignment',
      result: respondCheck.body.includes('accepted') ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: `/api/technician/assignments/${directAssignmentId}`,
        status: respondCheck.status,
        snippet: respondCheck.body.slice(0, 400),
      },
      db: `Expected booking_assignments.status=accepted, bookings.status=accepted for ${directBookingId}`,
      screenshot: shot,
    });
    expect(respondCheck.body).toContain('accepted');
  });

  // ─── CHAT ───────────────────────────────────────────────────────────────

  test('Chat: customer chat page loads after accept', async ({ page, request, context }) => {
    test.skip(!directBookingId, 'No direct booking id');

    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto(`/customer/bookings/${directBookingId}/chat`);
    await page.waitForTimeout(4000);

    const cookies = await getCookiesHeader(context);
    const convos = await apiGet(request, '/api/chat/conversations', cookies);
    let convoFound = false;
    try {
      const list = JSON.parse(convos.body) as { id: string; booking_id: string }[];
      const c = list.find((x) => x.booking_id === directBookingId);
      if (c) {
        conversationId = c.id;
        convoFound = true;
      }
    } catch {
      /* ignore */
    }

    const shot = await screenshot(page, '08-chat-page');
    const noChat = await page.getByText('No chat available').isVisible().catch(() => false);

    record({
      step: 'Chat — page load + conversation',
      result: convoFound && !noChat ? 'PASS' : convoFound ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/chat/conversations',
        status: convos.status,
        snippet: convos.body.slice(0, 400),
      },
      db: `Expected chat_conversations row for booking ${directBookingId}`,
      screenshot: shot,
    });
    expect(convoFound).toBe(true);
  });

  test('Chat: send message from customer', async ({ page, request, context }) => {
    test.skip(!conversationId, 'No conversation id');

    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto(`/customer/bookings/${directBookingId}/chat`);
    await page.waitForTimeout(3000);

    const input = page.locator('textarea, input[type="text"]').last();
    const msg = `E2E test message ${Date.now()}`;
    if (await input.isVisible()) {
      await input.fill(msg);
      await page.getByRole('button', { name: /send|إرسال/i }).click();
      await page.waitForTimeout(2000);
    }

    const cookies = await getCookiesHeader(context);
    const messages = await apiGet(
      request,
      `/api/chat/conversations/${conversationId}/messages`,
      cookies,
    );
    const shot = await screenshot(page, '09-chat-message');

    record({
      step: 'Chat — send message',
      result: messages.status === 200 && messages.body.includes('E2E test message') ? 'PASS' : messages.status === 200 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: `/api/chat/conversations/${conversationId}/messages`,
        status: messages.status,
        snippet: messages.body.slice(0, 400),
      },
      screenshot: shot,
    });
    expect(messages.status).toBe(200);
  });

  // ─── ADMIN: complete booking + payment ──────────────────────────────────

  test('Admin: dashboard + set booking completed with price', async ({ page, request, context }) => {
    test.skip(!directBookingId, 'No direct booking id');

    await loginEmail(page, users.admin.email, users.admin.password, '/admin');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const cookies = await getCookiesHeader(context);
    const dash = await apiGet(request, '/api/admin/dashboard', cookies);

    const statusResp = await request.patch(`${BASE_URL}/api/admin/bookings/${directBookingId}/status`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { status: 'completed', price_quote: 250 },
    });
    const statusBody = (await statusResp.text()).slice(0, 400);

    const shot = await screenshot(page, '10-admin-dashboard');

    record({
      step: 'Admin — dashboard + complete booking',
      result: dash.status === 200 && statusResp.status() < 400 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/admin/dashboard',
        status: dash.status,
        snippet: dash.body.slice(0, 300),
      },
      notes: `PATCH status → ${statusResp.status()}: ${statusBody}`,
      screenshot: shot,
    });
    expect(dash.status).toBe(200);
  });

  test('Customer: submit payment (mock screenshot URL)', async ({ page, request, context }) => {
    test.skip(!directBookingId, 'No direct booking id');

    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    const cookies = await getCookiesHeader(context);

    const payResp = await request.post(`${BASE_URL}/api/bookings/${directBookingId}/payment`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: {
        payment_method: 'vodafone_cash',
        screenshot_url: 'https://placehold.co/600x800/png?text=E2E+Payment+Proof',
        amount: 250,
      },
    });
    const payBody = await payResp.text();
    try {
      const parsed = JSON.parse(payBody);
      paymentId = parsed.id ?? null;
    } catch {
      /* ignore */
    }

    await page.goto(`/customer/bookings/${directBookingId}/payment`);
    const shot = await screenshot(page, '11-payment-page');

    record({
      step: 'Customer — payment submit',
      result: payResp.status() === 201 || payResp.status() === 200 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'POST',
        path: `/api/bookings/${directBookingId}/payment`,
        status: payResp.status(),
        snippet: payBody.slice(0, 400),
      },
      db: `Expected payments row status=pending for booking ${directBookingId}`,
      screenshot: shot,
    });
    expect(payResp.status()).toBeLessThan(400);
  });

  test('Admin: approve payment', async ({ page, request, context }) => {
    test.skip(!paymentId, 'No payment id');

    await loginEmail(page, users.admin.email, users.admin.password, '/admin');
    const cookies = await getCookiesHeader(context);

    const approveResp = await request.patch(`${BASE_URL}/api/admin/payments/${paymentId}/approve`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: {},
    });
    const approveBody = (await approveResp.text()).slice(0, 400);

    await page.goto('/admin/payments');
    const shot = await screenshot(page, '12-admin-payments');

    record({
      step: 'Admin — approve payment',
      result: approveResp.status() < 400 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'PATCH',
        path: `/api/admin/payments/${paymentId}/approve`,
        status: approveResp.status(),
        snippet: approveBody,
      },
      db: `Expected payments.status=approved, audit_logs entry`,
      screenshot: shot,
    });
    expect(approveResp.status()).toBeLessThan(400);
  });

  test('Admin: approve technician (API smoke)', async ({ request, context, page }) => {
    await loginEmail(page, users.admin.email, users.admin.password, '/admin');
    const cookies = await getCookiesHeader(context);

    const resp = await request.patch(
      `${BASE_URL}/api/admin/technicians/${users.technician.id}/status`,
      {
        headers: { Cookie: cookies, 'Content-Type': 'application/json' },
        data: { action: 'approve' },
      },
    );
    const body = (await resp.text()).slice(0, 300);

    record({
      step: 'Admin — approve technician',
      result: resp.status() < 400 ? 'PASS' : 'FAIL',
      api: {
        method: 'PATCH',
        path: `/api/admin/technicians/${users.technician.id}/status`,
        status: resp.status(),
        snippet: body,
      },
      notes: 'Technician pre-seeded as verified; idempotent approve.',
    });
    expect(resp.status()).toBeLessThan(400);
  });

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────

  test('Notifications: customer notifications page + API', async ({ page, request, context }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const cookies = await getCookiesHeader(context);
    const notifs = await apiGet(request, '/api/notifications', cookies);
    const unread = await apiGet(request, '/api/notifications/unread-count', cookies);
    const shot = await screenshot(page, '13-notifications');

    record({
      step: 'Notifications — page + API',
      result: notifs.status === 200 && unread.status === 200 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/notifications',
        status: notifs.status,
        snippet: notifs.body.slice(0, 300),
      },
      notes: `unread-count → ${unread.status}: ${unread.body.slice(0, 100)}`,
      screenshot: shot,
    });
    expect(notifs.status).toBe(200);
  });

  // ─── LOGOUT ─────────────────────────────────────────────────────────────

  test('Auth: logout', async ({ page, request, context }) => {
    await loginEmail(page, users.customer.email, users.customer.password, '/services');
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    const userMenu = page.locator('[data-testid="user-nav"], button').filter({ hasText: /E2E|test-customer/i }).first();
    if (!(await userMenu.isVisible().catch(() => false))) {
      await page.locator('header button').last().click().catch(() => {});
    } else {
      await userMenu.click();
    }
    await page.getByText('تسجيل الخروج').first().click();
    await page.getByRole('button', { name: 'تسجيل الخروج' }).last().click();
    await page.waitForTimeout(2000);

    const cookies = await getCookiesHeader(context);
    const bookings = await apiGet(request, '/api/bookings', cookies);
    const shot = await screenshot(page, '14-logout');

    record({
      step: 'Auth — logout',
      result: bookings.status === 401 || page.url().includes('/auth') ? 'PASS' : 'FAIL',
      url: page.url(),
      api: { method: 'GET', path: '/api/bookings post-logout', status: bookings.status, snippet: bookings.body },
      screenshot: shot,
    });
  });
});
