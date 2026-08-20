import { create } from 'zustand';
import { storesApi } from '../api';

interface FavouritesState {
  ids: Set<string>;
  isLoaded: boolean;

  load: () => Promise<void>;
  toggle: (storeId: string) => Promise<void>;
  isFavourite: (storeId: string) => boolean;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  ids: new Set(),
  isLoaded: false,

  load: async () => {
    try {
      const ids = await storesApi.getFavouriteIds();
      set({ ids: new Set(ids), isLoaded: true });
    } catch {
      // Silently fail — user might not be authenticated yet
    }
  },

  toggle: async (storeId: string) => {
    const current = get().ids;

    // Optimistic update
    const next = new Set(current);
    if (next.has(storeId)) {
      next.delete(storeId);
    } else {
      next.add(storeId);
    }
    set({ ids: next });

    try {
      await storesApi.toggleFavourite(storeId);
    } catch (err: any) {
      console.error('[Favourites] toggle failed:', err?.response?.data ?? err?.message);
      // Revert on failure
      set({ ids: current });
    }
  },

  isFavourite: (storeId: string) => get().ids.has(storeId),
}));
