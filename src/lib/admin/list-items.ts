export type AdminListItemKey =
  | 'categories'
  | 'services'
  | 'bookings'
  | 'technicians'
  | 'customers'
  | 'payments'
  | 'reviews'
  | 'logs';

export interface AdminPaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export type AdminPaginatedList<T, K extends AdminListItemKey> = AdminPaginatedMeta & Record<K, T[]>;

/** Safely unwrap admin list API data that may be a paginated object or legacy bare array. */
export function asAdminListItems<T, K extends AdminListItemKey>(
  data: AdminPaginatedList<T, K> | T[] | null | undefined,
  key: K,
): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  const items = data[key];
  return Array.isArray(items) ? items : [];
}
