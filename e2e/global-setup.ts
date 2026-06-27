import { execSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

async function saveAuthState(
  baseURL: string,
  authDir: string,
  file: string,
  email: string,
  password: string,
  expectedPathPart: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, locale: 'ar-EG' });
  const page = await context.newPage();

  await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('#email').waitFor({ state: 'visible', timeout: 120_000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL((url) => url.pathname.includes(expectedPathPart), { timeout: 120_000 });

  await context.storageState({ path: path.join(authDir, file) });
  await browser.close();
}

export default async function globalSetup() {
  const root = process.cwd();
  execSync('npx tsx --env-file=.env.local scripts/seed-e2e-users.ts', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  const users = JSON.parse(readFileSync(path.join(root, 'e2e', 'test-users.json'), 'utf8'));
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const authDir = path.join(root, 'e2e', '.auth');
  mkdirSync(authDir, { recursive: true });

  await saveAuthState(baseURL, authDir, 'admin.json', users.admin.email, users.admin.password, '/admin');
  await saveAuthState(
    baseURL,
    authDir,
    'technician.json',
    users.technician.phone,
    users.technician.password,
    '/technician',
  );
  await saveAuthState(
    baseURL,
    authDir,
    'customer.json',
    users.customer.email,
    users.customer.password,
    '/services',
  );
}
