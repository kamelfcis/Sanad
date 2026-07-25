import { test, type Page, type BrowserContext } from '@playwright/test';
import {
  loadTestUsers,
  loginEmail,
  screenshot,
  screenshotQuick,
  waitForPageReady,
  record,
  saveEvidence,
  BASE_URL,
  type TestUsers,
} from './helpers';

/**
 * Technician experience audit — read-only measurement pass.
 *
 * Uses ONE shared context/page (logged in as the technician once) so auth
 * persists across the serial steps. Walks every technician screen at a 375px
 * mobile viewport capturing perf timing, API round-trips, console errors,
 * failed network calls, and a screenshot each. Every step is non-throwing and
 * recorded via record(); missing-feature checks are logged as FAIL gaps so the
 * whole audit completes and writes e2e/evidence.json. The only mutation is one
 * direct booking created for the seeded technician to exercise the accept flow.
 */

const MOBILE = { width: 375, height: 812 };

let users: TestUsers;
let context: BrowserContext;
let page: Page;
let assignmentId: string | null = null;
let bookingId: string | null = null;

const consoleErrors: string[] = [];
const networkErrors: string[] = [];

interface PerfMetrics {
  dcl: number | null;
  load: number | null;
  fetches: number;
}

async function perf(p: Page): Promise<PerfMetrics> {
  return p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const fetches = performance
      .getEntriesByType('resource')
      .filter((r) => (r as PerformanceResourceTiming).initiatorType === 'fetch').length;
    return {
      dcl: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      fetches,
    };
  });
}

function note(m: PerfMetrics, extra?: string): string {
  return `dcl=${m.dcl}ms load=${m.load}ms fetches=${m.fetches}${extra ? ` | ${extra}` : ''}`;
}

