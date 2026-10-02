import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin, Star, ArrowUpDown, LayoutGrid } from 'lucide-react';

export const RADIUS_OPTIONS = [
  { value: 5000, label: '5 km' },
  { value: 12000, label: '12 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
];

export const RATING_OPTIONS = [
  { value: 0, label: 'Todas' },
  { value: 4.5, label: '4.5+' },
  { value: 4.7, label: '4.7+' },
  { value: 4.8, label: '4.8+' },
];

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Destaques' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'az', label: 'A–Z' },
];

export const PAGESIZE_OPTIONS = [4, 8, 12];

/**
 * Barra de filtros das atrações: busca por nome, categorias, nota mínima,
 * ordenação, raio de busca (recarrega da API = mais atrações) e quantidade
 * por página na grade. Colapsável para boa usabilidade no mobile.
 */
export default function SpotFilters({
  query,
  onQuery,
  categories = [],
  selected = [],
  onToggleCategory,
  minRating,
  onMinRating,
  sort,
  onSort,
  radius,
  onRadius,
  reloading,
  pageSize,
  onPageSize,
  showPageSize,
  shown,
  total,
  onClear,
  hasActive,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Cabeçalho: busca + contador + colapso */}
      <div className="flex items-center gap-2 p-3 sm:p-3.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filtrar por nome ou categoria…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all"
          />
          {query && (
            <button
              onClick={() => onQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="hidden sm:inline-block text-xs font-bold text-slate-500 whitespace-nowrap px-1">
          {shown} de {total}
        </span>

        {hasActive && (
          <button
            onClick={onClear}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
            title="Limpar todos os filtros"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            open ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title={open ? 'Recolher filtros' : 'Expandir filtros'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActive && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="px-3 sm:px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 mt-0.5">
          {/* Contador mobile */}
          <div className="sm:hidden flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-500">{shown} de {total} atrações</span>
            {hasActive && (
              <button onClick={onClear} className="flex items-center gap-1 text-xs font-bold text-rose-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
                <span>Limpar tudo</span>
              </button>
            )}
          </div>

          {/* Categorias */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {categories.map((cat) => {
                const active = selected.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onToggleCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Controles */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Raio de busca */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Raio</span>
              </span>
              <div className={`flex items-center bg-slate-100 rounded-xl p-0.5 ${reloading ? 'opacity-60 pointer-events-none' : ''}`}>
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onRadius(opt.value)}
                    disabled={reloading}
                    title={`Buscar num raio de ${opt.label} (recarrega)`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-wait ${
                      radius === opt.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nota mínima */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Nota</span>
              </span>
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onMinRating(opt.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      minRating === opt.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenação */}
            <label className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Ordem</span>
              </span>
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            {/* Quantidade por página (grade) */}
            {showPageSize && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                  <span>Por página</span>
                </span>
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                  {PAGESIZE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => onPageSize(n)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pageSize === n
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
