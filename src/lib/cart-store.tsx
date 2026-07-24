import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  is_veg: boolean;
  notes?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "nsfc.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item, qty = 1) => {
      setItems((cur) => {
        const idx = cur.findIndex((c) => c.id === item.id);
        if (idx >= 0) {
          const next = [...cur];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [...cur, { ...item, qty }];
      });
      toast.success(`${item.name} added to cart`, {
        description: "Tap the cart tab to review your order.",
        duration: 2200,
      });
    },
    setQty: (id, qty) =>
      setItems((cur) => (qty <= 0 ? cur.filter((c) => c.id !== id) : cur.map((c) => (c.id === id ? { ...c, qty } : c)))),
    remove: (id) => setItems((cur) => cur.filter((c) => c.id !== id)),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
