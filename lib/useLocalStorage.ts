'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValueAndPersist = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof newValue === 'function' ? (newValue as (p: T) => T)(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      return resolved;
    });
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValueAndPersist, clear] as const;
}
