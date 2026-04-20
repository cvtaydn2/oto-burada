import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * World-Class UX: URL Query State (Issue 5 - "The Seam")
 * Syncs UI state (filters, sorting) directly with URL search params.
 * Prevents state loss on back button and browser refresh.
 */

export function useQueryState<T extends string | number | boolean>(
  key: string,
  defaultValue: T,
  options: { shallow?: boolean; scroll?: boolean } = { shallow: true, scroll: false }
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = (searchParams.get(key) as unknown as T) ?? defaultValue;

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      const prevValue = (searchParams.get(key) as unknown as T) ?? defaultValue;
      
      const nextValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevValue) 
        : (newValue as T);

      if (nextValue === defaultValue || nextValue === undefined || nextValue === null) {
        current.delete(key);
      } else {
        current.set(key, String(nextValue));
      }

      const search = current.toString();
      const query = search ? `?${search}` : "";

      // SSR soft navigation
      router.push(`${pathname}${query}`, { scroll: options.scroll });
    },
    [key, defaultValue, pathname, router, searchParams, options.scroll]
  );

  return [value, setValue] as const;
}
