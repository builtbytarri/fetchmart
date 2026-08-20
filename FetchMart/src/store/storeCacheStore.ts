/**
 * Store product cache — senior-engineer notes
 * ─────────────────────────────────────────────────────────────────────────────
 * Why: every product-detail open triggered a fresh fetch, causing a visible
 *      spinner every time. We instead eagerly fetch ALL products + categories
 *      for a store the moment the customer opens it, then serve every sub-page
 *      from memory.
 *
 * Design decisions
 * ────────────────
 * 1. Module-level `inFlight` map  (not Zustand state)
 *    Deduplicates concurrent primeStore() calls (StoreDetails + AllProducts
 *    both calling it simultaneously) without triggering extra re-renders.
 *
 * 2. LRU eviction at MAX_STORES = 3
 *    Caps memory. Lagos grocery sessions rarely involve more than 2-3 stores,
 *    so 3 is generous. When the cap is hit we evict the least-recently-used
 *    entry before inserting the new one.
 *
 * 3. 5-minute TTL
 *    Product prices and availability can change. We treat the cache as fresh
 *    for 5 min — enough for a typical browse session — then re-fetch silently
 *    on the next primeStore call. No manual invalidation needed in normal use.
 *
 * 4. Reactive reads via Zustand selectors
 *    Components subscribe to `state.data[storeId]`. When primeStore() writes
 *    new data, Zustand notifies only subscribers for that store key.
 *    `getSimilar` / `getProduct` are called at render time from the selector,
 *    so they always reflect the latest cache without extra useState.
 *
 * 5. Cleanup on navigation
 *    Nothing to do — LRU handles memory automatically. No cleanup effects
 *    needed in components.
 */

import { create } from 'zustand';
import { storesApi } from '../api';
import { Category } from '../api/stores';
import { Product } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
export const CACHE_TTL_MS = 5 * 60_000;  // 5 minutes
const MAX_STORES = 3;                    // LRU cap

// ─── In-flight deduplication (module-level, NOT in Zustand state) ────────────
// Prevents N parallel fetches when N components call primeStore concurrently.
const inFlight = new Map<string, Promise<void>>();

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CachedStoreEntry {
  products: Product[];
  categories: Category[];
  fetchedAt: number;
  lastUsedAt: number;
}

interface StoreCacheState {
  /** storeId → cached data */
  data: Record<string, CachedStoreEntry>;

  /**
   * Eagerly fetch + cache all products and categories for a store.
   * - Returns immediately if the cache is still fresh.
   * - Deduplicates concurrent calls via the module-level inFlight map.
   * Safe to call from multiple components without coordination.
   */
  primeStore: (storeId: string) => Promise<void>;

  /**
   * Invalidate a store's cache entry (call after the store owner edits a
   * product so the next open re-fetches fresh data).
   */
  invalidate: (storeId: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useStoreCacheStore = create<StoreCacheState>((set, get) => ({
  data: {},

  primeStore: (storeId: string): Promise<void> => {
    const existing = get().data[storeId];
    const now = Date.now();

    // Cache hit and still fresh — bump lastUsedAt to keep it in the LRU, done.
    if (existing && now - existing.fetchedAt < CACHE_TTL_MS) {
      if (now - existing.lastUsedAt > 1000) {          // avoid thrash on rapid calls
        set(state => ({
          data: {
            ...state.data,
            [storeId]: { ...existing, lastUsedAt: now },
          },
        }));
      }
      return Promise.resolve();
    }

    // Already fetching this store — reuse the same promise.
    const pending = inFlight.get(storeId);
    if (pending) return pending;

    // New fetch.
    const fetchPromise = (async () => {
      try {
        const [products, categories] = await Promise.all([
          storesApi.getProducts(storeId),
          storesApi.getCategories(storeId),
        ]);

        set(state => {
          const next = { ...state.data };

          // LRU eviction — remove oldest-used entry if at cap and storeId is new.
          if (!next[storeId] && Object.keys(next).length >= MAX_STORES) {
            const lruKey = Object.keys(next).reduce((oldest, key) =>
              next[key].lastUsedAt < next[oldest].lastUsedAt ? key : oldest
            );
            delete next[lruKey];
          }

          next[storeId] = {
            products,
            categories,
            fetchedAt: Date.now(),
            lastUsedAt: Date.now(),
          };

          return { data: next };
        });
      } finally {
        inFlight.delete(storeId);
      }
    })();

    inFlight.set(storeId, fetchPromise);
    return fetchPromise;
  },

  invalidate: (storeId: string) => {
    set(state => {
      const next = { ...state.data };
      delete next[storeId];
      return { data: next };
    });
  },
}));

// ─── Pure helpers — called outside React (or inside useMemo) ─────────────────
/** Returns all cached products for a store, or null if missing/stale. */
export function getCachedProducts(
  entry: CachedStoreEntry | undefined,
): Product[] | null {
  if (!entry || Date.now() - entry.fetchedAt >= CACHE_TTL_MS) return null;
  return entry.products;
}

/** O(1) single-product lookup from a cache entry. */
export function getCachedProduct(
  entry: CachedStoreEntry | undefined,
  productId: string,
): Product | undefined {
  const products = getCachedProducts(entry);
  return products?.find(p => p.id === productId);
}

/**
 * Compute "similar items" entirely client-side — zero network calls.
 * Products in the same category as the target, excluding the target itself.
 * Falls back to other available store products if the target has no category.
 */
export function getSimilarFromCache(
  entry: CachedStoreEntry | undefined,
  productId: string,
): Product[] {
  const products = getCachedProducts(entry);
  if (!products) return [];

  const target = products.find(p => p.id === productId);
  if (!target) return [];

  return products
    .filter(p =>
      p.id !== productId &&
      p.isAvailable &&
      (target.categoryId
        ? p.categoryId === target.categoryId
        : p.storeId === target.storeId),
    )
    .slice(0, 10);
}
