import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, X, Star, RotateCcw, MapPin,
  Clock, CheckCircle2, Flame, Expand
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SmartImage from './SmartImage';
import { preloadSpotImages } from '../services/imageService';

export default function TinderSwipeMode({
  spots,
  itinerary,
  onToggleLike,
  onFocusMap,
  onOpenPhoto,
  locationName,
  resetKey
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | 'up'
  const startPos = useRef({ x: 0, y: 0 });

  const currentSpot = spots[currentIndex];
  const nextSpot = spots[currentIndex + 1];
  const nextNextSpot = spots[currentIndex + 2];

  // Reset ao trocar de cidade/filtros (extras anexados NÃO resetam o baralho)
  const deckKey = resetKey ?? locationName;
  useEffect(() => {
    setCurrentIndex(0);
    setHistory([]);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  useEffect(() => {
    if (spots?.length) preloadSpotImages(spots, currentIndex + 1, 4);
  }, [currentIndex, spots]);

  const handleSwipe = (direction) => {
    if (!currentSpot) return;

    setSwipeDirection(direction);

    setTimeout(() => {
      const isAlreadyInItinerary = itinerary.some(item => item.id === currentSpot.id);

      if (direction === 'right' || direction === 'up') {
        if (!isAlreadyInItinerary) {
          onToggleLike(currentSpot);
        }

        try {
          confetti({
            particleCount: direction === 'up' ? 60 : 35,
            spread: 55,
            origin: { y: 0.75 },
            colors: direction === 'up' ? ['#38bdf8', '#fbbf24', '#f43f5e'] : ['#f43f5e', '#ec4899', '#10b981']
          });
        } catch {}
      }

      setHistory(prev => [...prev, { spot: currentSpot, direction }]);
      setCurrentIndex(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }, 220);
  };

  const handleUndo = () => {
    if (history.length === 0 || currentIndex === 0) return;
    const lastAction = history[history.length - 1];

    if (lastAction.direction === 'right' || lastAction.direction === 'up') {
      onToggleLike(lastAction.spot);
    }

    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setHistory([]);
    setDragOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSwipe('up');
      } else if (e.key === 'Backspace' || e.key === 'z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentSpot, history]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    startPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 90;
    if (dragOffset.x > threshold) {
      handleSwipe('right');
    } else if (dragOffset.x < -threshold) {
      handleSwipe('left');
    } else if (dragOffset.y < -threshold) {
      handleSwipe('up');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const rotation = dragOffset.x * 0.08;

  if (!spots || spots.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Nenhuma atração disponível para deslizar. Pesquise um local primeiro.
      </div>
    );
  }

  if (currentIndex >= spots.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 max-w-md mx-auto text-center shadow-lg flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-3xl mb-4 shadow-lg shadow-rose-500/25">
          🎉
        </div>
        <h3 className="font-extrabold text-2xl text-slate-900">Você viu todas as atrações!</h3>
        <p className="text-slate-600 text-sm mt-2 max-w-xs">
          Você curtiu <strong>{itinerary.length} atrações</strong> para o seu roteiro em {locationName}.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rever Atrações</span>
          </button>

          <button
            onClick={() => {
              const itEl = document.getElementById('itinerary-section');
              if (itEl) itEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ver Roteiro Pronto</span>
          </button>
        </div>
      </div>
    );
  }

  const progress = spots.length ? ((currentIndex + 1) / spots.length) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">

      {/* Topo + progresso */}
      <div className="w-full mb-3 px-2">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span>Modo Tinder</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>{currentIndex + 1} de {spots.length} atrações</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-rose-600 font-bold">{itinerary.length} no roteiro</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pilha de cards */}
      <div className="relative w-full h-[480px] sm:h-[520px] select-none touch-none">

        {nextNextSpot && (
          <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-sm transform scale-90 translate-y-6 opacity-40 pointer-events-none transition-transform duration-300 overflow-hidden">
            <SmartImage src={nextNextSpot.image} alt="" variant="tinder" className="absolute inset-0 h-full w-full" />
          </div>
        )}

        {nextSpot && (
          <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-md transform scale-95 translate-y-3 opacity-70 pointer-events-none transition-transform duration-300 overflow-hidden">
            <SmartImage src={nextSpot.image} alt="" variant="tinder" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
              <h3 className="font-extrabold text-xl">{nextSpot.name}</h3>
              <p className="text-xs text-slate-300">{nextSpot.category}</p>
            </div>
          </div>
        )}

        {currentSpot && (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              transform: swipeDirection === 'left'
                ? 'translateX(-150%) rotate(-30deg)'
                : swipeDirection === 'right'
                ? 'translateX(150%) rotate(30deg)'
                : swipeDirection === 'up'
                ? 'translateY(-150%) scale(1.1)'
                : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            className="absolute inset-0 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col justify-between"
          >
            {/* Foto otimizada com nitidez alta */}
            <div className="absolute inset-0 z-0">
              <SmartImage
                src={currentSpot.imageFull || currentSpot.image}
                alt={currentSpot.name}
                category={currentSpot.category}
                variant="tinder"
                eager
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 z-[3] bg-gradient-to-t from-slate-950 via-slate-950/45 to-black/25 pointer-events-none" />
              {/* Vinheta cinematográfica */}
              <div className="absolute inset-0 z-[3] pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.45)] rounded-3xl" />
            </div>

            {dragOffset.x > 30 && (
              <div className="absolute top-8 left-8 z-30 border-4 border-emerald-400 text-emerald-400 px-4 py-1.5 rounded-2xl font-black text-2xl tracking-wider uppercase transform -rotate-12 bg-black/40 backdrop-blur-xs shadow-lg animate-pulse">
                CURTIR ❤️
              </div>
            )}

            {dragOffset.x < -30 && (
              <div className="absolute top-8 right-8 z-30 border-4 border-rose-500 text-rose-500 px-4 py-1.5 rounded-2xl font-black text-2xl tracking-wider uppercase transform rotate-12 bg-black/40 backdrop-blur-xs shadow-lg animate-pulse">
                PASSAR ❌
              </div>
            )}

            {dragOffset.y < -40 && Math.abs(dragOffset.x) < 40 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 border-4 border-amber-400 text-amber-400 px-4 py-1.5 rounded-2xl font-black text-2xl tracking-wider uppercase bg-black/40 backdrop-blur-xs shadow-lg animate-pulse">
                SUPER LIKE ⭐
              </div>
            )}

            {/* Topo */}
            <div className="relative z-10 p-5 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 text-xs font-bold shadow-xs">
                {currentSpot.category}
              </span>

              <div className="flex items-center gap-2">
                {onOpenPhoto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPhoto(currentSpot);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-sm cursor-pointer transition-colors"
                    title="Ver foto em alta resolução"
                  >
                    <Expand className="w-3.5 h-3.5" />
                    <span>Alta resolução</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-extrabold shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{currentSpot.rating}</span>
                </div>
              </div>
            </div>

            {/* Detalhes */}
            <div className="relative z-10 p-6 text-white text-left space-y-2">
              <h3 className="font-extrabold text-[26px] sm:text-3xl leading-tight drop-shadow-lg">
                {currentSpot.name}
              </h3>

              <p className="text-[13px] sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow">
                {currentSpot.description}
              </p>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-200 font-medium flex-wrap">
                {currentSpot.estimatedTime && (
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Clock className="w-3 h-3 text-slate-200" />
                    <span>{currentSpot.estimatedTime}</span>
                  </span>
                )}
                {currentSpot.address && (
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg truncate max-w-[220px] border border-white/10">
                    <MapPin className="w-3 h-3 text-slate-200 shrink-0" />
                    <span className="truncate">{currentSpot.address}</span>
                  </span>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Botões */}
      <div className="mt-5 flex items-center justify-center gap-3 sm:gap-5 w-full">

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg text-amber-500 hover:bg-amber-50 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95"
          title="Desfazer última atração (Z / Backspace)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white border-2 border-rose-200 shadow-lg hover:shadow-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-90"
          title="Passar atração (Seta Esquerda ←)"
        >
          <X className="w-8 h-8 stroke-[2.5]" />
        </button>

        <button
          onClick={() => handleSwipe('up')}
          className="w-12 h-12 rounded-full bg-white border border-sky-200 shadow-md hover:shadow-lg text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          title="Super Like / Favorito (Seta Cima ↑)"
        >
          <Star className="w-6 h-6 fill-sky-400" />
        </button>

        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 hover:shadow-xl text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-90"
          title="Curtir e adicionar ao roteiro (Seta Direita →)"
        >
          <Heart className="w-8 h-8 fill-white stroke-none" />
        </button>

      </div>

      <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-3">
        <span>← Passar</span>
        <span>•</span>
        <span>↑ Super Like</span>
        <span>•</span>
        <span>→ Curtir & Adicionar</span>
      </div>

    </div>
  );
}
