import React, { useState } from 'react';
import { 
  X, Sparkles, Calendar, Target, Zap, Clock, 
  MapPin, CheckCircle2, ArrowRight, Compass 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AutoItineraryModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  locationName, 
  availableSpotsCount = 0 
}) {
  const [days, setDays] = useState(2);
  const [attractionsPerDay, setAttractionsPerDay] = useState(3);
  const [category, setCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const totalAttractions = days * attractionsPerDay;

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      onGenerate({
        days: Number(days),
        attractionsPerDay: Number(attractionsPerDay),
        category
      });
      setIsGenerating(false);
      onClose();

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#ec4899', '#3b82f6', '#10b981']
        });
      } catch {}
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">
                Gerador Automático de Roteiro
              </h3>
              <p className="text-xs text-rose-100">
                Otimizado por proximidade geográfica em {locationName || 'sua busca'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-left text-slate-700">
          
          {/* Days selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-500" />
              1. Quantidade de Dias da Viagem
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDays(num)}
                  className={`py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                    days === num
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {num}d
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Planejamento para <strong>{days} {days === 1 ? 'dia' : 'dias'}</strong> de estadia.
            </p>
          </div>

          {/* Attractions per day selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-500" />
              2. Atrações por Dia (Ritmo da Viagem)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { count: 2, label: 'Relaxado', desc: '2 por dia' },
                { count: 3, label: 'Equilibrado', desc: '3 por dia' },
                { count: 4, label: 'Intenso', desc: '4 por dia' }
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setAttractionsPerDay(item.count)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    attractionsPerDay === item.count
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-rose-500" />
              3. Foco do Roteiro
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: '🌟 Todos os Destaques' },
                { id: 'museu', label: '🏛️ Cultura & Museus' },
                { id: 'parque', label: '🌿 Natureza & Parques' },
                { id: 'mirante', label: '📸 Mirantes & Vistas' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Resumo da Geração:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {days} dias × {attractionsPerDay} atrações = <span className="text-rose-600">{totalAttractions} atrações no roteiro</span>
              </p>
            </div>
            <div className="text-right text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              ✓ Rotas Otimizadas
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Gerando Roteiro...' : 'Gerar Roteiro Agora'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
