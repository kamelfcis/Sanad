'use client';

import { useCallback, useMemo, useState } from 'react';

type Row = { id: string };

export type HeaderSelectState = boolean | 'indeterminate';

export function useAdminTableSelection<T extends Row>(rows: T[], resetKey: string) {
  const [selected, setSelected] = useState<string[]>([]);
  const [seenKey, setSeenKey] = useState(resetKey);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setSelected([]);
  }

  const ids = useMemo(() => rows.map((row) => row.id), [rows]);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const selectedOnPage = selected.filter((id) => idSet.has(id));
  const count = selected.length;
  const hasSelectableRows = ids.length > 0;

  const headerState: HeaderSelectState =
    selectedOnPage.length === 0
      ? false
      : selectedOnPage.length === ids.length
        ? true
        : 'indeterminate';

  const isSelected = useCallback((id: string) => selected.includes(id), [selected]);

  const toggle = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }, []);

  const selectAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        if (!checked) return prev.filter((id) => !idSet.has(id));
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return [...next];
      });
    },
    [idSet, ids],
  );

  const clear = useCallback(() => setSelected([]), []);
  const replace = useCallback((idsToKeep: string[]) => setSelected(idsToKeep), []);

  return {
    selected,
    count,
    hasSelectableRows,
    headerState,
    isSelected,
    toggle,
    selectAll,
    clear,
    replace,
  };
}