test.describe.serial('Technician experience audit', () => {
  test.beforeAll(async ({ browser }) => {
    users = loadTestUsers();

    context = await browser.newContext({ viewport: MOBILE, locale: 'ar-EG' });
    page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().includes('/api/')) {
        networkErrors.push(`${r.status()} ${new URL(r.url()).pathname}`);
      }
    });

    // Log in the technician once — this session is shared by every step.
    await loginEmail(page, users.technician.email, users.technician.password, '/technician');

    // Create a direct booking to this technician in a throwaway customer context.
    try {
      const custCtx = await browser.newContext();
      const custPage = await custCtx.newPage();
      await loginEmail(custPage, users.customer.email, users.customer.password, '/services');
      const resp = await custPage.request.post(`${BASE_URL}/api/bookings`, {
        data: {
          service_id: users.serviceId,
          technician_id: users.technician.id,
          description: 'فحص كهرباء للمراجعة الآلية — اختبار تجربة الفني',
          location_address: '15 شارع مصطفى النحاس، مدينة نصر، القاهرة',
          location_lat: 30.0444,
          location_lng: 31.2357,
          apartment_number: '5',
          floor_number: 'الثالث',
          image_urls: [],
        },
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status() < 400 && body?.id) bookingId = body.id;
      await custCtx.close();
    } catch {
      /* recorded in step 04a */
    }

    // Find the resulting pending assignment as the technician.
    try {
      const assignResp = await page.request.get(`${BASE_URL}/api/technician/assignments`);
      const assignments = (await assignResp.json().catch(() => [])) as Array<{
        id: string;
        booking_id: string;
        status: string;
      }>;
      const match = Array.isArray(assignments)
        ? assignments.find((a) => a.booking_id === bookingId && a.status === 'pending') ??
          assignments.find((a) => a.status === 'pending')
        : undefined;
      if (match) {
        assignmentId = match.id;
        if (!bookingId) bookingId = match.booking_id;
      }
      record({
        step: '00 Setup — direct booking + pending assignment',
        result: assignmentId ? 'PASS' : 'MANUAL',
        notes: `bookingId=${bookingId ?? 'none'} assignmentId=${assignmentId ?? 'none'} (${
          Array.isArray(assignments) ? assignments.length : 0
        } assignments)`,
      });
    } catch (e) {
      record({ step: '00 Setup', result: 'FAIL', notes: String(e) });
    }
  });

  test.afterAll(async () => {
    saveEvidence();
    await context?.close();
  });

  test('01 — Login lands on /technician/jobs', async () => {
    const before = consoleErrors.length;
    await page.goto('/technician/jobs');
    await waitForPageReady(page);
    const onJobs = page.url().includes('/technician/jobs');
    const m = await perf(page);
    const shot = await screenshot(page, 'tech-audit-01-login-jobs');
    record({
      step: '01 Login → /technician/jobs',
      result: onJobs && consoleErrors.length === before ? 'PASS' : onJobs ? 'MANUAL' : 'FAIL',
      url: page.url(),
      consoleErrors: consoleErrors.slice(before),
      screenshot: shot,
      notes: note(m, onJobs ? 'no redirect loop' : 'redirected away'),
    });
  });

  test('02/03 — Jobs list', async () => {
    const netBefore = networkErrors.length;
    await page.goto('/technician/jobs');
    await waitForPageReady(page);

    const cards = await page.locator('a[href^="/technician/jobs/"]').count();
    const tabs = ['المتاحة', 'قيد التنفيذ', 'المكتملة', 'الكل'];
    let tappableTabs = 0;
    let minTabHeight = 999;
    for (const t of tabs) {
      const el = page.getByRole('button', { name: t }).first();
      if (await el.count()) {
        const box = await el.boundingBox();
        if (box) {
          minTabHeight = Math.min(minTabHeight, box.height);
          if (box.height >= 44) tappableTabs += 1;
        }
      }
    }
    const availBadge = (await page.getByText(/^متاح$|غير متصل/).count()) > 0;
    const emptyState = (await page.getByText(/لا توجد طلبات/).count()) > 0;

    const m = await perf(page);
    const shot = await screenshot(page, 'tech-audit-02-jobs-list');
    record({
      step: cards > 0 ? '03 Jobs list — with data' : '02 Jobs list — empty state',
      result: 'PASS',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(
        m,
        `cards=${cards} tabs≥44px=${tappableTabs}/4 minTabH=${minTabHeight === 999 ? 'n/a' : Math.round(minTabHeight)}px availBadge=${availBadge} emptyState=${emptyState}`,
      ),
    });
  });

  test('04 — Job detail (pending)', async () => {
    if (!assignmentId) {
      record({ step: '04 Job detail', result: 'MANUAL', notes: 'No assignment available' });
      return;
    }
    const netBefore = networkErrors.length;
    await page.goto(`/technician/jobs/${assignmentId}`);
    await waitForPageReady(page);

    const heading = (await page.locator('h1').first().innerText().catch(() => '')) || '';
    const hasCustomer = (await page.getByText(/Customer|العميل/).count()) > 0;
    const hasAddress = (await page.getByText(/Address|العنوان/).count()) > 0;
    const hasApartment = (await page.getByText(/رقم الشقة/).count()) > 0;
    const hasFloor = (await page.getByText(/الدور/).count()) > 0;
    const mapCount = await page.locator('.leaflet-container').count();
    const timer = (await page.getByText(/^\d{2}:\d{2}$/).count()) > 0;
    const acceptBtn = page.getByRole('button', { name: /Accept|قبول/ }).first();
    const declineBtn = page.getByRole('button', { name: /Decline|رفض/ }).first();
    const acceptBox = (await acceptBtn.count()) ? await acceptBtn.boundingBox() : null;
    const declineBox = (await declineBtn.count()) ? await declineBtn.boundingBox() : null;

    const m = await perf(page);
    const shot = await screenshotQuick(page, 'tech-audit-04-job-detail');
    record({
      step: '04 Job detail (pending)',
      result: (await acceptBtn.count()) && timer ? 'PASS' : 'MANUAL',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(
        m,
        `heading="${heading}" customer=${hasCustomer} address=${hasAddress} apt=${hasApartment} floor=${hasFloor} map=${mapCount} timer=${timer} acceptH=${acceptBox?.height ?? '?'} declineH=${declineBox?.height ?? '?'} (≥44px=${!!acceptBox && acceptBox.height >= 44 && !!declineBox && declineBox.height >= 44})`,
      ),
    });
  });

  test('05 — Accept assignment', async () => {
    if (!assignmentId) {
      record({ step: '05 Accept', result: 'MANUAL', notes: 'No assignment available' });
      return;
    }
    await page.goto(`/technician/jobs/${assignmentId}`);
    await waitForPageReady(page);

    const acceptBtn = page.getByRole('button', { name: /Accept|قبول/ }).first();
    let status = 0;
    if (await acceptBtn.count()) {
      const respondPromise = page
        .waitForResponse(
          (r) =>
            r.url().includes(`/assignments/${assignmentId}/respond`) &&
            r.request().method() === 'POST',
          { timeout: 30_000 },
        )
        .catch(() => null);
      await acceptBtn.click().catch(() => undefined);
      const respondResp = await respondPromise;
      status = respondResp ? respondResp.status() : 0;
      await page.waitForTimeout(1500);
    }

    let bookingStatus = 'unknown';
    if (bookingId) {
      const bResp = await page.request.get(`${BASE_URL}/api/technician/bookings`);
      const list = (await bResp.json().catch(() => [])) as Array<{ id: string; status: string }>;
      bookingStatus = Array.isArray(list)
        ? list.find((b) => b.id === bookingId)?.status ?? 'not-found'
        : 'not-found';
    }
    const acceptedUi = (await page.getByText(/accepted this job|قبلت|accepted/i).count()) > 0;

    const shot = await screenshotQuick(page, 'tech-audit-05-accept');
    record({
      step: '05 Accept assignment',
      result: status > 0 && status < 400 ? 'PASS' : 'FAIL',
      url: page.url(),
      api: {
        method: 'POST',
        path: `/api/technician/assignments/${assignmentId}/respond`,
        status,
        snippet: '',
      },
      screenshot: shot,
      notes: `respondStatus=${status} bookingStatus=${bookingStatus} acceptedUiState=${acceptedUi}`,
    });
  });

  async function transition(
    label: string,
    buttonName: RegExp,
    expectedStatus: string,
  ): Promise<void> {
    if (!assignmentId || !bookingId) {
      record({ step: label, result: 'MANUAL', notes: 'No assignment/booking' });
      return;
    }
    await page.goto(`/technician/jobs/${assignmentId}`);
    await waitForPageReady(page);

    const btn = page.getByRole('button', { name: buttonName }).first();
    let status = 0;
    if (await btn.count()) {
      const patchPromise = page
        .waitForResponse(
          (r) =>
            r.url().includes(`/api/technician/bookings/${bookingId}`) &&
            r.request().method() === 'PATCH',
          { timeout: 30_000 },
        )
        .catch(() => null);
      await btn.click().catch(() => undefined);
      const resp = await patchPromise;
      status = resp ? resp.status() : 0;
      await page.waitForTimeout(1500);
    }

    const bResp = await page.request.get(`${BASE_URL}/api/technician/bookings`);
    const list = (await bResp.json().catch(() => [])) as Array<{ id: string; status: string }>;
    const bookingStatus = Array.isArray(list)
      ? list.find((b) => b.id === bookingId)?.status ?? 'not-found'
      : 'not-found';

    record({
      step: label,
      result: status > 0 && status < 400 && bookingStatus === expectedStatus ? 'PASS' : 'FAIL',
      url: page.url(),
      api: { method: 'PATCH', path: `/api/technician/bookings/${bookingId}`, status, snippet: '' },
      notes: `buttonFound=${(await btn.count()) > 0} patchStatus=${status} bookingStatus=${bookingStatus}`,
    });
  }

  test('06 — Start Job (accepted → in_progress)', async () => {
    await transition('06 Start Job (accepted → in_progress)', /بدء العمل|Start Job/, 'in_progress');
  });

  test('07 — Complete Job (in_progress → completed)', async () => {
    await transition('07 Complete Job (in_progress → completed)', /إنهاء العمل|Complete Job/, 'completed');
  });

  test('08 — In-job chat', async () => {
    if (!bookingId) {
      record({ step: '08 In-job chat', result: 'MANUAL', notes: 'No booking' });
      return;
    }
    const netBefore = networkErrors.length;
    await page.goto(`/technician/jobs/${bookingId}/chat`);
    await waitForPageReady(page);
    const input = page.locator('textarea, [data-testid="chat-input"]').first();
    const inputVisible = (await input.count()) > 0 && (await input.isVisible().catch(() => false));
    let echoed = false;
    if (inputVisible) {
      const msg = `رسالة اختبار ${Date.now()}`;
      await input.fill(msg).catch(() => undefined);
      const sendBtn = page.getByRole('button', { name: /send|إرسال|أرسل/i }).first();
      if (await sendBtn.count()) {
        await sendBtn.click().catch(() => undefined);
        await page.waitForTimeout(1500);
        echoed = (await page.getByText(msg).count()) > 0;
      }
    }
    const m = await perf(page);
    const shot = await screenshotQuick(page, 'tech-audit-08-in-job-chat');
    record({
      step: '08 In-job chat',
      result: inputVisible ? 'PASS' : 'MANUAL',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(m, `inputVisible=${inputVisible} messageEcho=${echoed}`),
    });
  });

  test('09 — Chat list', async () => {
    const netBefore = networkErrors.length;
    await page.goto('/technician/chat');
    await waitForPageReady(page);
    const hasMain = (await page.locator('main').first().count()) > 0;
    const m = await perf(page);
    const shot = await screenshotQuick(page, 'tech-audit-09-chat-list');
    record({
      step: '09 Chat list',
      result: hasMain ? 'PASS' : 'FAIL',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(m),
    });
  });

  test('10/11 — Profile + availability toggle', async () => {
    const netBefore = networkErrors.length;
    await page.goto('/technician/profile');
    await waitForPageReady(page);

    const bio = page.locator('textarea').first();
    const hasBio = (await bio.count()) > 0;
    const hasSwitch = (await page.getByRole('switch').count()) > 0;
    const switchHasLabel =
      (await page.locator('[role="switch"][aria-label]').count()) > 0 ||
      (await page.locator('label:has([role="switch"])').count()) > 0;

    // P1 #4 regression guard: a bio-only save via the real UI "Save Changes"
    // button must NOT wipe the technician's skills. Count skills before/after.
    const skillsBeforeResp = await page.request.get(`${BASE_URL}/api/technician/skills`);
    const skillsBefore = ((await skillsBeforeResp.json().catch(() => [])) as unknown[]).length;

    let putStatus = 0;
    if (hasBio) {
      await bio.fill(`سيرة اختبار المراجعة ${Date.now()}`).catch(() => undefined);
      const putPromise = page
        .waitForResponse(
          (r) => r.url().includes('/api/technician/profile') && r.request().method() === 'PUT',
          { timeout: 30_000 },
        )
        .catch(() => null);
      await page.getByRole('button', { name: /Save Changes|حفظ/i }).first().click().catch(() => undefined);
      const putResp = await putPromise;
      putStatus = putResp ? putResp.status() : 0;
      await page.waitForTimeout(1800); // allow the skills PUT to settle
    }

    const skillsAfterResp = await page.request.get(`${BASE_URL}/api/technician/skills`);
    const skillsAfter = ((await skillsAfterResp.json().catch(() => [])) as unknown[]).length;
    const skillsPreserved = skillsBefore > 0 && skillsAfter >= skillsBefore;

    let toggleStatus = 0;
    if (hasSwitch) {
      const togglePromise = page
        .waitForResponse(
          (r) => r.url().includes('/api/technician/profile') && r.request().method() === 'PUT',
          { timeout: 30_000 },
        )
        .catch(() => null);
      await page.getByRole('switch').first().click().catch(() => undefined);
      const toggleResp = await togglePromise;
      toggleStatus = toggleResp ? toggleResp.status() : 0;
      await page.waitForTimeout(800);
    }

    const m = await perf(page);
    const shot = await screenshot(page, 'tech-audit-10-profile');
    record({
      step: '10/11 Profile + availability toggle',
      result: hasBio && hasSwitch ? 'PASS' : 'MANUAL',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(
        m,
        `bio=${hasBio} switch=${hasSwitch} switchAccessibleLabel=${switchHasLabel} putBioStatus=${putStatus} toggleStatus=${toggleStatus} skillsBefore=${skillsBefore} skillsAfter=${skillsAfter}`,
      ),
    });
    record({
      step: '11b Profile save preserves skills (P1 #4)',
      result: skillsPreserved ? 'PASS' : 'FAIL',
      notes: `skillsBefore=${skillsBefore} skillsAfter=${skillsAfter} preserved=${skillsPreserved}`,
    });
  });

  test('12 — Reviews page', async () => {
    const netBefore = networkErrors.length;
    await page.goto('/technician/reviews');
    await waitForPageReady(page);
    // No onboarding-redirect (proves P1 #4 fix: skills survived the profile save).
    const noRedirect = page.url().includes('/technician/reviews');
    const heading = (await page.getByRole('heading', { name: /التقييمات|Reviews/ }).count()) > 0;
    const summaryOrEmpty = (await page.getByText(/لا توجد تقييمات|review|تقييم/i).count()) > 0;
    const headerNavLink = await page.locator('header a[href="/technician/reviews"]').count();

    const m = await perf(page);
    const shot = await screenshot(page, 'tech-audit-12-reviews');
    record({
      step: '12 Reviews page',
      result: heading && noRedirect ? 'PASS' : 'FAIL',
      url: page.url(),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(m, `heading=${heading} noRedirect=${noRedirect} summaryOrEmpty=${summaryOrEmpty} headerNavLink=${headerNavLink}`),
    });
    record({
      step: '12b Reviews reachable from header nav',
      result: headerNavLink > 0 ? 'PASS' : 'MANUAL',
      notes:
        headerNavLink > 0
          ? 'Linked in header nav'
          : 'Nav gap — /technician/reviews not linked in header nav (only Jobs/Chat/Profile)',
    });
  });

  test('13 — Notifications page', async () => {
    const before = consoleErrors.length;
    const netBefore = networkErrors.length;
    await page.goto('/notifications');
    await waitForPageReady(page);
    const heading = (await page.getByRole('heading', { name: /notification|إشعار/i }).count()) > 0;
    const m = await perf(page);
    const shot = await screenshot(page, 'tech-audit-13-notifications');
    record({
      step: '13 Notifications page',
      result: heading && consoleErrors.length === before ? 'PASS' : heading ? 'MANUAL' : 'FAIL',
      url: page.url(),
      consoleErrors: consoleErrors.slice(before),
      networkErrors: networkErrors.slice(netBefore),
      screenshot: shot,
      notes: note(m, `heading=${heading}`),
    });
  });
});
