import React, { useState, useEffect, useRef } from 'react';
import {
  optimizedImage,
  responsiveSrcSet,
  responsiveSizes,
  blurPlaceholder,
  fallbackForCategory,
  FALLBACK_IMAGE,
} from '../services/imageService';

/**
 * SmartImage — imagem otimizada com visual premium:
 * - Skeleton shimmer enquanto carrega
 * - Blur-up (placeholder desfocado → nítida com fade)
 * - srcSet responsivo + largura sob medida (card 800 / modal 1600)
 * - Fallback automático por categoria quando a URL quebra
 * - Evita layout shift com aspect-ratio reservado pelo pai
 */
export default function SmartImage({
  src,
  alt = '',
  category = 'general',
  variant = 'card', // 'card' | 'tinder' | 'modal'
  className = '',
  imgClassName = '',
  eager = false,
  sizes,
  onLoad,
  onError,
}) {
  const targetWidth = variant === 'modal' ? 1600 : variant === 'tinder' ? 1000 : 800;
  const optimized = optimizedImage(src, targetWidth);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(optimized);
  const triedFallback = useRef(false);

  // Troca de imagem → reseta estado
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    triedFallback.current = false;
    setCurrentSrc(optimizedImage(src, targetWidth));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad && onLoad(e);
  };

  const handleError = (e) => {
    if (!triedFallback.current) {
      triedFallback.current = true;
      setCurrentSrc(fallbackForCategory(category));
      return;
    }
    setFailed(true);
    setLoaded(true);
    if (currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE);
    onError && onError(e);
  };

  const placeholder = blurPlaceholder(String(src || alt || 'roteirotur'));

  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      {/* Skeleton shimmer */}
      {!loaded && (
        <div className="absolute inset-0 z-[1] smart-shimmer" aria-hidden="true" />
      )}

      {/* Blur placeholder (some quando a real carrega) */}
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Imagem real otimizada */}
      <img
        src={failed ? FALLBACK_IMAGE : currentSrc}
        srcSet={failed ? undefined : responsiveSrcSet(src)}
        sizes={sizes || responsiveSizes(variant)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
        className={`relative z-[2] h-full w-full object-cover select-none transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.04] blur-sm'
        } ${imgClassName}`}
      />
    </div>
  );
}
