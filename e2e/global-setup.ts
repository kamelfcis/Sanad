import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const root = process.cwd();
  execSync('npx tsx --env-file=.env.local scripts/seed-e2e-users.ts', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}
