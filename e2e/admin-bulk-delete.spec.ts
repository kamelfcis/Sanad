import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { join } from 'path';
import { readFileSync } from 'fs';
import { loadTestUsers, waitForAdminReady, getCookiesHeader, BASE_URL } from './helpers';

const ADMIN_AUTH = join(process.cwd(), 'e2e', '.auth', 'admin.json');

/**
 * Bulk delete has no bulk endpoint — the toolbar loops the existing per-id
 * DELETE. These specs use throwaway hero slides and service categories, the two
 * admin lists whose rows can be created and destroyed without touching seeded
 * accounts or booking history.
 *
 * The two lists delete differently on purpose, and the specs pin both:
 *   - hero slides  -> hard delete, the row disappears
 *   - categories   -> soft delete (is_active = false), the row stays and greys out
 */

/** Marks every row these specs create, so leftovers are identifiable and sweepable. */
const MARKER = 'e2e-bulk';

interface Throwaway {
  id: string;
  title: string;
}

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

function readEnvLocal(key: string): string | undefined {
  let raw: string;
  try {
    raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  } catch {
    return undefined;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0 || trimmed.slice(0, eq).trim() !== key) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return undefined;
}

/**
 * Hard-deletes a throwaway row straight through PostgREST.
 *
 * Teardown only. The admin category endpoint soft-deletes by design, so without
 * this every run would leave its inactive test rows in the categories list
 * forever. Scoped to ids these specs created themselves.
 */
async function purgeRow(request: APIRequestContext, table: string, id: string) {
  const url = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = readEnvLocal('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return;

  await request
    .delete(`${url}/rest/v1/${table}?id=eq.${id}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    })
    .catch(() => undefined);
}

// ---------------------------------------------------------------- hero slides

async function createSlide(
  request: APIRequestContext,
  cookies: string,
  index: number,
): Promise<Throwaway> {
  const title = `${MARKER}-slide-${Date.now()}-${index}`;
  const res = await request.post(`${BASE_URL}/api/admin/hero-slides`, {
    headers: { Cookie: cookies, 'Content-Type': 'application/json' },
    data: {
      image_url: `https://example.com/${MARKER}-${index}.jpg`,
      title_ar: title,
      subtitle_ar: 'شريحة اختبار مؤقتة',
      icon_key: 'wrench',
      is_active: false,
    },
  });
  expect(res.ok(), `slide create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return { id: (await res.json()).id, title };
}

async function listSlideIds(request: APIRequestContext, cookies: string): Promise<string[]> {
  const res = await request.get(`${BASE_URL}/api/admin/hero-slides`, {
    headers: { Cookie: cookies },
  });
  if (!res.ok()) throw new Error(`slide list failed: ${res.status()}`);
  const body = await res.json();
  const slides = Array.isArray(body) ? body : (body.slides ?? body.heroSlides ?? []);
  return slides.map((s: { id: string }) => s.id);
}

// ----------------------------------------------------------------- categories

async function createCategory(
  request: APIRequestContext,
  cookies: string,
  index: number,
): Promise<Throwaway> {
  // Sorted first by the list's `ORDER BY name_ar`, so the row lands on page 1.
  const title = `0000-${MARKER}-${Date.now()}-${index}`;
  const res = await request.post(`${BASE_URL}/api/admin/categories`, {
    headers: { Cookie: cookies, 'Content-Type': 'application/json' },
    data: {
      name_ar: title,
      name_en: `E2E bulk ${index}`,
      slug: `${MARKER}-${Date.now()}-${index}`,
      description: 'Temporary row created by admin-bulk-delete.spec.ts',
      icon: 'wrench',
      icon_type: 'preset',
      is_active: true,
    },
  });
  expect(res.ok(), `category create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return { id: (await res.json()).id, title };
}

async function getCategory(
  request: APIRequestContext,
  cookies: string,
  id: string,
): Promise<{ id: string; is_active: boolean } | undefined> {
  const res = await request.get(`${BASE_URL}/api/admin/categories?page=1&limit=100`, {
    headers: { Cookie: cookies },
  });
  if (!res.ok()) throw new Error(`category list failed: ${res.status()}`);
  const body = await res.json();
  return body.categories.find((c: { id: string }) => c.id === id);
}

// ------------------------------------------------------------------- fixtures

/**
 * Rows created during a test, torn down even when setup itself throws — a failed
 * create mid-batch used to leave the earlier rows behind and pollute later runs.
 */
type Tracker = {
  slide: (index: number) => Promise<Throwaway>;
  category: (index: number) => Promise<Throwaway>;
};

async function withThrowaways(
  request: APIRequestContext,
  cookies: string,
  body: (make: Tracker) => Promise<void>,
) {
  const slides: string[] = [];
  const categories: string[] = [];

  try {
    await body({
      slide: async (index) => {
        const created = await createSlide(request, cookies, index);
        slides.push(created.id);
        return created;
      },
      category: async (index) => {
        const created = await createCategory(request, cookies, index);
        categories.push(created.id);
        return created;
      },
    });
  } finally {
    for (const id of slides) {
      await request
        .delete(`${BASE_URL}/api/admin/hero-slides/${id}`, { headers: { Cookie: cookies } })
        .catch(() => undefined);
      await purgeRow(request, 'hero_slides', id);
    }
    // The admin endpoint only soft-deletes categories, so the row has to be
    // removed directly or it would linger in the list after every run.
    for (const id of categories) await purgeRow(request, 'service_categories', id);
  }
}

