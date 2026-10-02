import React, { useState, useEffect } from 'react';
import TouristCard from './TouristCard';
import { RefreshCw, MapPin, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export default function TouristGrid({
  spots,
  locationName,
  source,
  itinerary,
  onToggleLike,
  onFocusMap,
  onOpenPhoto,
  isLoading,
  pageSize = 4, // Quantidade por página (ajustável nos filtros)
  resetKey
}) {
  const [page, setPage] = useState(0);

  // Volta à primeira página ao trocar filtros/cidade/tamanho (extras anexados não resetam)
  useEffect(() => {
    setPage(0);
  }, [resetKey, pageSize]);

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-slate-200 rounded-md w-48 animate-pulse"></div>
          <div className="h-6 bg-slate-200 rounded-md w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
              <div className="h-48 bg-slate-200 w-full"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                <div className="pt-2">
                  <div className="h-9 bg-slate-200 rounded-xl w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!spots || spots.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(spots.length / pageSize);
  const safePage = page >= totalPages ? 0 : page;
  const currentSpots = spots.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleNextPage = () => {
    setPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const isLiked = (spotId) => itinerary.some(item => item.id === spotId);

  return (
    <div className="w-full">
      {/* Header bar for 4 tourist spots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-600 font-bold text-sm">
              {Math.min(pageSize, spots.length)}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Principais Atrações Turísticas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Lugares mais visitados em <strong className="text-slate-700">{locationName || 'sua busca'}</strong></span>
            {(source === 'openverse' || source === 'openverse-enhanced') && (
              <span className="hidden md:inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Overpass + Fotos CC Live
              </span>
            )}
          </p>
        </div>

        {/* 4-option Navigation Controls */}
        {spots.length > pageSize && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-500">
              Opções {safePage * pageSize + 1} - {Math.min((safePage + 1) * pageSize, spots.length)} de {spots.length}
            </span>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevPage}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="4 opções anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleNextPage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                title="Ver mais 4 opções"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ver outras {pageSize}</span>
              </button>

              <button
                onClick={handleNextPage}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Próximas 4 opções"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid with exactly 4 Tourist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currentSpots.map((spot) => (
          <TouristCard
            key={spot.id}
            spot={spot}
            isLiked={isLiked(spot.id)}
            onToggleLike={onToggleLike}
            onFocusMap={onFocusMap}
            onOpenPhoto={onOpenPhoto}
          />
        ))}
      </div>

      {/* Footer Helper tip */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500 inline-flex items-center gap-1.5 bg-slate-100/80 px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Curta qualquer uma das opções acima para adicionar e organizar o seu roteiro personalizado!</span>
        </p>
      </div>
    </div>
  );
}
