'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api/laravel';

export interface ConfigFeatureFlags {
  enableHierarchy: boolean;
  enablePools: boolean;
  enableGenericLists: boolean;
  showLegacyBridgeBanner: boolean;
}

const envBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

const defaultFlags: ConfigFeatureFlags = {
  enableHierarchy: envBoolean(process.env.NEXT_PUBLIC_ENABLE_CONFIG_HIERARCHY, true),
  enablePools: envBoolean(process.env.NEXT_PUBLIC_ENABLE_CONFIG_POOLS, false),
  enableGenericLists: envBoolean(process.env.NEXT_PUBLIC_ENABLE_CONFIG_GENERIC_LISTS, true),
  showLegacyBridgeBanner: envBoolean(process.env.NEXT_PUBLIC_SHOW_LEGACY_BRIDGE_BANNER, true)
};

const parseFlag = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
};

const normalizeFlags = (raw: Partial<Record<string, unknown>>): ConfigFeatureFlags => ({
  enableHierarchy: parseFlag(
    raw.enableHierarchy ?? raw.hierarchy ?? raw.courseTypeHierarchy,
    defaultFlags.enableHierarchy
  ),
  enablePools: parseFlag(raw.enablePools ?? raw.creditPools, defaultFlags.enablePools),
  enableGenericLists: parseFlag(
    raw.enableGenericLists ?? raw.genericLists,
    defaultFlags.enableGenericLists
  ),
  showLegacyBridgeBanner: parseFlag(
    raw.showLegacyBridgeBanner ?? raw.legacyBridgeBanner,
    defaultFlags.showLegacyBridgeBanner
  )
});

export const useConfigFeatureFlags = () => {
  const [flags, setFlags] = useState<ConfigFeatureFlags>(defaultFlags);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/config/feature-flags`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load feature flags');
      }

      const payload = await response.json();
      const normalized = normalizeFlags(payload?.flags ?? payload ?? {});
      setFlags((prev) => ({ ...prev, ...normalized }));
    } catch (err) {
      console.warn('Falling back to env feature flags', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { flags, isLoading, error, refresh };
};