/** Opens a list and waits for the given rows to be on screen. */
async function gotoList(page: Page, path: string, ids: string[]) {
  await page.goto(path);
  await waitForAdminReady(page);
  for (const id of ids) {
    await expect(
      page.getByTestId(`admin-select-${id}`),
      `row ${id} is not visible on ${path}`,
    ).toBeVisible({ timeout: 60_000 });
  }
}

// ----------------------------------------------------------------------------

test.describe('Admin bulk selection', () => {
  test.use({ storageState: ADMIN_AUTH });

  test('selecting rows reveals the toolbar and clearing hides it again', async ({
    page,
    context,
    request,
  }) => {
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const a = await make.slide(1);
      const b = await make.slide(2);

      const errors = trackPageErrors(page);
      await gotoList(page, '/admin/hero-slides', [a.id, b.id]);

      // Nothing selected: the toolbar must not occupy space at all.
      await expect(page.getByTestId('admin-bulk-toolbar')).toHaveCount(0);

      await page.getByTestId(`admin-select-${a.id}`).click();
      await expect(page.getByTestId('admin-bulk-toolbar')).toBeVisible();
      await expect(page.getByTestId('admin-bulk-count')).toContainText('1');

      await page.getByTestId(`admin-select-${b.id}`).click();
      await expect(page.getByTestId('admin-bulk-count')).toContainText('2');

      // A partial selection must read as indeterminate, never as "all selected".
      await expect(page.getByTestId('admin-select-all')).toHaveAttribute(
        'data-state',
        'indeterminate',
      );

      await page.getByTestId('admin-bulk-clear').click();
      await expect(page.getByTestId('admin-bulk-toolbar')).toHaveCount(0);
      await expect(page.getByTestId(`admin-select-${a.id}`)).toHaveAttribute(
        'data-state',
        'unchecked',
      );

      expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
    });
  });

  test('select-all checks every row on the page and toggles back off', async ({
    page,
    context,
    request,
  }) => {
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const a = await make.slide(1);
      await gotoList(page, '/admin/hero-slides', [a.id]);

      const rowBoxes = page.getByTestId(/^admin-select-[0-9a-f-]{36}$/);
      const rowCount = await rowBoxes.count();
      expect(rowCount).toBeGreaterThan(0);

      await page.getByTestId('admin-select-all').click();
      await expect(page.getByTestId('admin-select-all')).toHaveAttribute('data-state', 'checked');
      await expect(page.getByTestId('admin-bulk-count')).toContainText(String(rowCount));
      await expect(page.getByTestId(`admin-select-${a.id}`)).toHaveAttribute(
        'data-state',
        'checked',
      );

      await page.getByTestId('admin-select-all').click();
      await expect(page.getByTestId('admin-bulk-toolbar')).toHaveCount(0);
    });
  });
});

