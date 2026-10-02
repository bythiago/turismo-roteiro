import React from 'react';
import { Compass, Flame, LayoutGrid, Heart, Info, Sparkles } from 'lucide-react';

export default function Navbar({ 
  itineraryCount, 
  onOpenItinerary, 
  onOpenInfo,
  viewMode,
  onChangeViewMode
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-rose-900 to-slate-900 bg-clip-text text-transparent">
                RoteiroTur
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Pesquise, deslize no estilo Tinder & monte seu roteiro
            </p>
          </div>
        </div>

        {/* Center View Mode Switcher (Tinder vs Grid) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onChangeViewMode('tinder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'tinder'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${viewMode === 'tinder' ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>Modo Tinder</span>
          </button>

          <button
            onClick={() => onChangeViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Modo Grade (4)</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Informações sobre a base de dados gratuita"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Base Grátis</span>
          </button>

          {/* Roteiro Button */}
          <button
            onClick={onOpenItinerary}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
              itineraryCount > 0
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25 hover:shadow-md hover:from-rose-600 hover:to-pink-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${itineraryCount > 0 ? 'fill-white text-white' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Meu Roteiro</span>
            {itineraryCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-rose-600 bg-white rounded-full">
                {itineraryCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
