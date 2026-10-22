import React, { useState } from 'react';
import { Product } from '../types';
import { calculateDiscount, formatPrice } from '../utils/formatters';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product;
  currencySymbol: string;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currencySymbol,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const discountPct = calculateDiscount(product.price, product.originalPrice);
  const totalPrice = product.price * quantity;

  const handleAdd = () => {
    if (!product.isAvailable) return;
    onAddToCart(product, quantity, notes);
    setIsAdded(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition backdrop-blur-xs"
        >
          <X size={18} />
        </button>

        {/* Product Image Header */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-100 shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {product.badge && (
            <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
              {product.badge}
            </div>
          )}
        </div>

        {/* Scrollable details & options */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold text-stone-900">
                {product.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-red-600 font-extrabold text-2xl">
                {formatPrice(product.price, currencySymbol)}
              </span>
            </div>

            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Notes / Special Instructions input */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              ¿Alguna preferencia o instrucción especial?
            </label>
            <input
              type="text"
              placeholder="Ej: Sin cebolla, aderezo aparte, bien cocido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              maxLength={120}
            />
            <span className="text-[10px] text-stone-400 block text-right">
              {notes.length}/120
            </span>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-3 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition"
              aria-label="Disminuir cantidad"
            >
              <Minus size={16} />
            </button>
            <span className="w-7 text-center font-extrabold text-stone-800 text-sm">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 transition"
              aria-label="Aumentar cantidad"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.isAvailable || isAdded}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-between text-white shadow-md transition active:scale-95 text-sm ${
              isAdded
                ? 'bg-emerald-600'
                : !product.isAvailable
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAdded ? (
                <>
                  <Check size={18} className="animate-scale" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>Agregar al Carrito</span>
                </>
              )}
            </div>
            <span className="font-extrabold">
              {formatPrice(totalPrice, currencySymbol)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
