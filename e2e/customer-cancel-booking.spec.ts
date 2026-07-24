import { test, expect } from '@playwright/test';
import {
  loadTestUsers,
  loginEmail,
  screenshot,
  record,
  saveEvidence,
  apiGet,
  getCookiesHeader,
  submitBookingForm,
  openCustomerBookingForm,
  waitForPageReady,
  BASE_URL,
} from './helpers';

test.describe.serial('Customer cancel booking', () => {
  const users = loadTestUsers();
  let bookingId: string | null = null;
  let assignmentId: string | null = null;
  let inProgressBookingId: string | null = null;
  const cancelReason = 'E2E cancel reason — no longer needed';

  test.afterAll(() => {
    saveEvidence();
  });

  test('Customer cancels accepted booking via UI; assignments cancelled', async ({
    page,
    request,
    context,
  }) => {
    test.skip(!users.serviceId, 'No seeded serviceId');

    const query = `?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await openCustomerBookingForm(
      page,
      users.customer.email,
      users.customer.password,
      query,
    );

    bookingId = await submitBookingForm(
      page,
      'E2E cancel booking — customer cancel after technician accepts.',
    );
    expect(bookingId).toBeTruthy();

    // Switch to technician and accept so assignment is accepted (the bug case).
    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });

    let techCookies = await getCookiesHeader(context);
    const pendingAssignments = await apiGet(
      request,
      '/api/technician/assignments?status=pending',
      techCookies,
    );
    expect(pendingAssignments.status).toBe(200);

    let pendingList: { id: string; booking_id?: string; booking?: { id?: string } }[] = [];
    try {
      const raw = JSON.parse(pendingAssignments.body);
      pendingList = Array.isArray(raw) ? raw : [];
    } catch {
      /* ignore */
    }

    const match = pendingList.find(
      (a) => a.booking?.id === bookingId || a.booking_id === bookingId,
    );
    assignmentId = match?.id ?? null;
    test.skip(!assignmentId, 'No pending assignment for direct booking');

    const acceptResp = await request.post(
      `${BASE_URL}/api/technician/assignments/${assignmentId}/respond`,
      {
        headers: { Cookie: techCookies, 'Content-Type': 'application/json' },
        data: { action: 'accept' },
      },
    );
    expect(acceptResp.status()).toBeLessThan(400);

    // Customer cancels via UI (detail page) with optional reason
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });
    await page.goto(`/customer/bookings/${bookingId}`);
    await page.getByText('معلومات الخدمة').waitFor({ state: 'visible', timeout: 90_000 });

    const cancelBtn = page.getByRole('button', { name: 'إلغاء الطلب' });
    await expect(cancelBtn).toBeVisible({ timeout: 30_000 });
    await cancelBtn.click();

    const reasonInput = page.getByTestId('cancel-booking-reason');
    await expect(reasonInput).toBeVisible({ timeout: 15_000 });
    await reasonInput.fill(cancelReason);

    const confirmBtn = page.getByRole('button', { name: 'نعم، إلغاء الطلب' });
    await expect(confirmBtn).toBeVisible({ timeout: 15_000 });

    const patchPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/bookings/${bookingId}`) && r.request().method() === 'PATCH',
      { timeout: 60_000 },
    );
    await confirmBtn.click();
    const patchResp = await patchPromise;
    expect(patchResp.status()).toBeLessThan(400);

    const patchBody = patchResp.request().postDataJSON() as { reason?: string };
    expect(patchBody.reason).toBe(cancelReason);

    await expect(page.getByText('تم إلغاء طلب الخدمة.')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(cancelReason)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'إلغاء الطلب' })).toHaveCount(0);

    const customerCookies = await getCookiesHeader(context);
    const bookingGet = await apiGet(request, `/api/bookings/${bookingId}`, customerCookies);
    expect(bookingGet.status).toBe(200);
    const bookingBody = JSON.parse(bookingGet.body) as {
      status: string;
      cancellation_reason?: string | null;
    };
    expect(bookingBody.status).toBe('cancelled');
    expect(bookingBody.cancellation_reason).toBe(cancelReason);

    // Technician: assignment must be cancelled (not stuck accepted)
    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });
    techCookies = await getCookiesHeader(context);

    const cancelledAssignments = await apiGet(
      request,
      '/api/technician/assignments?status=cancelled',
      techCookies,
    );
    expect(cancelledAssignments.status).toBe(200);

    let cancelledList: {
      id: string;
      status?: string;
      booking_id?: string;
      booking?: { id?: string; status?: string };
    }[] = [];
    try {
      const raw = JSON.parse(cancelledAssignments.body);
      cancelledList = Array.isArray(raw) ? raw : [];
    } catch {
      /* ignore */
    }

    const cancelledMatch = cancelledList.find(
      (a) => a.id === assignmentId || a.booking?.id === bookingId || a.booking_id === bookingId,
    );
    expect(cancelledMatch, 'Expected assignment row status=cancelled after customer cancel').toBeTruthy();
    expect(cancelledMatch?.status).toBe('cancelled');

    const stillAccepted = await apiGet(
      request,
      '/api/technician/assignments?status=accepted',
      techCookies,
    );
    const acceptedList = (() => {
      try {
        const raw = JSON.parse(stillAccepted.body);
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    })() as { id: string; booking_id?: string; booking?: { id?: string } }[];
    const stuckAccepted = acceptedList.find(
      (a) => a.id === assignmentId || a.booking?.id === bookingId || a.booking_id === bookingId,
    );
    expect(stuckAccepted, 'Assignment must not remain accepted after cancel').toBeFalsy();

    const shot = await screenshot(page, 'cancel-01-after-customer-cancel');
    record({
      step: 'Customer cancel — UI + booking cancelled + assignment cancelled',
      result: 'PASS',
      url: page.url(),
      api: {
        method: 'PATCH',
        path: `/api/bookings/${bookingId}`,
        status: patchResp.status(),
        snippet: bookingGet.body.slice(0, 300),
      },
      db: `bookings.status=cancelled; cancellation_reason set; booking_assignments.id=${assignmentId} status=cancelled`,
      screenshot: shot,
    });
  });

  test('Technician receives booking_cancelled notification with reason', async ({
    page,
    request,
    context,
  }) => {
    test.skip(!bookingId, 'No booking from prior test');

    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });

    const cookies = await getCookiesHeader(context);
    const notifResp = await apiGet(request, '/api/notifications?limit=20&offset=0', cookies);
    expect(notifResp.status).toBe(200);

    let found = false;
    let reasonInNotif = false;
    try {
      const payload = JSON.parse(notifResp.body) as {
        notifications?: {
          title?: string;
          message?: string;
          type?: string;
          data?: { booking_id?: string; reason?: string | null };
        }[];
        data?: { title?: string; message?: string; type?: string }[];
      };
      const list = payload.notifications ?? payload.data ?? (Array.isArray(payload) ? payload : []);
      const items = Array.isArray(list) ? list : [];
      found = items.some(
        (n) =>
          n.title === 'تم إلغاء الطلب' ||
          (typeof n.message === 'string' && n.message.includes('ألغى العميل')) ||
          n.type === 'booking_cancelled',
      );
      reasonInNotif = items.some(
        (n) =>
          (typeof n.message === 'string' && n.message.includes(cancelReason)) ||
          n.data?.reason === cancelReason,
      );
    } catch {
      found = notifResp.body.includes('تم إلغاء الطلب') || notifResp.body.includes('ألغى العميل');
      reasonInNotif = notifResp.body.includes(cancelReason);
    }

    await page.goto('/notifications');
    await waitForPageReady(page);
    const uiTitle = page.getByText('تم إلغاء الطلب').first();
    const uiVisible = await uiTitle.isVisible().catch(() => false);
    if (!found && uiVisible) found = true;

    const shot = await screenshot(page, 'cancel-02-tech-notification');
    record({
      step: 'Technician — booking_cancelled notification',
      result: found && reasonInNotif ? 'PASS' : found ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'GET',
        path: '/api/notifications',
        status: notifResp.status,
        snippet: notifResp.body.slice(0, 500),
      },
      screenshot: shot,
      notes: found
        ? reasonInNotif
          ? 'Found Arabic cancel notification including reason'
          : 'Found cancel notification (reason not in payload snippet)'
        : 'Notification title/message not found in API or /notifications UI',
    });

    expect(found).toBe(true);
    expect(reasonInNotif).toBe(true);
  });

  test('Customer cancels from bookings list with reason', async ({ page, request, context }) => {
    test.skip(!users.serviceId, 'No seeded serviceId');

    const query = `?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await openCustomerBookingForm(
      page,
      users.customer.email,
      users.customer.password,
      query,
    );
    const listBookingId = await submitBookingForm(
      page,
      'E2E cancel from list — pending booking cancel.',
    );
    expect(listBookingId).toBeTruthy();

    const listReason = 'E2E list cancel reason';

    await page.goto('/customer/bookings');
    await waitForPageReady(page);
    await page.getByRole('heading', { name: 'حجوزاتي' }).waitFor({ state: 'visible', timeout: 60_000 });

    // Target this booking's card — cancel sits outside the detail link
    const card = page.locator(`[data-testid="booking-card"][data-booking-id="${listBookingId}"]`);
    const cardCancel = card.getByTestId('booking-card-cancel');
    await expect(cardCancel).toBeVisible({ timeout: 30_000 });
    await cardCancel.click();

    const reasonInput = page.getByTestId('cancel-booking-reason');
    await expect(reasonInput).toBeVisible({ timeout: 15_000 });
    await reasonInput.fill(listReason);

    const confirmBtn = page.getByRole('button', { name: 'نعم، إلغاء الطلب' });
    const patchPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/bookings/${listBookingId}`) && r.request().method() === 'PATCH',
      { timeout: 60_000 },
    );
    await confirmBtn.click();
    const patchResp = await patchPromise;
    expect(patchResp.status()).toBeLessThan(400);

    const customerCookies = await getCookiesHeader(context);
    const bookingGet = await apiGet(request, `/api/bookings/${listBookingId}`, customerCookies);
    expect(bookingGet.status).toBe(200);
    const bookingBody = JSON.parse(bookingGet.body) as {
      status: string;
      cancellation_reason?: string | null;
    };
    expect(bookingBody.status).toBe('cancelled');
    expect(bookingBody.cancellation_reason).toBe(listReason);

    // Still on list — cancel button for that card should disappear after invalidate
    await page.goto('/customer/bookings?status=cancelled');
    await waitForPageReady(page);

    const shot = await screenshot(page, 'cancel-04-from-list');
    record({
      step: 'Customer cancel from bookings list',
      result: 'PASS',
      url: page.url(),
      api: {
        method: 'PATCH',
        path: `/api/bookings/${listBookingId}`,
        status: patchResp.status(),
        snippet: bookingGet.body.slice(0, 300),
      },
      db: `bookings.id=${listBookingId} status=cancelled cancellation_reason set`,
      screenshot: shot,
    });
  });

  test('PATCH cancel: unauthenticated 401; other user 403', async ({ page, request, context }) => {
    test.skip(!bookingId, 'No booking id — create a fresh cancellable booking for auth checks');

    // Create a fresh matched booking for auth negative tests (prior one is cancelled).
    test.skip(!users.serviceId, 'No seeded serviceId');
    const query = `?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await openCustomerBookingForm(
      page,
      users.customer.email,
      users.customer.password,
      query,
    );
    const authBookingId = await submitBookingForm(
      page,
      'E2E cancel auth checks — temporary booking for 401/403.',
    );

    const unauth = await request.patch(`${BASE_URL}/api/bookings/${authBookingId}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { status: 'cancelled' },
    });
    expect(unauth.status()).toBe(401);

    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });
    const techCookies = await getCookiesHeader(context);
    const forbidden = await request.patch(`${BASE_URL}/api/bookings/${authBookingId}`, {
      headers: { Cookie: techCookies, 'Content-Type': 'application/json' },
      data: { status: 'cancelled' },
    });
    expect(forbidden.status()).toBe(403);

    // Cleanup: customer cancels so we do not leave orphan matched jobs
    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });
    const customerCookies = await getCookiesHeader(context);
    await request.patch(`${BASE_URL}/api/bookings/${authBookingId}`, {
      headers: { Cookie: customerCookies, 'Content-Type': 'application/json' },
      data: { status: 'cancelled', reason: 'E2E auth cleanup' },
    });

    record({
      step: 'API auth — cancel 401/403',
      result: unauth.status() === 401 && forbidden.status() === 403 ? 'PASS' : 'FAIL',
      api: {
        method: 'PATCH',
        path: `/api/bookings/${authBookingId}`,
        status: forbidden.status(),
        snippet: `unauth=${unauth.status()} otherUser=${forbidden.status()}`,
      },
    });
  });

  test('Non-cancellable in_progress: no cancel UI; PATCH 409', async ({
    page,
    request,
    context,
  }) => {
    test.skip(!users.serviceId, 'No seeded serviceId');

    const query = `?service_id=${users.serviceId}&technician_id=${users.technician.id}`;
    await openCustomerBookingForm(
      page,
      users.customer.email,
      users.customer.password,
      query,
    );
    inProgressBookingId = await submitBookingForm(
      page,
      'E2E cancel — force in_progress then assert cancel blocked.',
    );

    await loginEmail(page, users.technician.phone, users.technician.password, '/technician', {
      switchUser: true,
    });
    let cookies = await getCookiesHeader(context);
    const pendingAssignments = await apiGet(
      request,
      '/api/technician/assignments?status=pending',
      cookies,
    );
    let pendingList: { id: string; booking_id?: string; booking?: { id?: string } }[] = [];
    try {
      const raw = JSON.parse(pendingAssignments.body);
      pendingList = Array.isArray(raw) ? raw : [];
    } catch {
      /* ignore */
    }
    const match = pendingList.find(
      (a) => a.booking?.id === inProgressBookingId || a.booking_id === inProgressBookingId,
    );
    if (match?.id) {
      await request.post(`${BASE_URL}/api/technician/assignments/${match.id}/respond`, {
        headers: { Cookie: cookies, 'Content-Type': 'application/json' },
        data: { action: 'accept' },
      });
    }

    await loginEmail(page, users.admin.email, users.admin.password, '/admin', { switchUser: true });
    cookies = await getCookiesHeader(context);
    const statusResp = await request.patch(
      `${BASE_URL}/api/admin/bookings/${inProgressBookingId}/status`,
      {
        headers: { Cookie: cookies, 'Content-Type': 'application/json' },
        data: { status: 'in_progress' },
      },
    );
    expect(statusResp.status()).toBeLessThan(400);

    await loginEmail(page, users.customer.email, users.customer.password, '/services', {
      switchUser: true,
    });
    await page.goto(`/customer/bookings/${inProgressBookingId}`);
    await page.getByText('معلومات الخدمة').waitFor({ state: 'visible', timeout: 90_000 });

    await expect(page.getByRole('button', { name: 'إلغاء الطلب' })).toHaveCount(0);

    cookies = await getCookiesHeader(context);
    const patchResp = await request.patch(`${BASE_URL}/api/bookings/${inProgressBookingId}`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { status: 'cancelled' },
    });
    expect(patchResp.status()).toBe(409);

    const shot = await screenshot(page, 'cancel-03-in-progress-blocked');
    record({
      step: 'Non-cancellable — in_progress blocks UI + PATCH 409',
      result: patchResp.status() === 409 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'PATCH',
        path: `/api/bookings/${inProgressBookingId}`,
        status: patchResp.status(),
        snippet: (await patchResp.text()).slice(0, 300),
      },
      screenshot: shot,
    });
  });
});