test.describe('Admin bulk delete', () => {
  test.use({ storageState: ADMIN_AUTH });

  test('cancelling the confirm dialog deletes nothing', async ({ page, context, request }) => {
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const a = await make.slide(1);
      await gotoList(page, '/admin/hero-slides', [a.id]);

      await page.getByTestId(`admin-select-${a.id}`).click();
      await page.getByTestId('admin-bulk-delete').click();

      const dialog = page.getByTestId('admin-bulk-delete-dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /إلغاء|cancel/i }).click();
      await expect(dialog).toHaveCount(0);

      // Still selected, and still in the database.
      await expect(page.getByTestId('admin-bulk-count')).toContainText('1');
      expect(await listSlideIds(request, cookies)).toContain(a.id);
    });
  });

  test('confirming removes only the selected rows and audits each one', async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(150_000);
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const doomed = [await make.slide(1), await make.slide(2)];
      const survivor = await make.slide(3);

      const errors = trackPageErrors(page);
      await gotoList(
        page,
        '/admin/hero-slides',
        [...doomed, survivor].map((s) => s.id),
      );

      for (const s of doomed) await page.getByTestId(`admin-select-${s.id}`).click();
      await expect(page.getByTestId('admin-bulk-count')).toContainText('2');

      await page.getByTestId('admin-bulk-delete').click();
      const dialog = page.getByTestId('admin-bulk-delete-dialog');
      await expect(dialog).toBeVisible();
      // The dialog names the batch size, so a misclick on "select all" is visible
      // before it is irreversible.
      await expect(dialog).toContainText('2');

      await page.getByTestId('admin-moderation-confirm').click();

      // Rows disappear from the list, the survivor stays, toolbar resets.
      for (const s of doomed) {
        await expect(page.getByTestId(`admin-select-${s.id}`)).toHaveCount(0, { timeout: 60_000 });
      }
      await expect(page.getByTestId(`admin-select-${survivor.id}`)).toBeVisible();
      await expect(page.getByTestId('admin-bulk-toolbar')).toHaveCount(0);

      // The database agrees.
      const remaining = await listSlideIds(request, cookies);
      for (const s of doomed) expect(remaining).not.toContain(s.id);
      expect(remaining).toContain(survivor.id);

      // Each id went through its own endpoint, so each wrote its own audit row.
      const logs = await request.get(
        `${BASE_URL}/api/admin/audit-logs?entity_type=hero_slide&limit=50`,
        { headers: { Cookie: cookies } },
      );
      expect(logs.ok()).toBeTruthy();
      const entries = (await logs.json()).logs as { action: string; entity_id: string | null }[];
      for (const s of doomed) {
        expect(
          entries.some((l) => l.action === 'hero_slide_delete' && l.entity_id === s.id),
          `no hero_slide_delete audit entry for ${s.id}`,
        ).toBeTruthy();
      }

      expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
    });
  });

  test('the single-row delete button reuses the same confirm dialog', async ({
    page,
    context,
    request,
  }) => {
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const a = await make.slide(1);
      await gotoList(page, '/admin/hero-slides', [a.id]);

      // The row delete no longer uses window.confirm — it opens the batch dialog
      // with a batch of one, so a stray native dialog would hang the test.
      const row = page.locator('tr', { has: page.getByTestId(`admin-select-${a.id}`) });
      await row.getByRole('button', { name: /حذف|delete/i }).click();

      const dialog = page.getByTestId('admin-bulk-delete-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('1');

      await page.getByTestId('admin-moderation-confirm').click();
      await expect(page.getByTestId(`admin-select-${a.id}`)).toHaveCount(0, { timeout: 60_000 });
      expect(await listSlideIds(request, cookies)).not.toContain(a.id);
    });
  });

  // Categories deliberately soft-delete, so the bulk toolbar must not be read as
  // "the rows go away" there. Pinned so a later switch to a hard delete — or a
  // list that starts hiding inactive rows — is a deliberate change, not a
  // surprise.
  test('a category bulk delete deactivates the rows instead of removing them', async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(150_000);
    const cookies = await getCookiesHeader(context);

    await withThrowaways(request, cookies, async (make) => {
      const doomed = [await make.category(1), await make.category(2)];

      await gotoList(
        page,
        '/admin/categories',
        doomed.map((c) => c.id),
      );
      for (const c of doomed) {
        expect((await getCategory(request, cookies, c.id))?.is_active).toBe(true);
      }

      for (const c of doomed) await page.getByTestId(`admin-select-${c.id}`).click();
      await page.getByTestId('admin-bulk-delete').click();
      await expect(page.getByTestId('admin-bulk-delete-dialog')).toBeVisible();
      await page.getByTestId('admin-moderation-confirm').click();

      // Toolbar clears, so the admin sees the batch completed.
      await expect(page.getByTestId('admin-bulk-toolbar')).toHaveCount(0, { timeout: 60_000 });

      // The rows stay on screen — they are only marked inactive.
      for (const c of doomed) {
        await expect(page.getByTestId(`admin-select-${c.id}`)).toBeVisible();
        expect(
          (await getCategory(request, cookies, c.id))?.is_active,
          `category ${c.id} should be soft-deleted, not removed`,
        ).toBe(false);
      }
    });
  });
});

test.describe('Admin bulk delete guards protected accounts', () => {
  test.use({ storageState: ADMIN_AUTH });

  // The customers and technicians lists opt protected rows out of selection so a
  // batch can never contain an account the server would refuse anyway.
  test('the acting admin cannot be selected on the customers list', async ({ page }) => {
    const users = loadTestUsers();
    await page.goto('/admin/customers');
    await waitForAdminReady(page);

    const adminBox = page.getByTestId(`admin-select-${users.admin.id}`);
    // The admin only appears here if the list includes admin-role profiles.
    test.skip((await adminBox.count()) === 0, 'the acting admin is not listed under customers');
    await expect(adminBox).toBeDisabled();
  });

  test('select-all on the technicians list never selects a protected row', async ({ page }) => {
    await page.goto('/admin/technicians');
    await waitForAdminReady(page);

    const boxes = page.getByTestId(/^admin-select-[0-9a-f-]{36}$/);
    await expect(boxes.first()).toBeVisible({ timeout: 60_000 });

    const total = await boxes.count();
    let disabled = 0;
    for (let i = 0; i < total; i++) {
      if (await boxes.nth(i).isDisabled()) disabled++;
    }
    test.skip(disabled === total, 'every technician on this page is protected');

    await page.getByTestId('admin-select-all').click();
    await expect(page.getByTestId('admin-bulk-count')).toContainText(String(total - disabled));

    // Every disabled row must still be unchecked after select-all.
    for (let i = 0; i < total; i++) {
      const box = boxes.nth(i);
      if (await box.isDisabled()) {
        await expect(box).toHaveAttribute('data-state', 'unchecked');
      }
    }

    await page.getByTestId('admin-bulk-clear').click();
  });
});
