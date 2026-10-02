import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, MapPin, Star, Heart, ZoomIn, ZoomOut, Maximize2,
  ChevronLeft, ChevronRight, Clock, Download, ExternalLink,
  BadgeCheck, RotateCcw
} from 'lucide-react';
import SmartImage from './SmartImage';
import { fullImage, optimizedImage, preloadSpotImages } from '../services/imageService';

export default function PhotoModal({
  spot,
  isOpen,
  onClose,
  isLiked,
  onToggleLike,
  allSpots = [],
  onSelectSpot
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchStartX = useRef(null);
  const stageRef = useRef(null);

  const currentIndex = allSpots.findIndex(s => s.id === spot?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allSpots.length - 1;

  const goTo = useCallback((idx) => {
    if (!onSelectSpot || idx < 0 || idx >= allSpots.length) return;
    onSelectSpot(allSpots[idx]);
  }, [allSpots, onSelectSpot]);

  // Reset ao trocar de foto + preload vizinhas
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoaded(false);
    if (spot && allSpots.length) {
      preloadSpotImages(allSpots, Math.max(0, currentIndex - 1), 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id]);

  // Teclado + trava scroll do body
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goTo(currentIndex + 1);
      else if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)));
      else if (e.key === '-') setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)));
      else if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, currentIndex, goTo, onClose]);

  if (!isOpen || !spot) return null;

  const hiRes = spot.imageFull || fullImage(spot.image);
  const bgBlur = optimizedImage(spot.image, 480);

  // Pan quando com zoom (mouse)
  const onStageDown = (e) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onStageMove = (e) => {
    if (!dragging || zoom <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const limit = 220 * zoom;
    setPan({
      x: Math.max(-limit, Math.min(limit, dragStart.current.panX + dx)),
      y: Math.max(-limit, Math.min(limit, dragStart.current.panY + dy)),
    });
  };
  const onStageUp = () => setDragging(false);

  // Swipe mobile para trocar de foto (só sem zoom)
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null || zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -60 && hasNext) goTo(currentIndex + 1);
    else if (dx > 60 && hasPrev) goTo(currentIndex - 1);
    touchStartX.current = null;
  };

  const zoomIn = () => setZoom(z => Math.min(3, +(z + 0.5).toFixed(2)));
  const zoomOut = () => {
    setZoom(z => {
      const n = Math.max(1, +(z - 0.5).toFixed(2));
      if (n === 1) setPan({ x: 0, y: 0 });
      return n;
    });
  };

  const thumbs = allSpots.slice(Math.max(0, currentIndex - 3), currentIndex + 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 rounded-3xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-white/10 text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Barra superior ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold shadow-lg whitespace-nowrap">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Foto real · Alta resolução</span>
              <span className="xs:hidden">Foto real</span>
            </span>
            {allSpots.length > 1 && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[11px] font-semibold text-slate-200 whitespace-nowrap">
                {currentIndex + 1} / {allSpots.length}
              </span>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <div className="flex items-center bg-black/60 backdrop-blur-md border border-white/20 rounded-full p-0.5 shadow-lg">
              <button onClick={zoomOut} disabled={zoom <= 1} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-40" title="Diminuir zoom (-)">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={zoomIn} disabled={zoom >= 3} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-40" title="Aumentar zoom (+)">
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoom > 1 && (
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer" title="Resetar zoom (0)">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <a
              href={hiRes}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-colors cursor-pointer"
              title="Abrir original em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={hiRes}
              download={`${(spot.name || 'foto').replace(/[^\w\-]+/g, '-').toLowerCase()}.jpg`}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-colors cursor-pointer"
              title="Baixar foto"
            >
              <Download className="w-4 h-4" />
            </a>

            <button onClick={onClose} className="p-2 sm:p-2.5 rounded-full bg-white text-black hover:bg-slate-200 transition-colors cursor-pointer shadow-lg" title="Fechar (Esc)">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Palco da imagem: fundo desfocado (sem barras pretas) + foto nítida ── */}
        <div
          ref={stageRef}
          className={`relative w-full h-[52vh] sm:h-[56vh] md:h-[60vh] overflow-hidden flex items-center justify-center ${zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
          onMouseDown={onStageDown}
          onMouseMove={onStageMove}
          onMouseUp={onStageUp}
          onMouseLeave={onStageUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onDoubleClick={() => { if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); } else setZoom(2); }}
          title={zoom > 1 ? 'Arraste para explorar · duplo clique para resetar' : 'Duplo clique para zoom · arraste pro lado no celular para navegar'}
        >
          {/* Fundo artístico desfocado da própria foto */}
          <img src={bgBlur} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-[0.55] saturate-150 select-none" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />

          {/* Navegação lateral */}
          {hasPrev && (
            <button onClick={() => goTo(currentIndex - 1)} className="absolute left-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-xl" title="Anterior (←)">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button onClick={() => goTo(currentIndex + 1)} className="absolute right-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-xl" title="Próxima (→)">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Foto principal em alta */}
          <div
            className="relative z-10 h-full w-full flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-amber-400 animate-spin" />
              </div>
            )}
            <img
              key={spot.id}
              src={hiRes}
              alt={spot.name}
              onLoad={() => setLoaded(true)}
              onError={(e) => { e.currentTarget.src = fullImage(''); setLoaded(true); }}
              className={`max-h-full max-w-full object-contain select-none drop-shadow-2xl transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </div>

          {/* Dica de zoom */}
          {zoom > 1 && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/70 text-[11px] font-semibold text-slate-200 backdrop-blur">
              Arraste para explorar · {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        {/* ── Filmstrip ── */}
        {allSpots.length > 1 && (
          <div className="z-20 flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-slate-950/95 border-t border-white/5 overflow-x-auto photo-filmstrip">
            {thumbs.map((s) => {
              const active = s.id === spot.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSpot && onSelectSpot(s)}
                  className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    active ? 'border-amber-400 shadow-lg shadow-amber-500/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={s.name}
                >
                  <SmartImage src={s.image} alt={s.name} category={s.category} variant="card" className="absolute inset-0 h-full w-full" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Rodapé de detalhes ── */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                {spot.category}
              </span>
              <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-white/5 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{spot.rating}</span>
                {spot.reviewsCount && (
                  <span className="text-slate-400 font-normal">
                    ({spot.reviewsCount > 1000 ? `${(spot.reviewsCount / 1000).toFixed(0)}k` : spot.reviewsCount})
                  </span>
                )}
              </span>
              {spot.estimatedTime && (
                <span className="flex items-center gap-1 text-slate-300 text-xs bg-white/5 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{spot.estimatedTime}</span>
                </span>
              )}
              {spot.isRealPhoto && (
                <span className="flex items-center gap-1 text-emerald-300 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <BadgeCheck className="w-3 h-3" />
                  <span>Foto real · CC</span>
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-lg sm:text-xl text-white leading-tight">
              {spot.name}
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-300 line-clamp-2 leading-relaxed">
              {spot.description}
            </p>
            {spot.address && (
              <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{spot.address}</span>
              </p>
            )}
            {spot.photoCredit && (
              <p className="text-[11px] text-slate-500 truncate">
                📷 {spot.photoCredit}
                {spot.photoSourceUrl && (
                  <>
                    {' · '}
                    <a
                      href={spot.photoSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="underline underline-offset-2 hover:text-slate-300"
                    >
                      ver original
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => onToggleLike(spot)}
              className={`flex-1 md:flex-none px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isLiked
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-white text-slate-950 hover:bg-amber-400 hover:scale-[1.02]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
              <span>{isLiked ? 'No Roteiro ✓' : 'Curtir & Adicionar'}</span>
            </button>
            <button
              onClick={() => { onClose(); setTimeout(() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }), 150); }}
              className="p-3 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Ver no mapa"
            >
              <Maximize2 className="w-4 h-4 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
