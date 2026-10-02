import React, { useState } from 'react';
import { 
  Heart, Trash2, ArrowUp, ArrowDown, Share2, 
  Sparkles, Clock, MapPin, Calendar, Sun, Sunrise, Sunset, Moon, Plus
} from 'lucide-react';

const DAY_COLORS = {
  1: { badge: 'bg-blue-500 text-white', border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50' },
  2: { badge: 'bg-rose-500 text-white', border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50' },
  3: { badge: 'bg-emerald-500 text-white', border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  4: { badge: 'bg-purple-500 text-white', border: 'border-purple-200', text: 'text-purple-700', bg: 'bg-purple-50' },
  5: { badge: 'bg-amber-500 text-white', border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50' },
  6: { badge: 'bg-cyan-500 text-white', border: 'border-cyan-200', text: 'text-cyan-700', bg: 'bg-cyan-50' },
  7: { badge: 'bg-indigo-500 text-white', border: 'border-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50' },
};

function getPeriodIcon(period) {
  if (!period) return <Sun className="w-3 h-3 text-amber-500" />;
  if (period.includes('Manhã')) return <Sunrise className="w-3 h-3 text-amber-500" />;
  if (period.includes('Tarde')) return <Sun className="w-3 h-3 text-orange-500" />;
  if (period.includes('Fim') || period.includes('Pôr')) return <Sunset className="w-3 h-3 text-rose-500" />;
  return <Moon className="w-3 h-3 text-indigo-500" />;
}

export default function ItineraryPanel({ 
  itinerary, 
  onRemoveItem, 
  onMoveUp, 
  onMoveDown, 
  onClearItinerary,
  onExport,
  onOpenAutoGenerator,
  onChangeDay
}) {
  const [selectedDayTab, setSelectedDayTab] = useState('all');
  const [notes, setNotes] = useState({});

  const handleNoteChange = (id, text) => {
    setNotes(prev => ({ ...prev, [id]: text }));
  };

  // Extrai lista única de dias presentes no roteiro
  const availableDays = Array.from(new Set(itinerary.map(item => item.day || 1))).sort((a, b) => a - b);

  // Calcula tempo total estimado
  const calculateTotalTime = (items) => {
    let totalHours = 0;
    items.forEach(item => {
      if (item.estimatedTime) {
        const matches = item.estimatedTime.match(/(\d+(\.\d+)?)/g);
        if (matches && matches.length > 0) {
          totalHours += parseFloat(matches[matches.length - 1]);
        } else {
          totalHours += 2;
        }
      } else {
        totalHours += 1.5;
      }
    });
    return totalHours;
  };

  const totalTime = calculateTotalTime(itinerary);

  // Filtra itens pelo tab de dia selecionado
  const filteredItinerary = selectedDayTab === 'all' 
    ? itinerary 
    : itinerary.filter(item => (item.day || 1) === Number(selectedDayTab));

  if (itinerary.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white mb-4 shadow-md shadow-rose-500/20">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Crie seu Roteiro de Viagem</h3>
        <p className="text-slate-500 text-xs sm:text-sm max-w-sm mt-1.5 leading-relaxed">
          Você pode <strong>curtir atrações individualmente</strong> ou gerar um roteiro automático completo definindo a quantidade de dias e atrações.
        </p>
        
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
          <button
            onClick={onOpenAutoGenerator}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Roteiro Automático</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
              Meu Roteiro de Viagem
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs backdrop-blur-xs">
              {itinerary.length} {itinerary.length === 1 ? 'parada' : 'paradas'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-rose-100 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-200" />
              {availableDays.length} {availableDays.length === 1 ? 'dia' : 'dias'} planejados
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-200" />
              ~{totalTime}h totais
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAutoGenerator}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            title="Ajustar ou gerar novo roteiro automático"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerar Automático</span>
          </button>

          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Exportar roteiro"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={onClearItinerary}
            className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Limpar roteiro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Filter Tabs */}
      {availableDays.length > 1 && (
        <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedDayTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDayTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos os Dias ({itinerary.length})
          </button>

          {availableDays.map(dayNum => {
            const count = itinerary.filter(i => (i.day || 1) === dayNum).length;
            const style = DAY_COLORS[dayNum] || DAY_COLORS[1];
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDayTab(String(dayNum))}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedDayTab === String(dayNum)
                    ? `${style.badge} shadow-xs`
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Dia {dayNum}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Itinerary List */}
      <div className="p-4 sm:p-5 divide-y divide-slate-100 overflow-y-auto max-h-[480px]">
        {filteredItinerary.map((spot, index) => {
          const dayNum = spot.day || 1;
          const dayStyle = DAY_COLORS[dayNum] || DAY_COLORS[1];
          const actualIndex = itinerary.findIndex(item => item.id === spot.id);

          return (
            <div key={spot.id} className="py-3.5 first:pt-0 last:pb-0 group">
              <div className="flex items-start gap-3">
                
                {/* Number & Day Badge */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-8 h-8 rounded-xl ${dayStyle.badge} font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-xs mt-0.5`}>
                    {actualIndex + 1}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${dayStyle.bg} ${dayStyle.text}`}>
                    Dia {dayNum}
                  </span>
                </div>

                {/* Spot Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
                      {spot.name}
                    </h4>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onMoveUp(actualIndex)}
                        disabled={actualIndex === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveDown(actualIndex)}
                        disabled={actualIndex === itinerary.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(spot.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Remover do roteiro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Period & Category & Duration */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    {spot.period && (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getPeriodIcon(spot.period)}
                        <span>{spot.period}</span>
                      </span>
                    )}
                    <span className="font-semibold text-rose-600">{spot.category}</span>
                    <span>•</span>
                    <span>⏱️ {spot.estimatedTime || '1.5h'}</span>

                    {/* Day changer dropdown */}
                    {onChangeDay && availableDays.length > 1 && (
                      <select
                        value={dayNum}
                        onChange={(e) => onChangeDay(spot.id, Number(e.target.value))}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1 py-0.5 font-medium text-slate-700 outline-none cursor-pointer"
                        title="Mudar dia desta atração"
                      >
                        {availableDays.map(d => (
                          <option key={d} value={d}>Dia {d}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Note input */}
                  <input
                    type="text"
                    placeholder="+ Anotação (ex: comprar ingresso, almoço)..."
                    value={notes[spot.id] || ''}
                    onChange={(e) => handleNoteChange(spot.id, e.target.value)}
                    className="mt-2 w-full px-2.5 py-1 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-rose-400 rounded-lg outline-none text-slate-700 placeholder-slate-400 transition-colors"
                  />
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          💡 Roteiro organizado geograficamente por dias de viagem.
        </div>
        <button
          onClick={onExport}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartilhar / Salvar Roteiro</span>
        </button>
      </div>

    </div>
  );
}
