import { createContext, useContext } from 'react';

/**
 * Lets nested store screens (e.g. CreateStoreScreen) ask the StoreNavigator to
 * re-evaluate the store's verification status after they change it, so the UI
 * transitions to the correct state (e.g. → pending review after creation).
 *
 * Kept in its own leaf module to avoid a circular import between
 * StoreNavigator and the screens it renders.
 */
export const StoreStatusContext = createContext<{ refresh: () => void }>({
  refresh: () => {},
});

export const useStoreStatus = () => useContext(StoreStatusContext);
