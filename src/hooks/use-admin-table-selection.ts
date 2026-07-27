'use client';

import { useCallback, useMemo, useState } from 'react';

export interface AdminSelectableRow {
  id: string;
  /**
   * Rows the server would refuse anyway (the protected root admin, other
   * admins, the acting admin) opt out here so they can never end up in a batch.
   */
  selectable?: boolean;
}

export type AdminSelectAllState = boolean | 'indeterminate';

export interface AdminTableSelection {
  /** Selected ids, restricted to rows currently on screen. */
  selected: string[];
  count: number;
  /** True when at least one row on this page can be selected at all. */
  hasSelectableRows: boolean;
  headerState: AdminSelectAllState;
  isSelected: (id: string) => boolean;
  toggle: (id: string, checked: boolean) => void;
  selectAll: (checked: boolean) => void;
  clear: () => void;
  /** Replace the selection, e.g. to keep the rows a bulk delete failed on. */
  replace: (ids: string[]) => void;
}

/**
 * Row multi-select for an admin list page.
 *
 * The selection is always intersected with the rows currently rendered, and it
 * is dropped whenever `resetKey` changes (search, filters, pagination). Both
 * rules exist for the same reason: a bulk delete must never reach a row the
 * admin cannot see.
 */
export function useAdminTableSelection(
  rows: AdminSelectableRow[],
  resetKey?: string,
): AdminTableSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (resetKey !== lastResetKey) {
    // Adjusting state during render (rather than in an effect) so the new page
    // never paints with the previous page's selection.
    setLastResetKey(resetKey);
    if (selectedIds.size > 0) setSelectedIds(new Set());
  }

  const selectableIds = useMemo(
    () => rows.filter((row) => row.selectable !== false).map((row) => row.id),
    [rows],
  );

  const selected = useMemo(
    () => selectableIds.filter((id) => selectedIds.has(id)),
    [selectableIds, selectedIds],
  );

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (checked: boolean) => setSelectedIds(checked ? new Set(selectableIds) : new Set()),
    [selectableIds],
  );

  const clear = useCallback(() => setSelectedIds((prev) => (prev.size > 0 ? new Set() : prev)), []);

  const replace = useCallback((ids: string[]) => setSelectedIds(new Set(ids)), []);

  const count = selected.length;
  const headerState: AdminSelectAllState =
    count > 0 && count === selectableIds.length ? true : count > 0 ? 'indeterminate' : false;

  return {
    selected,
    count,
    hasSelectableRows: selectableIds.length > 0,
    headerState,
    isSelected,
    toggle,
    selectAll,
    clear,
    replace,
  };
}
