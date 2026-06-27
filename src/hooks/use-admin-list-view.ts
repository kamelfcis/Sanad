'use client';

import { useCallback, useState } from 'react';

export type AdminListViewMode = 'table' | 'cards';

export const ADMIN_LIST_VIEW_STORAGE_KEY = 'sanad_admin_list_view';

function readStoredView(pageId: string, defaultView: AdminListViewMode): AdminListViewMode {
  if (typeof window === 'undefined') return defaultView;

  const pageStored = localStorage.getItem(`${ADMIN_LIST_VIEW_STORAGE_KEY}:${pageId}`);
  if (pageStored === 'table' || pageStored === 'cards') return pageStored;

  const globalStored = localStorage.getItem(ADMIN_LIST_VIEW_STORAGE_KEY);
  if (globalStored === 'table' || globalStored === 'cards') return globalStored;

  return defaultView;
}

export function useAdminListView(pageId: string, defaultView: AdminListViewMode = 'table') {
  const [viewMode, setViewModeState] = useState<AdminListViewMode>(() =>
    readStoredView(pageId, defaultView),
  );

  const setViewMode = useCallback(
    (mode: AdminListViewMode) => {
      setViewModeState(mode);
      localStorage.setItem(ADMIN_LIST_VIEW_STORAGE_KEY, mode);
      localStorage.setItem(`${ADMIN_LIST_VIEW_STORAGE_KEY}:${pageId}`, mode);
    },
    [pageId],
  );

  return [viewMode, setViewMode] as const;
}
