import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Heart } from 'lucide-react';

const DAY_HEX = {
  1: '#3b82f6', // Blue
  2: '#f43f5e', // Rose
  3: '#10b981', // Emerald
  4: '#8b5cf6', // Purple
  5: '#f59e0b', // Amber
  6: '#06b6d4', // Cyan
  7: '#6366f1', // Indigo
};

// Fix default leaflet marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ center, itinerary, onUserNavigate }) {
  const map = useMap();
  // Último centro "esperado" (movimento programático). Se o moveend terminar
  // longe daqui (~200m), foi o usuário que navegou → avisa o App.
  const expectedRef = useRef(null);
  const callbackRef = useRef(onUserNavigate);
  callbackRef.current = onUserNavigate;

  useEffect(() => {
    if (!map) return;

    if (itinerary.length > 1) {
      const bounds = L.latLngBounds(itinerary.map(s => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      const c = bounds.getCenter();
      expectedRef.current = { lat: c.lat, lon: c.lng };
    } else if (center && center.lat && center.lon) {
      expectedRef.current = { lat: center.lat, lon: center.lon };
      map.flyTo([center.lat, center.lon], 13, { duration: 1.2 });
    }
  }, [center, itinerary, map]);

  useEffect(() => {
    if (!map) return;
    const onMoveEnd = () => {
      const c = map.getCenter();
      const exp = expectedRef.current;
      // Primeiro moveend (init do Leaflet): só registra, sem notificar
      if (!exp) {
        expectedRef.current = { lat: c.lat, lon: c.lng };
        return;
      }
      const moved =
        Math.abs(c.lat - exp.lat) > 0.002 || Math.abs(c.lng - exp.lon) > 0.002;
      expectedRef.current = { lat: c.lat, lon: c.lng };
      if (moved && callbackRef.current) {
        callbackRef.current({ lat: c.lat, lon: c.lng, zoom: map.getZoom() });
      }
    };
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [map]);

  return null;
}

function createCustomIcon(number, isItinerary = false, dayNum = 1) {
  const color = isItinerary ? (DAY_HEX[dayNum] || '#f43f5e') : '#0f172a';
  
  const html = `
    <div style="
      background: ${color};
      border: 2px solid #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 12px;
      font-family: sans-serif;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      cursor: pointer;
    ">
      ${number}
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-pin',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

export default function InteractiveMap({
  center = { lat: -22.9068, lon: -43.1729 },
  spots = [],
  itinerary = [],
  onToggleLike,
  onUserNavigate
}) {
  // Agrupa rotas por dia para desenhar linhas com cores diferentes para cada dia
  const daysInItinerary = Array.from(new Set(itinerary.map(item => item.day || 1))).sort((a, b) => a - b);

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={center} itinerary={itinerary} onUserNavigate={onUserNavigate} />

        {/* Candidate & Itinerary Spots Markers */}
        {spots.map((spot, idx) => {
          const itineraryIndex = itinerary.findIndex(item => item.id === spot.id);
          const isLiked = itineraryIndex !== -1;
          const spotDay = isLiked ? (itinerary[itineraryIndex].day || 1) : 1;
          const displayLabel = isLiked ? (itineraryIndex + 1) : (idx + 1);

          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lon]}
              icon={createCustomIcon(displayLabel, isLiked, spotDay)}
            >
              <Popup className="custom-popup">
                <div className="w-52 text-left">
                  <div className="h-20 w-full overflow-hidden rounded-lg mb-2">
                    <img 
                      src={spot.image} 
                      alt={spot.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {isLiked && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1" style={{ backgroundColor: DAY_HEX[spotDay] || '#f43f5e' }}>
                      Dia {spotDay} {itinerary[itineraryIndex].period ? `• ${itinerary[itineraryIndex].period}` : ''}
                    </span>
                  )}

                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {spot.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center text-amber-500 font-semibold">
                      ★ {spot.rating}
                    </span>
                    <span>•</span>
                    <span>{spot.category}</span>
                  </div>
                  <button
                    onClick={() => onToggleLike(spot)}
                    className={`mt-2.5 w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isLiked 
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                        : 'bg-slate-900 text-white hover:bg-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{isLiked ? 'No Roteiro ✓' : 'Adicionar ao Roteiro'}</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Polylines colored by day */}
        {daysInItinerary.map(dayNum => {
          const daySpots = itinerary.filter(i => (i.day || 1) === dayNum);
          if (daySpots.length < 2) return null;
          const coords = daySpots.map(s => [s.lat, s.lon]);

          return (
            <Polyline
              key={`day-${dayNum}`}
              positions={coords}
              pathOptions={{
                color: DAY_HEX[dayNum] || '#f43f5e',
                weight: 5,
                opacity: 0.85,
                dashArray: '6, 8'
              }}
            />
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 text-[11px] shadow-sm flex items-center gap-3">
        {daysInItinerary.length > 0 ? (
          daysInItinerary.map(d => (
            <div key={d} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block border border-white" style={{ backgroundColor: DAY_HEX[d] || '#f43f5e' }}></span>
              <span className="font-bold text-slate-700">Dia {d}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900 inline-block border border-white"></span>
            <span className="text-slate-600">Pontos Próximos</span>
          </div>
        )}
      </div>
    </div>
  );
}
