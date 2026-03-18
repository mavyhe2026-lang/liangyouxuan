import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQty: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(i => i.productId === item.productId && i.variantId === item.variantId);
        if (existing) {
          set(state => ({ items: state.items.map(i => i.productId === item.productId && i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i) }));
        } else {
          set(state => ({ items: [...state.items, item] }));
        }
      },
      removeItem: (productId, variantId) => set(state => ({ items: state.items.filter(i => !(i.productId === productId && i.variantId === variantId)) })),
      updateQty: (productId, variantId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId, variantId); return; }
        set(state => ({ items: state.items.map(i => i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i) }));
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
