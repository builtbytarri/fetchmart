import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  storeId: string | null;
  
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,

  addItem: (product: Product, quantity = 1) => {
    const { items, storeId } = get();
    
    if (storeId && storeId !== product.storeId) {
      set({ items: [{ product, quantity }], storeId: product.storeId });
      return;
    }

    const existingItem = items.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        items: [...items, { product, quantity }],
        storeId: product.storeId,
      });
    }
  },

  removeItem: (productId: string) => {
    const { items } = get();
    const newItems = items.filter((item) => item.product.id !== productId);
    set({
      items: newItems,
      storeId: newItems.length > 0 ? get().storeId : null,
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => set({ items: [], storeId: null }),

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
