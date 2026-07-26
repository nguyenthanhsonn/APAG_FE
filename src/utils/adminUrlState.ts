'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type QueryValue = string | number | null | undefined;

export function useAdminUrlState(defaultValues: Record<string, string> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getValue = useCallback(
    (key: string, fallback = '') => searchParams.get(key) ?? defaultValues[key] ?? fallback,
    [defaultValues, searchParams]
  );

  const getPage = useCallback(() => {
    const page = Number(searchParams.get('page') || '1');
    return Number.isFinite(page) && page > 0 ? page : 1;
  }, [searchParams]);

  const setQuery = useCallback(
    (updates: Record<string, QueryValue>, options: { resetPage?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const stringValue = value === undefined || value === null ? '' : String(value);
        const defaultValue = defaultValues[key] ?? '';

        if (!stringValue || stringValue === defaultValue) {
          params.delete(key);
        } else {
          params.set(key, stringValue);
        }
      });

      if (options.resetPage) {
        params.set('page', '1');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultValues, pathname, router, searchParams]
  );

  return { getPage, getValue, setQuery };
}
