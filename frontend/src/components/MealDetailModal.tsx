import React from 'react';
import { AlertTriangle, Clock, Flame, ShoppingCart, X } from 'lucide-react';
import type { Marmita } from '../types';

interface MealDetailModalProps {
  marmita: Marmita | null;
  onClose: () => void;
  onAddToCart?: (marmita: Marmita) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  marmita,
  onClose,
  onAddToCart,
}) => {
  if (!marmita) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-marmita-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mymita-card w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 w-full">
          <img
            src={marmita.imagemUrl}
            alt={marmita.altText}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha nutricional"
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[#2E7D32] text-white">
            {marmita.categoria.replace('_', ' ')}
          </span>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="modal-marmita-titulo" className="text-xl font-bold">
                {marmita.nome}
              </h2>
              <p className="text-sm text-[#5F6368] dark:text-[#94A3B8] mt-1">
                {marmita.descricao}
              </p>
            </div>
            <span className="text-lg font-extrabold text-[#E53935] whitespace-nowrap">
              R$ {Number(marmita.precoAvulso).toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F5F5] dark:bg-[#171D23]">
              <Flame className="w-3.5 h-3.5 text-[#E53935]" /> {marmita.kcal} kcal
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F5F5] dark:bg-[#171D23]">
              <Clock className="w-3.5 h-3.5 text-[#2E7D32]" /> {marmita.tempoPreparoMin} min
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F5F5] dark:bg-[#171D23]">
              Porção: {marmita.pesoGramas} g
            </span>
          </div>

          {/* Tabela Nutricional Detalhada (RF08) */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Proteínas', val: `${marmita.proteinaG}g`, color: 'text-[#E53935]' },
              { label: 'Carbos', val: `${marmita.carboG}g`, color: 'text-[#2E7D32]' },
              { label: 'Gorduras', val: `${marmita.gorduraG}g`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Fibras', val: `${marmita.fibraG}g`, color: 'text-[#1E88E5]' },
            ].map((macro) => (
              <div
                key={macro.label}
                className="p-2.5 rounded-xl bg-[#F5F5F5] dark:bg-[#171D23] border border-[#E8ECEF] dark:border-[#26323D]"
              >
                <p className={`text-base font-bold ${macro.color}`}>{macro.val}</p>
                <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">{macro.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8] mb-1">
              Ingredientes
            </h3>
            <p className="text-sm">{marmita.ingredientes}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8] mb-1.5">
              Selos de Alergênicos
            </h3>
            {marmita.alergenos.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
                Livre dos principais alergênicos
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {marmita.alergenos.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Contém {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {onAddToCart && (
              <button
                type="button"
                onClick={() => {
                  onAddToCart(marmita);
                  onClose();
                }}
                className="mymita-btn-primary flex-1"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao carrinho
              </button>
            )}
            <button type="button" onClick={onClose} className="mymita-btn-secondary">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
