import React from 'react';
import { Search, X, Flame, Percent } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterOnlyDiscounts: boolean;
  onToggleDiscounts: () => void;
  filterOnlyFeatured: boolean;
  onToggleFeatured: () => void;
  resultsCount: number;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filterOnlyDiscounts,
  onToggleDiscounts,
  filterOnlyFeatured,
  onToggleFeatured,
  resultsCount,
  onClose,
}) => {
  return (
    <div className="bg-stone-50 border-b border-stone-200 py-3 px-4 shadow-inner animate-in slide-in-from-top duration-150">
      <div className="max-w-4xl mx-auto space-y-2.5">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar galetos, milanesas, empanadas, papas, bebidas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className="w-full bg-white pl-10 pr-20 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-stone-800 placeholder:text-stone-400 shadow-2xs"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full"
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Quick filter pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFeatured}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition ${
                filterOnlyFeatured
                  ? 'bg-red-500 text-white shadow-xs font-bold'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Flame size={12} />
              <span>Especialidades & Populares</span>
            </button>
          </div>

          <span className="text-stone-500 font-medium">
            {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>
    </div>
  );
};
