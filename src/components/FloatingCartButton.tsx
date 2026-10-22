import React from 'react';
import { formatPrice } from '../utils/formatters';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  total: number;
  currencySymbol: string;
  onClick: () => void;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  total,
  currencySymbol,
  onClick,
}) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={onClick}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-between border-2 border-white/20 backdrop-blur-xs group"
          aria-label="Abrir carrito de compras"
        >
          {/* Left: Badge + Items count */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
                <ShoppingBag size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            </div>

            <div className="text-left">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/90 block leading-tight">
                Ver tu pedido
              </span>
              <span className="text-xs text-white/80">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </div>

          {/* Right: Total price + arrow */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight">
              {formatPrice(total, currencySymbol)}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight size={16} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
