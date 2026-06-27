export const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type AdminPageSize = (typeof ADMIN_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_ADMIN_PAGE_SIZE: AdminPageSize = 25;

export function parseAdminPageSize(value: string | null | undefined): AdminPageSize {
  const n = Number(value);
  if (ADMIN_PAGE_SIZE_OPTIONS.includes(n as AdminPageSize)) {
    return n as AdminPageSize;
  }
  return DEFAULT_ADMIN_PAGE_SIZE;
}

export function parseAdminPage(value: string | null | undefined): number {
  const p = Number(value);
  return Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1;
}
