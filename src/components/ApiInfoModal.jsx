import React from 'react';
import { X, Database, Globe, CheckCircle2, Zap, Award, Layers } from 'lucide-react';

export default function ApiInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Bases de Dados Gratuitas de Lugares Turísticos</h3>
              <p className="text-xs text-slate-400">APIs abertas e gratuitas integradas neste MVP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left text-sm text-slate-700">
          
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-600" />
              Sim! É 100% possível consumir bases gratuitas e abertas sem pagar nada:
            </p>
            <p className="text-xs mt-1 text-rose-800 leading-relaxed">
              Este MVP utiliza a combinação de <strong>OpenStreetMap (Overpass API + Nominatim)</strong> e <strong>Openverse API</strong> para buscar endereços, pontos turísticos reais e fotos Creative Commons no mundo todo.
            </p>
          </div>

          {/* List of Free APIs */}
          <div className="space-y-4">
            
            {/* API 1 */}
            <div className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900">OpenStreetMap + Overpass API</h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100% Grátis / Sem Key
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Permite buscar coordenadas geográficas ao redor de qualquer ponto com tags como <code>tourism=attraction</code>, <code>tourism=museum</code>, <code>historic=monument</code>, <code>leisure=park</code>.
              </p>
            </div>

            {/* API 2 */}
            <div className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900">Openverse API (fotos Creative Commons)</h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100% Grátis / Sem Key
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Busca 1 foto real por atração no acervo Creative Commons (Flickr, museus, arquivos públicos) via <code>/v1/images/?q=[Nome da atração]</code>, com crédito do autor exibido na galeria.
              </p>
            </div>

            {/* API 3 */}
            <div className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900">OpenTripMap API</h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Tier Gratuito (10k req/mês)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Especializada em turismo, possui ranking de popularidade (<code>rate 1-3h</code>) dos monumentos e atrações mais visitadas por raio de busca ou bounding box.
              </p>
            </div>

            {/* API 4 */}
            <div className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    4
                  </div>
                  <h4 className="font-bold text-slate-900">Nominatim OpenStreetMap Geocoding</h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100% Grátis / Sem Key
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Converte qualquer texto de endereço, bairro ou CEP digitado pelo usuário em coordenadas de latitude e longitude instantaneamente.
              </p>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendido! Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
