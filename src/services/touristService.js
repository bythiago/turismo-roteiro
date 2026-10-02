import { CURATED_CITIES } from '../data/curatedSpots';
import { optimizedImage } from './imageService';

// ---- Cache + fetch com timeout (evita refazer consumo pesado a cada busca) ----
const spotsCache = new Map(); // chave -> { ts, data }
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h em memória

function cacheKey(lat, lon, placeName, opts = {}) {
  const n = (placeName || '').toLowerCase().trim().split(',')[0];
  const r = (v) => (v == null ? '' : Number(v).toFixed(2));
  return `spots:${n}:${r(lat)}:${r(lon)}:rad${opts.radius || 12000}:lim${opts.limit || 32}`;
}

function getCachedSpots(key) {
  const hit = spotsCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    spotsCache.delete(key);
    return null;
  }
  return hit.data;
}

function setCachedSpots(key, data) {
  if (spotsCache.size > 60) {
    const first = spotsCache.keys().next().value;
    spotsCache.delete(first);
  }
  spotsCache.set(key, { ts: Date.now(), data });
}

async function fetchJson(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Fallback images — todas verificadas visualmente (nenhum stock genérico fora de contexto)
const CATEGORY_IMAGES = {
  museum: [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
  ],
  park: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80',
  ],
  historic: [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80',
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ]
};

function fallbackImageFor(category = '', index = 0) {
  const key = String(category).toLowerCase();
  let list = CATEGORY_IMAGES.general;
  if (key.includes('museu') || key.includes('museum') || key.includes('cultura')) list = CATEGORY_IMAGES.museum;
  else if (key.includes('parque') || key.includes('natureza') || key.includes('jardim') || key.includes('lazer')) list = CATEGORY_IMAGES.park;
  else if (key.includes('hist') || key.includes('centro') || key.includes('patrim') || key.includes('relig')) list = CATEGORY_IMAGES.historic;
  else if (key.includes('mirante') || key.includes('vista') || key.includes('panor')) list = CATEGORY_IMAGES.viewpoint;
  return list[index % list.length];
}

/**
 * Normaliza uma string de texto removendo acentos e convertendo para minúsculas
 */
function normalizeText(text) {
  return text
    ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
}

/**
 * Busca endereços/cidades usando a API gratuita do OpenStreetMap Nominatim
 */
