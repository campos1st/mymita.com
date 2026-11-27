import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Marmita, Plano } from '../types';

export interface CartItem {
  marmita: Marmita;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  selectedPlan: Plano | null;
  totalItems: number;
  subtotal: number;
  addMarmita: (marmita: Marmita, qty?: number) => void;
  updateQty: (marmitaId: number, delta: number) => void;
  removeMarmita: (marmitaId: number) => void;
  selectPlan: (plano: Plano | null) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mymita_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedPlan, setSelectedPlan] = useState<Plano | null>(() => {
    try {
      const saved = localStorage.getItem('mymita_cart_plan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('mymita_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (selectedPlan) {
      localStorage.setItem('mymita_cart_plan', JSON.stringify(selectedPlan));
    } else {
      localStorage.removeItem('mymita_cart_plan');
    }
  }, [selectedPlan]);

  const addMarmita = (marmita: Marmita, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.marmita.id === marmita.id);
      if (existing) {
        return prev.map((i) =>
          i.marmita.id === marmita.id ? { ...i, quantidade: i.quantidade + qty } : i
        );
      }
      return [...prev, { marmita, quantidade: qty }];
    });
  };

  const updateQty = (marmitaId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.marmita.id === marmitaId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0)
    );
  };

  const removeMarmita = (marmitaId: number) => {
    setItems((prev) => prev.filter((i) => i.marmita.id !== marmitaId));
  };

  const selectPlan = (plano: Plano | null) => setSelectedPlan(plano);

  const clearCart = () => {
    setItems([]);
    setSelectedPlan(null);
  };

  const totalItems =
    items.reduce((acc, i) => acc + i.quantidade, 0) + (selectedPlan ? 1 : 0);

  const subtotal = selectedPlan
    ? Number(selectedPlan.preco)
    : items.reduce((acc, i) => acc + Number(i.marmita.precoAvulso) * i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        selectedPlan,
        totalItems,
        subtotal,
        addMarmita,
        updateQty,
        removeMarmita,
        selectPlan,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
