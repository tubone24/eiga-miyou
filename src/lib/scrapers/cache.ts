import type { ScrapeResult } from "./types";

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 200;

interface CacheEntry {
  result: ScrapeResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function buildCacheKey(
  chain: string,
  siteCode: string,
  date: string,
): string {
  return `${chain}:${siteCode}:${date}`;
}

export function getCached(key: string): ScrapeResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCache(key: string, result: ScrapeResult): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    clearExpired();
    // Still over limit: evict oldest entry
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
  }
  cache.set(key, {
    result,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function clearExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}
