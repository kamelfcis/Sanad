import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { loadTestUsers, loginEmail, waitForAdminReady, getCookiesHeader, BASE_URL } from './helpers';

const ADMIN_AUTH = join(process.cwd(), 'e2e', '.auth', 'admin.json');
const CUSTOMER_AUTH = join(process.cwd(), 'e2e', '.auth', 'customer.json');

/** Fails the test if the page throws — the audit-logs crash was a runtime TypeError. */
function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/**
 * Migration 00032 adds profiles.is_blocked and the ON DELETE SET NULL rules.
 * Until it has been applied, the moderation endpoints cannot work, so the
 * specs that depend on it skip with a clear reason instead of failing.
 */


function readEnvLocal(key: string): string {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    if (name !== key) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  throw new Error(`Missing ${key} in .env.local`);
}

async function supabasePasswordSignIn(email: string, password: string) {
  const url = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL');
  const anon = readEnvLocal('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error_code?: string;
    msg?: string;
    access_token?: string;
  };
  return { ok: res.ok, status: res.status, body };
}

async function unblockUserViaApi(
  customerId: string,
  cookies: string,
  request?: APIRequestContext,
) {
  const headers = { Cookie: cookies, 'Content-Type': 'application/json' };
  const data = { blocked: false };
  if (request) {
    const res = await request.patch(`${BASE_URL}/api/admin/users/${customerId}/block`, {
      headers,
      data,
    });
    if (!res.ok()) {
      throw new Error(`unblock failed: ${res.status()} ${JSON.stringify(await res.json())}`);
    }
    return;
  }
  const res = await fetch(`${BASE_URL}/api/admin/users/${customerId}/block`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`unblock failed: ${res.status} ${body}`);
  }
}

/** Login refusal may surface as a toast, middleware redirect, or blocked notice. */
async function assertBlockedCustomerLogin(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(/حظر|banned/i).first()).toBeVisible({ timeout: 20_000 });
}

async function moderationSchemaReady(request: APIRequestContext, cookies: string) {
  const res = await request.get(`${BASE_URL}/api/admin/technicians?page=1`, {
    headers: { Cookie: cookies },
    timeout: 30_000,
  });
  if (!res.ok()) return false;
  const body = await res.json();
  const first = body.technicians?.[0];
  return !!first && 'is_blocked' in first;
}

