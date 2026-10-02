import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import TouristGrid from './components/TouristGrid';
import TinderSwipeMode from './components/TinderSwipeMode';
import InteractiveMap from './components/InteractiveMap';
import ItineraryPanel from './components/ItineraryPanel';
import ExportModal from './components/ExportModal';
import ApiInfoModal from './components/ApiInfoModal';
import AutoItineraryModal from './components/AutoItineraryModal';
import PhotoModal from './components/PhotoModal';
import SpotFilters from './components/SpotFilters';
import { getTouristSpots, getExtraSpots, reverseGeocode, distanceKm } from './services/touristService';
import { generateAutoItinerary } from './services/itineraryGenerator';
import { Sparkles, Navigation, Flame, LayoutGrid, Sliders, Search, Loader2, Zap } from 'lucide-react';

// A partir desta distância (km) do local carregado, o mapa considera
// que o usuário navegou para uma nova área e sugere atualizar os pontos.
const AREA_DIRTY_KM = 2;

export default function App() {
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Rio de Janeiro, RJ, Brasil',
    displayName: 'Rio de Janeiro, RJ, Brasil',
    lat: -22.9068,
    lon: -43.1729,
  });

  const [spots, setSpots] = useState([]);
  const [source, setSource] = useState('curated');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestRef = useRef(0);

  // Filtros das atrações (busca, categorias, nota, ordem, raio, por página)
  const [fQuery, setFQuery] = useState('');
  const [fCats, setFCats] = useState([]);
  const [fMinRating, setFMinRating] = useState(0);
  const [fSort, setFSort] = useState('relevance');
  const [radius, setRadius] = useState(12000);
  const [pageSize, setPageSize] = useState(4);
  const radiusRef = useRef(radius);
  radiusRef.current = radius;
  const [itinerary, setItinerary] = useState([]);
  const [viewMode, setViewMode] = useState('tinder'); // 'tinder' | 'grid'
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [selectedPhotoSpot, setSelectedPhotoSpot] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -22.9068, lon: -43.1729 });

  // Atualização dos pontos ao navegar no mapa: perguntando (botão) ou automática
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [areaDirty, setAreaDirty] = useState(false);
  const locationRef = useRef(currentLocation);
  const autoRef = useRef(autoRefresh);
  const mapViewRef = useRef(null);
  const autoTimerRef = useRef(null);
  locationRef.current = currentLocation;
  autoRef.current = autoRefresh;

  // Load initial spots on mount
  useEffect(() => {
    loadSpotsForLocation(-22.9068, -43.1729, 'Rio de Janeiro');
  }, []);

  const loadSpotsForLocation = async (lat, lon, name, opts) => {
    const myReq = ++requestRef.current;
    const searchOpts = opts || { radius: radiusRef.current };
    setIsLoading(true);
    setIsLoadingMore(false);
    try {
      const result = await getTouristSpots(lat, lon, name, searchOpts);
      if (requestRef.current !== myReq) return;
      const loadedSpots = result.spots || [];
      setSpots(loadedSpots);
      setSource(result.source || 'curated');

      if (lat && lon) {
        setMapCenter({ lat, lon });
      } else if (loadedSpots.length > 0 && loadedSpots[0].lat && loadedSpots[0].lon) {
        setMapCenter({ lat: loadedSpots[0].lat, lon: loadedSpots[0].lon });
        setCurrentLocation(prev => ({
          ...prev,
          lat: loadedSpots[0].lat,
          lon: loadedSpots[0].lon
        }));
      }

      // 2ª fase (sem travar a tela): soma atrações AO VIVO às listas curadas.
      // Ex.: Rio sai de 8 fixas para 8 + ~12 reais ao redor.
      const isCurated = result.source === 'curated' || result.source === 'curated-proximity';
      if (isCurated && lat && lon) {
        setIsLoadingMore(true);
        getExtraSpots(lat, lon, name, loadedSpots.map(s => s.name), 12, searchOpts.radius || radiusRef.current)
          .then((extras) => {
            if (requestRef.current !== myReq || !extras || extras.length === 0) return;
            setSpots((prev) => {
              const seen = new Set(prev.map(p => p.id));
              const fresh = extras.filter(e => !seen.has(e.id));
              return fresh.length > 0 ? [...prev, ...fresh] : prev;
            });
          })
          .catch((err) => console.warn('Extras ao vivo indisponíveis:', err?.message))
          .finally(() => {
            if (requestRef.current === myReq) setIsLoadingMore(false);
          });
      }
    } catch (error) {
      console.error('Erro ao carregar pontos turísticos:', error);
    } finally {
      if (requestRef.current === myReq) setIsLoading(false);
    }
  };

  const handleSelectLocation = async (loc) => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setAreaDirty(false);
    mapViewRef.current = null;
    setCurrentLocation({
      name: loc.name || loc.displayName,
      displayName: loc.displayName || loc.name,
      lat: loc.lat,
      lon: loc.lon
    });

    await loadSpotsForLocation(loc.lat, loc.lon, loc.name || loc.displayName);
  };

  // Busca pontos turísticos para a área visível no mapa (após navegar)
  const searchMapArea = async (view) => {
    const target = view || mapViewRef.current;
    if (!target || target.lat == null || target.lon == null) return;
    setAreaDirty(false);
    setIsLoading(true);
    try {
      const geo = await reverseGeocode(target.lat, target.lon);
      setCurrentLocation({
        name: geo.name,
        displayName: geo.displayName,
        lat: target.lat,
        lon: target.lon
      });
      await loadSpotsForLocation(target.lat, target.lon, geo.city || geo.name, { radius: radiusRef.current });
    } catch (error) {
      console.error('Erro ao atualizar pontos da área do mapa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chamado pelo mapa quando o usuário arrasta/dá zoom para outra região
  const handleMapNavigate = (view) => {
    const loc = locationRef.current;
    const dist = distanceKm(view.lat, view.lon, loc?.lat, loc?.lon);
    if (dist < AREA_DIRTY_KM) {
      setAreaDirty(false);
      return;
    }
    mapViewRef.current = view;

    if (autoRef.current) {
      // Modo automático: espera o usuário parar de arrastar (debounce)
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => {
        const stillFar = distanceKm(view.lat, view.lon, locationRef.current?.lat, locationRef.current?.lon);
        if (stillFar >= AREA_DIRTY_KM) searchMapArea(view);
      }, 1200);
    } else {
      // Modo "perguntando": mostra o botão "Buscar nesta região"
      setAreaDirty(true);
    }
  };

  const handleToggleAutoRefresh = () => {
    const next = !autoRefresh;
    setAutoRefresh(next);
    // Ao ativar com área pendente, atualiza na hora
    if (next && mapViewRef.current) {
      const loc = locationRef.current;
      const v = mapViewRef.current;
      if (distanceKm(v.lat, v.lon, loc?.lat, loc?.lon) >= AREA_DIRTY_KM) {
        searchMapArea(v);
      } else {
        setAreaDirty(false);
      }
    }
  };

  // ---- Filtros: lista filtrada/ordenada (memoizada) + assinatura p/ resetar o baralho ----
  const allCategories = useMemo(() => {
    const ordered = [];
    spots.forEach((s) => {
      if (s.category && !ordered.includes(s.category)) ordered.push(s.category);
    });
    return ordered;
  }, [spots]);

  const filteredSpots = useMemo(() => {
    const q = fQuery.trim().toLowerCase();
    const list = spots.filter((s) => {
      if (fCats.length > 0 && !fCats.includes(s.category)) return false;
      if (fMinRating > 0 && Number(s.rating || 0) < fMinRating) return false;
      if (q) {
        const hay = `${s.name || ''} ${s.category || ''} ${(s.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (fSort === 'rating') return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (fSort === 'az') return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
    return list;
  }, [spots, fQuery, fCats, fMinRating, fSort]);

  const filterSig = `${currentLocation.name}|${fCats.join(',')}|${fMinRating}|${fSort}|${fQuery.trim().toLowerCase()}`;
  const hasActiveFilters = fQuery.trim() !== '' || fCats.length > 0 || fMinRating > 0 || fSort !== 'relevance';

  const handleToggleCategory = (cat) => {
    setFCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleClearFilters = () => {
    setFQuery('');
    setFCats([]);
    setFMinRating(0);
    setFSort('relevance');
  };

  const handleRadiusChange = async (r) => {
    if (r === radiusRef.current || isLoading) return;
    setRadius(r);
    const loc = locationRef.current;
    if (loc?.lat != null && loc?.lon != null) {
      await loadSpotsForLocation(loc.lat, loc.lon, loc.name || loc.displayName, { radius: r });
    }
  };

  const handleToggleLike = (spot) => {
    setItinerary(prev => {
      const exists = prev.some(item => item.id === spot.id);
      if (exists) {
        return prev.filter(item => item.id !== spot.id);
      } else {
        return [...prev, { ...spot, day: 1, period: 'Passeio' }];
      }
    });
  };

  const handleRemoveItem = (spotId) => {
    setItinerary(prev => prev.filter(item => item.id !== spotId));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setItinerary(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    setItinerary(prev => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleChangeDay = (spotId, newDay) => {
    setItinerary(prev => prev.map(item => {
      if (item.id === spotId) {
        return { ...item, day: newDay };
      }
      return item;
    }));
  };

  const handleClearItinerary = () => {
    if (window.confirm('Deseja realmente limpar todos os pontos do seu roteiro?')) {
      setItinerary([]);
    }
  };

  const handleFocusMap = (spot) => {
    setMapCenter({ lat: spot.lat, lon: spot.lon });
    const mapElement = document.getElementById('map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Gerador Automático de Roteiro
  const handleAutoGenerate = ({ days, attractionsPerDay, category }) => {
    const generated = generateAutoItinerary({
      allSpots: spots,
      days,
      attractionsPerDay,
      category
    });

    if (generated && generated.length > 0) {
      setItinerary(generated);
      setTimeout(() => {
        const itEl = document.getElementById('itinerary-section');
        if (itEl) itEl.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Navigation */}
      <Navbar
        itineraryCount={itinerary.length}
        onOpenItinerary={() => {
          const itEl = document.getElementById('itinerary-section');
          if (itEl) itEl.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenInfo={() => setIsInfoOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero & Search Section */}
        <section className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>Descubra Lugares no Modo Tinder ou Grade</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
            Deslize para a direita e monte sua viagem
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Pesquise uma cidade, dê match nas atrações que você mais gostar ou gere um roteiro completo por dias.
          </p>

          <div className="pt-2">
            <SearchBar
              onSelectLocation={handleSelectLocation}
              isLoading={isLoading}
            />
          </div>

          {/* Quick Actions & Mode Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setViewMode('tinder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tinder'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${viewMode === 'tinder' ? 'fill-white' : ''}`} />
                <span>Modo Tinder (Swipe)</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Modo Grade (4 Opções)</span>
              </button>
            </div>

            {/* Auto Generate Button */}
            <button
              onClick={() => setIsAutoModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Automático (Dias + Atrações)</span>
            </button>
          </div>
        </section>

        {/* Discovery Area: Tinder Mode OR Grid Mode (com filtros) */}
        <section className="pt-2 space-y-4">
          {isLoadingMore && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Descobrindo mais atrações ao redor… {spots.length} até agora</span>
              </span>
            </div>
          )}

          <SpotFilters
            query={fQuery}
            onQuery={setFQuery}
            categories={allCategories}
            selected={fCats}
            onToggleCategory={handleToggleCategory}
            minRating={fMinRating}
            onMinRating={setFMinRating}
            sort={fSort}
            onSort={setFSort}
            radius={radius}
            onRadius={handleRadiusChange}
            reloading={isLoading}
            pageSize={pageSize}
            onPageSize={setPageSize}
            showPageSize={viewMode === 'grid'}
            shown={filteredSpots.length}
            total={spots.length}
            onClear={handleClearFilters}
            hasActive={hasActiveFilters}
          />

          {spots.length > 0 && filteredSpots.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-10 max-w-md mx-auto text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-extrabold text-lg text-slate-900">Nenhum resultado para estes filtros</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tente ampliar o raio de busca, baixar a nota mínima ou limpar os filtros.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : viewMode === 'tinder' ? (
            <TinderSwipeMode
              spots={filteredSpots}
              itinerary={itinerary}
              onToggleLike={handleToggleLike}
              onFocusMap={handleFocusMap}
              onOpenPhoto={setSelectedPhotoSpot}
              locationName={currentLocation.name}
              resetKey={filterSig}
            />
          ) : (
            <TouristGrid
              spots={filteredSpots}
              locationName={currentLocation.name}
              source={source}
              itinerary={itinerary}
              onToggleLike={handleToggleLike}
              onFocusMap={handleFocusMap}
              onOpenPhoto={setSelectedPhotoSpot}
              isLoading={isLoading}
              pageSize={pageSize}
              resetKey={filterSig}
            />
          )}
        </section>

        {/* Split Section: Interactive Map + Dynamic Multi-day Itinerary */}
        <section className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="map-section">
          
          {/* Map Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-rose-500" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  Mapa Interativo & Rotas
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleAutoRefresh}
                  title={autoRefresh ? 'Desativar atualização automática (volta a perguntar)' : 'Ativar atualização automática ao navegar no mapa'}
                  className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                    autoRefresh
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-7 h-4 rounded-full relative transition-colors shrink-0 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${autoRefresh ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto-atualizar</span>
                </button>
                <span className="text-xs text-slate-500 hidden md:inline">
                  {itinerary.length > 0 ? `${itinerary.length} paradas no roteiro` : 'Curta atrações no Tinder para traçar a rota'}
                </span>
              </div>
            </div>

            <div className="h-[440px] sm:h-[500px] relative">
              <InteractiveMap
                center={mapCenter}
                spots={spots}
                itinerary={itinerary}
                onToggleLike={handleToggleLike}
                onUserNavigate={handleMapNavigate}
              />

              {/* Pergunta estilo Airbnb: buscar pontos da nova área? */}
              {!autoRefresh && areaDirty && !isLoading && (
                <button
                  onClick={() => searchMapArea()}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-xl transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar atrações nesta região</span>
                </button>
              )}

              {/* Feedback durante a atualização da área */}
              {isLoading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur text-slate-700 text-xs font-bold shadow-xl border border-slate-200 whitespace-nowrap">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>Buscando atrações…</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {autoRefresh
                ? 'Modo automático: arraste o mapa e os pontos dessa região carregam sozinhos.'
                : 'Arraste o mapa para explorar — vamos sugerir buscar os pontos da nova região.'}
            </p>
          </div>

          {/* Itinerary Column (5 cols on lg) */}
          <div className="lg:col-span-5" id="itinerary-section">
            <ItineraryPanel
              itinerary={itinerary}
              onRemoveItem={handleRemoveItem}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onClearItinerary={handleClearItinerary}
              onExport={() => setIsExportOpen(true)}
              onOpenAutoGenerator={() => setIsAutoModalOpen(true)}
              onChangeDay={handleChangeDay}
            />
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} RoteiroTur MVP • OpenStreetMap, Overpass & Openverse (fotos CC).</p>
          <button
            onClick={() => setIsInfoOpen(true)}
            className="text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 cursor-pointer"
          >
            Ver documentação das bases gratuitas
          </button>
        </div>
      </footer>

      {/* Modals */}
      <PhotoModal
        spot={selectedPhotoSpot}
        isOpen={Boolean(selectedPhotoSpot)}
        onClose={() => setSelectedPhotoSpot(null)}
        isLiked={selectedPhotoSpot ? itinerary.some(item => item.id === selectedPhotoSpot.id) : false}
        onToggleLike={handleToggleLike}
        allSpots={spots}
        onSelectSpot={setSelectedPhotoSpot}
      />

      <AutoItineraryModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        onGenerate={handleAutoGenerate}
        locationName={currentLocation.name}
        availableSpotsCount={spots.length}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        itinerary={itinerary}
        locationName={currentLocation.name}
      />

      <ApiInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

    </div>
  );
}