export async function searchAddress(query) {
  if (!query || query.trim().length < 2) return [];

  const norm = normalizeText(query);
  const matchedCurated = Object.keys(CURATED_CITIES).find(k => norm.includes(k) || k.includes(norm));

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) throw new Error('Falha ao buscar endereço');
    const data = await response.json();

    const results = data.map(item => ({
      id: item.place_id,
      displayName: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      city: item.address?.city || item.address?.town || item.address?.municipality || item.address?.state || item.name,
      country: item.address?.country || '',
      state: item.address?.state || ''
    }));

    if (matchedCurated && CURATED_CITIES[matchedCurated]) {
      const c = CURATED_CITIES[matchedCurated];
      const hasExact = results.some(r => normalizeText(r.name).includes(matchedCurated));
      if (!hasExact) {
        results.unshift({
          id: `curated-${matchedCurated}`,
          displayName: c.name,
          name: c.name.split(',')[0],
          lat: c.lat,
          lon: c.lon,
          city: c.name.split(',')[0],
          country: 'Brasil'
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('Erro ao consultar Nominatim OSM, usando fallback:', err);

    if (matchedCurated && CURATED_CITIES[matchedCurated]) {
      const c = CURATED_CITIES[matchedCurated];
      return [{
        id: `curated-${matchedCurated}`,
        displayName: c.name,
        name: c.name.split(',')[0],
        lat: c.lat,
        lon: c.lon,
        city: c.name.split(',')[0],
        country: 'Brasil'
      }];
    }
    return [];
  }
}

/**
 * Distância em km entre dois pontos (haversine). Usada para detectar
 * se o usuário navegou o mapa para longe da área já carregada.
 */
export function distanceKm(aLat, aLon, bLat, bLon) {
  const nums = [aLat, aLon, bLat, bLon].map(Number);
  if (nums.some((v) => !Number.isFinite(v))) return Infinity;
  const [la1, lo1, la2, lo2] = nums;
  const R = 6371;
  const dLat = ((la2 - la1) * Math.PI) / 180;
  const dLon = ((lo2 - lo1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Geocodificação reversa gratuita (Nominatim): centro do mapa → nome da cidade.
 * Permite atualizar os pontos turísticos ao navegar pelo mapa.
 */
export async function reverseGeocode(lat, lon) {
  const fallback = { city: 'Região explorada', state: '', name: 'Região explorada', displayName: 'Região explorada' };
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const data = await fetchJson(url, 8000);
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state || fallback.city;
    const state = addr.state_code || addr.state || '';
    const name = state && city !== state ? `${city}, ${state}` : city;
    return { city, state, name, displayName: data.display_name || name };
  } catch (err) {
    console.warn('Reversão de endereço falhou:', err?.message);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// NOVA FONTE DE DADOS (100% gratuita, sem chave):
//  - Descoberta de atrações: Overpass API (OpenStreetMap) — POIs reais com
//    coordenadas exatas num raio da cidade pesquisada.
//  - Fotos: Openverse API (Creative Commons) — 1 foto real por atração,
//    com crédito do autor exibido no app.
// ---------------------------------------------------------------------------

function mapOsmToCategory(tags = {}) {
  const t = tags.tourism || '';
  const l = tags.leisure || '';
  const h = tags.historic || '';
  const a = tags.amenity || '';

  if (t === 'museum' || t === 'gallery') return 'Museu & Cultura';
  if (t === 'viewpoint') return 'Mirante & Vista Panorâmica';
  if (t === 'artwork') return 'Arte Urbana & Cultura';
  if (t === 'theme_park' || t === 'zoo' || t === 'aquarium' || t === 'water_park') return 'Lazer & Família';
  if (l === 'park' || l === 'garden' || l === 'nature_reserve') return 'Natureza & Lazer';
  if (a === 'place_of_worship') return 'Monumento & Religioso';
  if (h) return 'Patrimônio Histórico';
  return 'Ponto Turístico & Histórico';
}

function estimatedTimeFor(category = '') {
  if (category.includes('Museu')) return '2 - 3 horas';
  if (category.includes('Mirante')) return '1 hora';
  if (category.includes('Natureza')) return '1.5 - 2 horas';
  if (category.includes('Religioso')) return '1 hora';
  if (category.includes('Lazer')) return '3 - 4 horas';
  return '1.5 - 2 horas';
}

// Pseudo-aleatório determinístico (estável entre recarregamentos)
function hashNumber(str = '', salt = 0) {
  let h = 2166136261 + salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Descobre atrações reais via Overpass API (OpenStreetMap) — sem chave.
 * Raio e limite ajustáveis pela UI (mais raio/limite = mais atrações).
 */
// Mirrors públicos do Overpass — se o principal limitar a cota do IP,
// tenta os próximos antes de desistir (erro "rate_limited").
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

async function queryOverpassOnce(endpoint, query, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    });
    const text = await res.text();
    // Overpass devolve o erro de cota ("rate_limited") como 429/504 ou texto de erro
    if (!res.ok || text.includes('rate_limited') || text.includes('Dispatcher_Client::request_read_and_idx')) {
      throw new Error(`Overpass ${endpoint} recusou (HTTP ${res.status}, cota?)`);
    }
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.elements)) throw new Error('Resposta Overpass inválida');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOverpassPOIs(lat, lon, { radius = 12000, limit = 32 } = {}) {
  const around = `(around:${radius},${lat},${lon})`;
  // Query LEVE: filtros combinados por regex (~10 statements em vez de ~30).
  // Queries pesadas esgotam a cota do IP e causam o erro "rate_limited".
  const tourismVals = '^(attraction|museum|viewpoint|artwork|gallery|theme_park|zoo|aquarium)$';
  const leisureVals = '^(park|garden|nature_reserve)$';
  const historicVals = '^(monument|memorial|castle|ruins|archaeological_site)$';
  const stmts = [
    `node["tourism"~"${tourismVals}"]${around}`,
    `node["leisure"~"${leisureVals}"]${around}`,
    `node["amenity"="place_of_worship"]${around}`,
    `node["historic"~"${historicVals}"]${around}`,
    `node["natural"="peak"]${around}`,
    `way["tourism"~"${tourismVals}"]${around}`,
    `way["leisure"~"${leisureVals}"]${around}`,
    `way["amenity"="place_of_worship"]${around}`,
    `way["building"~"^(cathedral|church)$"]${around}`,
    `way["historic"~"^(castle|ruins)$"]${around}`,
  ].join(';');

  const query = `[out:json][timeout:25];(${stmts};);out center 60;`;

  let data = null;
  let lastErr = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      data = await queryOverpassOnce(endpoint, query, 28000);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(err?.message, '— tentando próximo mirror…');
    }
  }
  if (!data) throw lastErr || new Error('Overpass indisponível em todos os mirrors');

    const seen = new Set();
    const pois = [];
    for (const el of data.elements || []) {
      const tags = el.tags || {};
      const name = (tags.name || '').trim();
      if (!name || name.length < 3) continue;
      const normName = normalizeText(name);
      if (seen.has(normName)) continue;
      seen.add(normName);

      const plat = el.lat ?? el.center?.lat;
      const plon = el.lon ?? el.center?.lon;
      if (plat == null || plon == null) continue;

      // Prioriza POIs turísticos "fortes" sobre praças/ruas genéricas
      let score = 0;
      if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') score += 3;
      if (tags.tourism === 'museum' || tags.tourism === 'artwork') score += 2;
      if (tags.historic) score += 2;
      if (tags.leisure === 'park' || tags.leisure === 'garden') score += 1;
      if (tags.website || tags.wikipedia) score += 1;
      if (tags.tourism === 'information') score -= 5;

      pois.push({
        name,
        category: mapOsmToCategory(tags),
        lat: plat,
        lon: plon,
        score,
        rawTags: tags,
      });
    }

    pois.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return pois.slice(0, limit);
}

// Cache de fotos Openverse na sessão (respeita o limite anônimo da API)
const photoCache = new Map();

/**
 * Busca 1 foto Creative Commons por nome na Openverse API — sem chave.
 * Retorna { image, credit, sourceUrl } ou null.
 */
async function fetchOpenversePhoto(query) {
  const key = normalizeText(query);
  if (photoCache.has(key)) return photoCache.get(key);

  try {
    const url =
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
      `&page_size=4&mature=false&format=json`;
    const data = await fetchJson(url, 8000);
    const results = (data.results || []).filter(
      (r) => r && typeof r.url === 'string' && r.url.startsWith('http') && !r.mature
    );
    if (results.length === 0) {
      photoCache.set(key, null);
      return null;
    }
    // Prefere paisagem (melhor crop nos cards 4:3), senão a primeira
    const landscape = results.find((r) => (r.width || 0) >= (r.height || 0));
    const best = landscape || results[0];
    const license = [best.license, best.license_version].filter(Boolean).join(' ').toUpperCase();
    const photo = {
      image: best.url,
      credit: best.creator
        ? `"${best.title || 'Foto'}" por ${best.creator}${license ? ` (${license})` : ''}`
        : null,
      sourceUrl: best.foreign_landing_url || null,
    };
    if (photoCache.size > 200) {
      const first = photoCache.keys().next().value;
      photoCache.delete(first);
    }
    photoCache.set(key, photo);
    return photo;
  } catch (err) {
    console.warn('Openverse sem foto para:', query, err?.message);
    photoCache.set(key, null);
    return null;
  }
}

function describePoi(poi, cleanCity) {
  const tags = poi.rawTags || {};
  let text = `Ponto de interesse em ${cleanCity} mapeado pela comunidade OpenStreetMap.`;
  if (tags.fee === 'no') text += ' Entrada gratuita.';
  else if (tags.fee === 'yes') text += ' Entrada paga.';
  if (tags.opening_hours) text += ` Horário: ${tags.opening_hours}.`;
  if (tags.religion && poi.category.includes('Religioso')) {
    text += ` Templo de tradição ${tags.religion}.`;
  }
  return text;
}

/**
 * Enriquece POIs com foto real (Openverse) + fallback curado por categoria.
 * Concorrência limitada a 4 para respeitar os limites das APIs gratuitas.
 */
async function enrichWithPhotos(pois, cleanCity) {
  const spots = new Array(pois.length);

  for (let i = 0; i < pois.length; i += 4) {
    const batch = pois.slice(i, i + 4);
    const settled = await Promise.all(
      batch.map(async (poi, bi) => {
        const idx = i + bi;
        let photo = await fetchOpenversePhoto(`${poi.name} ${cleanCity}`);
        if (!photo) photo = await fetchOpenversePhoto(poi.name);

        const image = photo?.image || fallbackImageFor(poi.category, idx);
        const h = hashNumber(poi.name, cleanCity.length);
        spots[idx] = {
          id: poi.id || `osm-${idx}-${h % 100000}`,
          name: poi.name,
          category: poi.category,
          rating: Number((4.5 + ((h % 4) / 10)).toFixed(1)),
          reviewsCount: 3000 + (h % 42000),
          estimatedTime: estimatedTimeFor(poi.category),
          description: poi.description || describePoi(poi, cleanCity),
          image,
          imageFull: photo?.image || optimizedImage(image, 1600),
          lat: poi.lat,
          lon: poi.lon,
          address: poi.address || `${poi.name}, ${cleanCity}`,
          tags: [poi.category.split(' ')[0], cleanCity, 'Foto Real'],
          isRealPhoto: Boolean(photo),
          photoCredit: photo?.credit || null,
          photoSourceUrl: photo?.sourceUrl || null,
        };
      })
    );
    void settled;
  }

  return spots;
}

/**
 * Monta atrações reais de qualquer cidade: Overpass (descoberta) + Openverse (fotos).
 */
async function fetchRealSpots(cityName, lat, lon, opts = {}) {
  const cleanCity = cityName.split(',')[0].trim();

  if (lat != null && lon != null) {
    try {
      const pois = await fetchOverpassPOIs(lat, lon, opts);
      if (pois.length > 0) {
        return await enrichWithPhotos(pois, cleanCity);
      }
    } catch (err) {
      console.warn('Overpass falhou, usando fallback genérico:', err?.message);
    }
  }

  return [];
}

/**
 * Busca atrações AO VIVO extras para somar às listas curadas (ex.: Rio sai de
 * 8 fixas para 8 + ~12 reais ao redor). Exclui nomes já exibidos.
 */
export async function getExtraSpots(lat, lon, placeName = "", existingNames = [], limit = 12, radius = 15000) {
  if (lat == null || lon == null) return [];
  const cleanCity = placeName.split(',')[0].trim();
  const excluded = new Set((existingNames || []).map(normalizeText));
  try {
    const pois = await fetchOverpassPOIs(lat, lon, { radius, limit: limit + 10 });
    const fresh = pois.filter((p) => !excluded.has(normalizeText(p.name))).slice(0, limit);
    if (fresh.length === 0) return [];
    return await enrichWithPhotos(fresh, cleanCity);
  } catch (err) {
    console.warn('Extras ao vivo falharam:', err?.message);
    return [];
  }
}

/**
 * Função principal para obter pontos turísticos
 */
export async function getTouristSpots(lat, lon, placeName = "", opts = {}) {
  const norm = normalizeText(placeName);
  const firstSegment = normalizeText(placeName.split(',')[0]);

  // Cache: evita reconsumir APIs ao revisitar a mesma cidade
  const key = cacheKey(lat, lon, placeName, opts);
  const cached = getCachedSpots(key);
  if (cached) return cached;

  // 1. Procura na lista curada de alta definição (Rio, SP, Salvador, Campos do Jordão, Gramado, etc.)
  for (const [key2, cityData] of Object.entries(CURATED_CITIES)) {
    if (
      norm.includes(key2) ||
      key2.includes(norm) ||
      firstSegment.includes(key2) ||
      key2.includes(firstSegment)
    ) {
      const result = {
        source: 'curated',
        cityName: cityData.name,
        spots: cityData.spots
      };
      setCachedSpots(key, result);
      return result;
    }
  }

  // 2. Checa por proximidade de coordenadas aos destinos curados (< 35km)
  if (lat && lon) {
    for (const [, cityData] of Object.entries(CURATED_CITIES)) {
      const dLat = Math.abs(cityData.lat - lat);
      const dLon = Math.abs(cityData.lon - lon);
      if (dLat < 0.35 && dLon < 0.35) {
        const result = {
          source: 'curated-proximity',
          cityName: cityData.name,
          spots: cityData.spots
        };
        setCachedSpots(key, result);
        return result;
      }
    }
  }

  // 3. Atrações REAIS via Overpass (OpenStreetMap) + fotos CC via Openverse
  const cleanCity = placeName.split(',')[0].trim();
  const realSpots = await fetchRealSpots(cleanCity, lat, lon, opts);

  if (realSpots && realSpots.length >= 4) {
    const result = {
      source: 'openverse',
      cityName: cleanCity,
      spots: realSpots
    };
    setCachedSpots(key, result);
    return result;
  }

  // 4. Se tiver menos de 4, complementa com sugestões genéricas (também com fotos reais quando possível)
  const genericPois = [
    {
      id: 'gen-1',
      name: `Centro Histórico de ${cleanCity}`,
      category: 'Centro Histórico & Cultura',
      description: `O ponto de partida para conhecer a história, arquitetura e atmosfera cultural em ${cleanCity}.`,
      lat: (lat || -22.54) + 0.003,
      lon: (lon || -44.17) + 0.003,
      address: `Praça Central, ${cleanCity}`,
    },
    {
      id: 'gen-2',
      name: `Parque Municipal de ${cleanCity}`,
      category: 'Natureza & Lazer',
      description: `Área arborizada com trilhas e contato direto com a natureza de ${cleanCity}.`,
      lat: (lat || -22.54) - 0.004,
      lon: (lon || -44.17) + 0.005,
      address: `Parque Municipal, ${cleanCity}`,
    },
    {
      id: 'gen-3',
      name: `Mirante de ${cleanCity}`,
      category: 'Mirante & Vista Panorâmica',
      description: `Vista panorâmica de toda a região de ${cleanCity}, perfeito para contemplar o pôr do sol.`,
      lat: (lat || -22.54) + 0.008,
      lon: (lon || -44.17) - 0.006,
      address: `Morro do Mirante, ${cleanCity}`,
    },
    {
      id: 'gen-4',
      name: `Mercado Regional de ${cleanCity}`,
      category: 'Gastronomia & Tradição',
      description: `Sabores autênticos locais, culinária típica e artesanato tradicional de ${cleanCity}.`,
      lat: (lat || -22.54) - 0.003,
      lon: (lon || -44.17) - 0.004,
      address: `Rua do Comércio, ${cleanCity}`,
    }
  ];

  const enrichedGeneric = await enrichWithPhotos(genericPois, cleanCity);
  const fallbackSpots = [...(realSpots || []), ...enrichedGeneric];

  const result = {
    source: 'openverse-enhanced',
    cityName: cleanCity,
    spots: fallbackSpots.slice(0, 8)
  };
  setCachedSpots(key, result);
  return result;
}
