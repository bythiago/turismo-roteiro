import React, { useState } from 'react';
import { X, Copy, Check, Share2, Printer } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, itinerary, locationName }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const daysInItinerary = Array.from(new Set(itinerary.map(item => item.day || 1))).sort((a, b) => a - b);

  const generateWhatsAppText = () => {
    let text = `✈️ *ROTEIRO DE VIAGEM - ${locationName.toUpperCase()}*\n`;
    text += `📅 Duração: ${daysInItinerary.length} ${daysInItinerary.length === 1 ? 'dia' : 'dias'} | 🎯 Total de Atrações: ${itinerary.length}\n`;
    text += `------------------------------------\n\n`;

    daysInItinerary.forEach((dayNum) => {
      const daySpots = itinerary.filter(i => (i.day || 1) === dayNum);
      text += `📍 *--- DIA ${dayNum} (${daySpots.length} atrações) ---*\n\n`;

      daySpots.forEach((item, idx) => {
        const periodText = item.period ? `[${item.period}] ` : '';
        text += `${idx + 1}. *${periodText}${item.name}*\n`;
        text += `   🏷️ ${item.category} | ⏱️ ${item.estimatedTime || '1.5h'}\n`;
        if (item.address) text += `   🏠 ${item.address}\n`;
        text += `   ⭐ Avaliação: ${item.rating}/5\n\n`;
      });
      text += `\n`;
    });

    text += `✨ Roteiro gerado com RoteiroTur (OpenStreetMap & Dados Abertos)`;
    return text;
  };

  const handleCopy = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Exportar Roteiro por Dias</h3>
              <p className="text-xs text-rose-100">Formatado para WhatsApp, Impressão ou Salvar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto space-y-4 text-left">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
            {generateWhatsAppText()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado para Área de Transferência!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl font-semibold text-sm border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
