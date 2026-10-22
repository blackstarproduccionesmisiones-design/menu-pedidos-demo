import React, { useRef } from 'react';
import { Category } from '../types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onToggleSearch: () => void;
  isSearchActive: boolean;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onToggleSearch,
  isSearchActive,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 py-2.5 px-3 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        {/* Search trigger icon button on the left (matching the screenshot: search icon beside categories) */}
        <button
          onClick={onToggleSearch}
          className={`p-2 rounded-xl transition shrink-0 flex items-center justify-center ${
            isSearchActive
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          title="Buscar productos"
          aria-label="Buscar productos"
        >
          <Search size={18} />
        </button>

        {/* Categories scroll container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex-1"
        >
          {/* 'Todos' option */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedCategoryId === 'all'
                ? 'border-2 border-red-600 text-red-600 bg-red-50/50 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Todos
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isSelected
                    ? 'border-2 border-red-600 text-red-600 bg-red-50/50 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Small desktop scroll helpers */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            onClick={() => scroll('left')}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