test.describe('Admin audit logs render with nullable columns', () => {
  test.use({ storageState: ADMIN_AUTH });

  // `hero_slide_reorder` writes audit rows with a NULL entity_id (a reorder has
  // no single entity). Those rows used to crash the page with
  // "Cannot read properties of null (reading 'slice')".
  test('audit-logs table and cards survive a null entity_id', async ({ page }) => {
    const errors = trackPageErrors(page);

    await page.goto('/admin/audit-logs');
    await page.getByTestId('admin-language-toggle').waitFor({ state: 'visible', timeout: 30_000 });

    await expect(page.getByRole('heading', { name: 'سجل التدقيق' })).toBeVisible({
      timeout: 60_000,
    });
    const reorderBadges = page.getByText('إعادة ترتيب الشرائح');
    test.skip(
      (await reorderBadges.count()) === 0,
      'no hero_slide_reorder audit rows in this database',
    );

    // The null entity_id renders as a neutral dash, not an empty code block.
    await expect(page.getByText('—').first()).toBeVisible();

    // Card view exercises the second unguarded call site.
    await page.getByRole('button', { name: 'التبديل إلى عرض البطاقات' }).click();
    await expect(reorderBadges.first()).toBeVisible();

    expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

test.describe('Admin moderation guards', () => {
  test.use({ storageState: ADMIN_AUTH });

  const users = loadTestUsers();

  test('admin cannot delete their own account', async ({ page, context, request }) => {
    await page.goto('/admin');
    await waitForAdminReady(page);
    const cookies = await getCookiesHeader(context);

    const res = await request.delete(`${BASE_URL}/api/admin/users/${users.admin.id}`, {
      headers: { Cookie: cookies },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    // Self-check runs before the role check, so self wins over "is an admin".
    expect(body.error).toBe('ADMIN_MODERATE_SELF_FORBIDDEN');
  });

  test('admin cannot block their own account', async ({ page, context, request }) => {
    await page.goto('/admin');
    await waitForAdminReady(page);
    const cookies = await getCookiesHeader(context);

    const res = await request.patch(`${BASE_URL}/api/admin/users/${users.admin.id}/block`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { blocked: true, reason: 'e2e guard check' },
    });

    expect(res.status()).toBe(403);
    expect((await res.json()).error).toBe('ADMIN_MODERATE_SELF_FORBIDDEN');
  });

  test('non-admin cannot reach the moderation endpoints', async ({ browser }) => {
    const users = loadTestUsers();
    const customerContext = await browser.newContext({ storageState: CUSTOMER_AUTH });
    const cookies = await getCookiesHeader(customerContext);

    const del = await customerContext.request.delete(
      `${BASE_URL}/api/admin/users/${users.technician.id}`,
      { headers: { Cookie: cookies } },
    );
    expect(del.status()).toBe(403);

    const block = await customerContext.request.patch(
      `${BASE_URL}/api/admin/users/${users.technician.id}/block`,
      { headers: { Cookie: cookies, 'Content-Type': 'application/json' }, data: { blocked: true } },
    );
    expect(block.status()).toBe(403);

    await customerContext.close();
  });
});

test.describe('Admin blocking (requires migration 00032)', () => {
  test.use({ storageState: ADMIN_AUTH });

  const users = loadTestUsers();

  test('blocked customer cannot log in, and unblocking restores access', async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByTestId('admin-language-toggle').waitFor({ state: 'visible', timeout: 30_000 });
    const users = loadTestUsers();
    const cookies = await getCookiesHeader(context);

    test.skip(
      !(await moderationSchemaReady(request, cookies)),
      'migration 00032 has not been applied to this database',
    );

    const block = await request.patch(`${BASE_URL}/api/admin/users/${users.customer.id}/block`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { blocked: true, reason: 'e2e block check' },
    });
    expect(block.ok()).toBeTruthy();
    expect((await block.json()).is_blocked).toBe(true);

    const banned = await supabasePasswordSignIn(users.customer.email, users.customer.password);
    expect(banned.ok).toBeFalsy();
    expect(banned.body.error_code === 'user_banned' || /banned/i.test(banned.body.msg ?? '')).toBeTruthy();

    try {
      await unblockUserViaApi(users.customer.id, cookies, request);
    } catch {
      await unblockUserViaApi(users.customer.id, cookies);
    }

    const restored = await supabasePasswordSignIn(users.customer.email, users.customer.password);
    expect(restored.ok).toBeTruthy();
    expect(restored.body.access_token).toBeTruthy();
  });

  test('blocking writes an audit log entry', async ({ page, context, request }) => {
    await page.goto('/admin');
    await waitForAdminReady(page);
    const cookies = await getCookiesHeader(context);

    test.skip(
      !(await moderationSchemaReady(request, cookies)),
      'migration 00032 has not been applied to this database',
    );

    await request.patch(`${BASE_URL}/api/admin/users/${users.customer.id}/block`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { blocked: true, reason: 'e2e audit check' },
    });
    await request.patch(`${BASE_URL}/api/admin/users/${users.customer.id}/block`, {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { blocked: false },
    });

    const logs = await request.get(`${BASE_URL}/api/admin/audit-logs?entity_type=profile`, {
      headers: { Cookie: cookies },
    });
    const body = await logs.json();
    const actions = body.logs.map((l: { action: string }) => l.action);
    expect(actions).toContain('user_block');
    expect(actions).toContain('user_unblock');
  });
});

test.describe('Admin delete (requires migration 00032)', () => {
  test.afterAll(() => {
    execSync('npm run seed:e2e', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
  });
  test.use({ storageState: ADMIN_AUTH });

  const users = loadTestUsers();

  // The FK fix in 00032 turns bookings.technician_id into ON DELETE SET NULL,
  // so a deleted technician leaves the customer's booking history intact.
  test('deleting a technician keeps their past bookings with a null technician_id', async ({
    page,
    context,
    request,
  }) => {
    await page.goto('/admin');
    await waitForAdminReady(page);
    const cookies = await getCookiesHeader(context);

    test.skip(
      !(await moderationSchemaReady(request, cookies)),
      'migration 00032 has not been applied to this database',
    );

    // Find a booking already assigned to the seeded technician. The seed
    // recreates this technician on every run, so the delete is recoverable.
    const before = await request.get(`${BASE_URL}/api/admin/bookings?page=1&limit=50`, {
      headers: { Cookie: cookies },
    });
    const beforeBody = await before.json();
    const assigned = beforeBody.bookings.filter(
      (b: { technician_id: string | null }) => b.technician_id === users.technician.id,
    );
    test.skip(assigned.length === 0, 'no booking is assigned to the seeded technician');
    const bookingId = assigned[0].id;

    const del = await request.delete(`${BASE_URL}/api/admin/users/${users.technician.id}`, {
      headers: { Cookie: cookies },
    });
    expect(
      del.ok(),
      `delete failed: ${del.status()} ${JSON.stringify(await del.json())}`,
    ).toBeTruthy();

    // The booking survives, detached from the deleted technician.
    const after = await request.get(`${BASE_URL}/api/admin/bookings/${bookingId}`, {
      headers: { Cookie: cookies },
    });
    expect(after.ok()).toBeTruthy();
    const booking = await after.json();
    expect(booking.id).toBe(bookingId);
    expect(booking.technician_id).toBeNull();

    // And the deletion is on the record.
    const logs = await request.get(`${BASE_URL}/api/admin/audit-logs?entity_type=profile`, {
      headers: { Cookie: cookies },
    });
    const actions = (await logs.json()).logs.map((l: { action: string }) => l.action);
    expect(actions).toContain('user_delete');

    execSync('npm run seed:e2e', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
  });
});
