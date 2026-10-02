import React from 'react';
import { Heart, Star, Clock, MapPin, Check, Plus, Maximize2, BadgeCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import SmartImage from './SmartImage';

export default function TouristCard({ spot, isLiked, onToggleLike, onFocusMap, onOpenPhoto }) {
  const handleLike = (e) => {
    e.stopPropagation();

    if (!isLiked) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f43f5e', '#ec4899', '#fbbf24', '#38bdf8']
        });
      } catch (err) {
        console.error(err);
      }
    }

    onToggleLike(spot);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
        isLiked
          ? 'border-rose-400 ring-2 ring-rose-400/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Imagem otimizada 4:3 com blur-up + zoom suave */}
      <div
        onClick={() => onOpenPhoto && onOpenPhoto(spot)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200 cursor-pointer group/img"
        title="Clique para ver a foto em alta resolução"
      >
        <SmartImage
          src={spot.imageFull || spot.image}
          alt={spot.name}
          category={spot.category}
          variant="card"
          className="absolute inset-0 h-full w-full"
          imgClassName="group-hover/img:scale-[1.06]"
        />

        {/* Gradiente de legibilidade */}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/55 via-black/5 to-black/25" />

        {/* Cue de expansão */}
        <div className="absolute inset-0 z-[4] bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg opacity-0 translate-y-2 group-hover/img:opacity-100 group-hover/img:translate-y-0 transition-all">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver em alta resolução</span>
          </span>
        </div>

        {/* Categoria */}
        <div className="absolute top-3 left-3 z-[5]">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm">
            {spot.category}
          </span>
        </div>

        {/* Like */}
        <button
          onClick={handleLike}
          className={`absolute top-3 right-3 z-[5] p-2.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
            isLiked
              ? 'bg-rose-500 text-white shadow-rose-500/40 scale-110'
              : 'bg-white/85 text-slate-700 hover:text-rose-500 hover:bg-white hover:scale-105'
          }`}
          title={isLiked ? 'Remover do roteiro' : 'Curtir e adicionar ao roteiro'}
        >
          <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-white animate-heart' : ''}`} />
        </button>

        {/* Selo foto real */}
        {spot.isRealPhoto && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[5] hidden group-hover/img:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow">
            <BadgeCheck className="w-3 h-3" />
            <span>Foto real</span>
          </div>
        )}

        {/* Rating + duração */}
        <div className="absolute bottom-3 left-3 z-[5] flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{spot.rating}</span>
          {spot.reviewsCount && (
            <span className="text-slate-500 font-normal">
              ({spot.reviewsCount > 1000 ? `${(spot.reviewsCount / 1000).toFixed(0)}k` : spot.reviewsCount})
            </span>
          )}
        </div>

        {spot.estimatedTime && (
          <div className="absolute bottom-3 right-3 z-[5] flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
            <Clock className="w-3 h-3 text-slate-300" />
            <span>{spot.estimatedTime}</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onOpenPhoto && onOpenPhoto(spot)}
            className="font-bold text-[17px] text-slate-900 leading-snug hover:text-rose-600 transition-colors cursor-pointer line-clamp-1"
          >
            {spot.name}
          </h3>

          <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
            {spot.description}
          </p>

          {spot.tags && spot.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {spot.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {spot.address && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{spot.address}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isLiked
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-slate-900 hover:bg-rose-600 text-white shadow-xs'
            }`}
          >
            {isLiked ? (
              <>
                <Check className="w-4 h-4 text-rose-600" />
                <span>No Roteiro ✓</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Curtir & Adicionar</span>
              </>
            )}
          </button>

          {onFocusMap && (
            <button
              type="button"
              onClick={() => onFocusMap(spot)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Ver localização no mapa"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
