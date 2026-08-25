import { create } from 'zustand';
import { Alert } from 'react-native';
import { storesApi } from '../api';
import { useAuthStore } from './authStore';

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
    if (useAuthStore.getState().isGuest) return;
    try {
      const ids = await storesApi.getFavouriteIds();
      set({ ids: new Set(ids), isLoaded: true });
    } catch {
      // Silently fail — user might not be authenticated yet
    }
  },

  toggle: async (storeId: string) => {
    if (useAuthStore.getState().isGuest) {
      Alert.alert('Sign in to save favourites', 'Create a free account to keep a list of your favourite stores.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => useAuthStore.getState().exitGuest() },
      ]);
      return;
    }
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
