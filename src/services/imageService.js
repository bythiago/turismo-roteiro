// Serviço central de imagens — otimiza consumo e padroniza visualização.
//
// Fontes atuais (100% gratuitas, sem chave):
//  - Descoberta de atrações: Overpass API (OpenStreetMap)
//  - Fotos reais: Openverse API (Creative Commons — Flickr, museus, arquivos)
//  - Fallback: Unsplash curado por categoria (todas verificadas visualmente)
//
// Otimizações:
//  - Unsplash com parâmetros otimizados + srcSet responsivo
//  - URLs CC usadas em tamanho original (já são ~1024px, ideais p/ cards e modal)
//  - Cache em memória + preload inteligente das próximas imagens
//  - Fallback curado por categoria quando a imagem falha

const memoryCache = new Map();

// Fallback final (sempre funciona, leve e temático)
export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=70';

const CATEGORY_FALLBACKS = {
  museum:
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=70',
  park: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=70',
  historic:
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=70',
  viewpoint:
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=70',
  general: FALLBACK_IMAGE,
};

export function fallbackForCategory(category = 'general') {
  const key = String(category).toLowerCase();
  if (key.includes('museu') || key.includes('museum')) return CATEGORY_FALLBACKS.museum;
  if (key.includes('parque') || key.includes('natureza') || key.includes('park'))
    return CATEGORY_FALLBACKS.park;
  if (key.includes('hist') || key.includes('centro') || key.includes('patrim'))
    return CATEGORY_FALLBACKS.historic;
  if (key.includes('mirante') || key.includes('vista') || key.includes('mar'))
    return CATEGORY_FALLBACKS.viewpoint;
  return CATEGORY_FALLBACKS.general;
}

/**
 * Converte qualquer URL conhecida para uma variante otimizada por largura.
 * - Unsplash: reescreve w/q/fit automaticamente
 * - Openverse/Flickr e demais URLs: usadas como estão (já vêm em tamanho web)
 * - Wikimedia legada (upload.wikimedia.org): troca a largura do thumb existente
 */
export function optimizedImage(url, width = 1200) {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  const w = Math.min(Math.max(width, 320), 1920);

  try {
    // Unsplash — troca parâmetros
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(w));
      u.searchParams.set('q', w > 1000 ? '75' : '70');
      return u.toString();
    }

    // Wikimedia thumb já existente: .../thumb/a/ab/Nome.jpg/1280px-Nome.jpg
    // Troca a largura do thumb para a desejada
    if (url.includes('upload.wikimedia.org') && url.includes('/thumb/')) {
      return url.replace(/\/\d+px-([^/]+)$/, `/${w}px-$1`);
    }

    return url;
  } catch {
    return url;
  }
}

/** URL leve para cards/grade (rápida no 4G) */
export function cardImage(url) {
  return optimizedImage(url, 800);
}

/** URL nítida para o modal/galeria */
export function fullImage(url) {
  return optimizedImage(url, 1600);
}

/** srcSet responsivo (só Unsplash gera variantes reais; demais usam a mesma URL) */
export function responsiveSrcSet(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('images.unsplash.com')) {
    return [480, 800, 1200, 1600].map((w) => `${optimizedImage(url, w)} ${w}w`).join(', ');
  }
  return `${optimizedImage(url, 800)} 800w, ${optimizedImage(url, 1600)} 1600w`;
}

export function responsiveSizes(kind = 'card') {
  if (kind === 'modal') return '(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1100px';
  if (kind === 'tinder') return '(max-width: 640px) 100vw, 420px';
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
}

// Placeholder blur (SVG inline, ~300 bytes) para efeito blur-up sem dependências
export function blurPlaceholder(seed = 'roteirotur') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 40) % 360;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='30'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${h1},30%,75%)'/>` +
    `<stop offset='1' stop-color='hsl(${h2},35%,60%)'/>` +
    `</linearGradient></defs><rect width='40' height='30' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pré-carrega uma imagem (com cache + timeout). Resolve `true/false`, nunca rejeita.
export function preloadImage(url, timeoutMs = 8000) {
  const finalUrl = optimizedImage(url, 800);
  if (memoryCache.has(finalUrl)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (ok) memoryCache.set(finalUrl, true);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };
    img.src = finalUrl;
  });
}

// Pré-carrega as próximas N imagens da lista (não bloqueia a UI)
export function preloadSpotImages(spots = [], startIndex = 0, count = 4) {
  const slice = spots.slice(startIndex, startIndex + count);
  slice.forEach((s) => {
    if (s?.image) {
      try {
        // requestIdleCallback quando disponível, senão timeout curto
        const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
        idle(() => preloadImage(s.image));
      } catch {
        /* ignora */
      }
    }
  });
}

export function clearImageCache() {
  memoryCache.clear();
}
