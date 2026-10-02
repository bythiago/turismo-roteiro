import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Loader2, Sparkles, X, 
  Navigation, History, Compass, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { searchAddress } from '../services/touristService';
import { POPULAR_DESTINATIONS } from '../data/curatedSpots';

const RECENT_KEY = 'roteirotur_recent_searches';

export default function SearchBar({ onSelectLocation, isLoading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Carrega buscas recentes do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (item) => {
    try {
      const updated = [
        item,
        ...recentSearches.filter(r => (r.name || r.displayName) !== (item.name || item.displayName))
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (e, index) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((_, i) => i !== index);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const results = await searchAddress(query);
        setSuggestions(results);
        setSelectedIndex(-1);
        setIsOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const cleanName = item.name || item.displayName.split(',')[0];
    setQuery(item.displayName || item.name);
    setIsOpen(false);
    saveRecentSearch(item);
    onSelectLocation(item);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const listLength = suggestions.length > 0 ? suggestions.length : recentSearches.length;
      setSelectedIndex(prev => (prev < listLength - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const listLength = suggestions.length > 0 ? suggestions.length : recentSearches.length;
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : listLength - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
        handleSelect(target);
      } else if (recentSearches.length > 0 && selectedIndex >= 0) {
        handleSelect(recentSearches[selectedIndex]);
      } else if (query.trim()) {
        onSelectLocation({
          name: query,
          displayName: query,
        });
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' }
          });
          if (res.ok) {
            const data = await res.json();
            const cityName = data.address?.city || data.address?.town || data.address?.municipality || 'Minha Localização';
            const locationObj = {
              name: cityName,
              displayName: data.display_name,
              lat: latitude,
              lon: longitude
            };
            setQuery(cityName);
            saveRecentSearch(locationObj);
            onSelectLocation(locationObj);
          }
        } catch (err) {
          console.error(err);
          onSelectLocation({
            name: 'Minha Localização',
            displayName: 'Localização Atual',
            lat: latitude,
            lon: longitude
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto" ref={dropdownRef}>
      
      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          
          <div className="absolute left-4.5 text-slate-400 pointer-events-none">
            {isLoading || isSearchingSuggestions || isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Digite qualquer cidade, bairro ou atração (ex: Campos do Jordão, Gramado, Rio)..."
            className="w-full pl-12 pr-44 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-2xl shadow-lg shadow-slate-200/50 text-slate-800 placeholder-slate-400 font-medium text-base sm:text-lg transition-all outline-none"
          />

          {/* Right side Action Controls Group (Flex to prevent overlap) */}
          <div className="absolute right-2.5 flex items-center gap-1.5">
            
            {/* Clear button */}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                isLocating 
                  ? 'bg-rose-50 text-rose-600 border-rose-200' 
                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200 bg-white'
              }`}
              title="Usar minha localização atual (GPS)"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-rose-500' : ''}`} />
            </button>

            {/* Submit Search Button */}
            <button
              type="button"
              onClick={() => {
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0]);
                } else if (query.trim()) {
                  onSelectLocation({ name: query, displayName: query });
                  setIsOpen(false);
                }
              }}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Buscar</span>
              <CornerDownLeft className="w-3.5 h-3.5 hidden sm:inline opacity-70" />
            </button>
          </div>
        </div>

        {/* Dropdown Suggestions & Recents */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
            
            {/* Suggestions list */}
            {suggestions.length > 0 ? (
              <div>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Destinos Encontrados
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">Use as setas ↑ ↓ e Enter</span>
                </div>
                <ul className="max-h-68 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((item, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 group cursor-pointer ${
                          selectedIndex === idx ? 'bg-rose-50/90' : 'hover:bg-rose-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          selectedIndex === idx ? 'bg-rose-500 text-white' : 'bg-slate-100 group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-rose-600 truncate">
                            {item.name || item.displayName.split(',')[0]}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {item.displayName}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : recentSearches.length > 0 && !query ? (
              /* Recent searches when query is empty */
              <div>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Buscas Recentes
                  </span>
                </div>
                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {recentSearches.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="flex-1 text-left px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-700 hover:text-rose-600 cursor-pointer truncate"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{item.name || item.displayName.split(',')[0]}</span>
                        <span className="text-slate-400 text-[11px] truncate">({item.displayName.split(',').slice(1, 3).join(',')})</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, idx)}
                        className="p-2 text-slate-300 hover:text-slate-500 mr-2 rounded-lg cursor-pointer"
                        title="Remover do histórico"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

          </div>
        )}
      </div>

      {/* Quick Destination Chips with categories */}
      <div className="mt-3.5 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Destinos Recomendados:
        </span>
        
        {POPULAR_DESTINATIONS.map((dest, i) => (
          <button
            key={i}
            onClick={() => {
              setQuery(dest.query);
              onSelectLocation({
                name: dest.name,
                displayName: dest.name,
                query: dest.query
              });
            }}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-full shadow-2xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{dest.flag}</span>
            <span>{dest.name}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
