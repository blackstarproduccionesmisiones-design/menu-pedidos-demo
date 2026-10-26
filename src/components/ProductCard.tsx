import React from 'react';
import { Product } from '../types';
import { calculateDiscount, formatPrice } from '../utils/formatters';
import { Plus, ImageOff } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currencySymbol: string;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currencySymbol,
  onAddToCart,
  onSelectProduct,
  cartQuantity,
}) => {
  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    onAddToCart(product);
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className={`group relative overflow-hidden bg-white rounded-2xl border transition-all cursor-pointer select-none ${ 
        !product.isAvailable
          ? 'opacity-60 bg-stone-50 border-stone-200'
          : 'border-stone-200 hover:border-red-300 hover:shadow-md'
      }`}
    >
      {/* Foto grande, a todo el ancho de la tarjeta */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-stone-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        <div className="absolute inset-0 -z-10 flex items-center justify-center text-stone-300">
          <ImageOff size={32} />
        </div>

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center p-2 text-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider bg-rose-600 px-2 py-1 rounded">
              No disponible
            </span>
          </div>
        )}

        {product.badge && product.isAvailable && (
          <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
            {product.badge}
          </div>
        )}
      </div>

      {/* Información debajo de la imagen */}
      <div className="p-4 sm:p-5">
        <h3 className="font-bold text-stone-900 text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-red-600 transition">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-2 text-sm sm:text-base text-stone-500 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
          <span className="text-red-600 font-extrabold text-xl sm:text-2xl tracking-tight">
            {formatPrice(product.price, currencySymbol)}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {cartQuantity > 0 && (
              <span className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg">
                x{cartQuantity}
              </span>
            )}

            <button
              onClick={handlePlusClick}
              disabled={!product.isAvailable}
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-xs transition-transform active:scale-90 ${ 
                !product.isAvailable
                  ? 'bg-stone-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
              }`}
              title="Añadir al carrito"
              aria-label={`Añadir ${product.name} al carrito`}
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
