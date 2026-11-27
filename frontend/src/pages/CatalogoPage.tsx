import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Flame,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { MealDetailModal } from '../components/MealDetailModal';
import type { CategoriaMarmita, Marmita, Plano } from '../types';

const CATEGORIAS: { key: '' | CategoriaMarmita; label: string }[] = [
  { key: '', label: 'Todas' },
  { key: 'FIT', label: 'Fit' },
  { key: 'LOW_CARB', label: 'Low Carb' },
  { key: 'HIPERTROFIA', label: 'Hipertrofia' },
  { key: 'VEGANA', label: 'Vegana' },
];

export const CatalogoPage: React.FC = () => {
  const { user } = useAuth();
  const { addMarmita, selectPlan } = useCart();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'MARMITAS' | 'PLANOS'>('MARMITAS');
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [categoria, setCategoria] = useState<'' | CategoriaMarmita>('');
  const [busca, setBusca] = useState('');
  const [kcalMax, setKcalMax] = useState<number>(600);
  const [filtrarAlergenos, setFiltrarAlergenos] = useState(Boolean(user));
  const [selectedMarmita, setSelectedMarmita] = useState<Marmita | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .listarMarmitas({
        categoria: categoria || undefined,
        busca: busca.trim() || undefined,
        kcalMax,
        filtrarAlergenos: Boolean(user) && filtrarAlergenos,
      })
      .then(setMarmitas)
      .catch(() => {});
  }, [categoria, busca, kcalMax, filtrarAlergenos, user]);

  useEffect(() => {
    api.listarPlanos().then(setPlanos).catch(() => {});
  }, []);

  const handleAdd = (m: Marmita) => {
    addMarmita(m, 1);
    setToast(`"${m.nome}" adicionada ao carrinho!`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleAssinarPlano = (p: Plano) => {
    selectPlan(p);
    if (!user) navigate('/login');
    else navigate('/carrinho');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Catálogo & Planos</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Marmitas fitness com tabela nutricional completa e planos semanais/mensais recorrentes.
          </p>
        </div>
        <div className="inline-flex rounded-xl p-1 bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D]">
          <button
            type="button"
            onClick={() => setTab('MARMITAS')}
            aria-pressed={tab === 'MARMITAS'}
            className={`min-h-[40px] px-4 rounded-lg text-sm font-bold transition ${
              tab === 'MARMITAS' ? 'bg-[#E53935] text-white' : 'text-[#5F6368] dark:text-[#94A3B8]'
            }`}
          >
            Marmitas ({marmitas.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('PLANOS')}
            aria-pressed={tab === 'PLANOS'}
            className={`min-h-[40px] px-4 rounded-lg text-sm font-bold transition ${
              tab === 'PLANOS' ? 'bg-[#E53935] text-white' : 'text-[#5F6368] dark:text-[#94A3B8]'
            }`}
          >
            Planos ({planos.length})
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-6 z-40 px-4 py-3 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold shadow-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      {tab === 'MARMITAS' ? (
        <>
          {/* Filtros Avançados (RF09) */}
          <div className="mymita-card p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5F6368] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <label htmlFor="cat-busca" className="sr-only">
                  Buscar por prato ou ingrediente
                </label>
                <input
                  id="cat-busca"
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por prato ou ingrediente (ex: frango, salmão, quinoa)..."
                  className="mymita-input pl-10"
                />
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#F5F5F5] dark:bg-[#171D23]">
                <SlidersHorizontal className="w-4 h-4 text-[#E53935] shrink-0" />
                <label htmlFor="cat-kcal" className="text-xs font-semibold whitespace-nowrap">
                  Até {kcalMax} kcal
                </label>
                <input
                  id="cat-kcal"
                  type="range"
                  min={200}
                  max={600}
                  step={20}
                  value={kcalMax}
                  onChange={(e) => setKcalMax(Number(e.target.value))}
                  className="w-28 accent-[#E53935]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.key || 'all'}
                    type="button"
                    onClick={() => setCategoria(c.key)}
                    aria-pressed={categoria === c.key}
                    className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold border transition ${
                      categoria === c.key
                        ? 'bg-[#E53935] text-white border-[#E53935]'
                        : 'bg-[#F5F5F5] dark:bg-[#171D23] border-transparent text-[#5F6368] dark:text-[#94A3B8]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {user && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#2E7D32] dark:text-emerald-400">
                  <input
                    type="checkbox"
                    checked={filtrarAlergenos}
                    onChange={(e) => setFiltrarAlergenos(e.target.checked)}
                    className="w-4 h-4 accent-[#2E7D32]"
                  />
                  <ShieldCheck className="w-4 h-4" />
                  Ocultar alergênicos do meu perfil (RN02)
                </label>
              )}
            </div>
          </div>

          {/* Grid de Marmitas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marmitas.map((m) => (
              <article key={m.id} className="mymita-card overflow-hidden flex flex-col">
                <div className="relative h-44">
                  <img src={m.imagemUrl} alt={m.altText} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/65 text-white">
                    {m.categoria.replace('_', ' ')}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E53935] text-white inline-flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {m.kcal} kcal
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base">{m.nome}</h2>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mt-1 line-clamp-2">
                      {m.ingredientes}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] dark:bg-[#171D23]">
                        Prot {m.proteinaG}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] dark:bg-[#171D23]">
                        Carb {m.carboG}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] dark:bg-[#171D23]">
                        Gord {m.gorduraG}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] dark:bg-[#171D23]">
                        Fibra {m.fibraG}g
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E8ECEF] dark:border-[#26323D] gap-2">
                    <div>
                      <p className="text-lg font-extrabold text-[#E53935]">
                        R$ {Number(m.precoAvulso).toFixed(2).replace('.', ',')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedMarmita(m)}
                        className="text-xs font-semibold text-[#2E7D32] dark:text-emerald-400 hover:underline"
                      >
                        Ver Tabela Nutricional
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(m)}
                      className="mymita-btn-primary !px-3.5 text-xs"
                    >
                      <ShoppingCart className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        /* Planos Semanais & Mensais (RF11) */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planos.map((p) => (
            <article
              key={p.id}
              className={`mymita-card p-6 flex flex-col justify-between gap-4 ${
                p.destaque ? 'ring-2 ring-[#E53935]' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
                    {p.frequencia} • {p.qtdMarmitas} refeições
                  </span>
                  {p.destaque && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E53935] text-white">
                      Recomendado
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold">{p.nomePlano}</h2>
                <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">{p.descricao}</p>
                <ul className="text-xs space-y-1.5 pt-2 text-[#5F6368] dark:text-[#94A3B8]">
                  <li className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" /> Cardápio automático com IA Gemini
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> Frete grátis na área de cobertura
                  </li>
                  {p.incluiConsultaNutri && (
                    <li className="flex items-center gap-1.5 font-semibold text-[#2E7D32] dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Inclui acompanhamento com Nutricionista CRN
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E8ECEF] dark:border-[#26323D]">
                <p className="text-3xl font-extrabold">
                  R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                  <span className="text-xs font-normal text-[#5F6368] dark:text-[#94A3B8]">
                    /{p.frequencia === 'SEMANAL' ? 'semana' : 'mês'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => handleAssinarPlano(p)}
                  className="mymita-btn-primary w-full"
                >
                  Assinar este plano
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <MealDetailModal
        marmita={selectedMarmita}
        onClose={() => setSelectedMarmita(null)}
        onAddToCart={handleAdd}
      />
    </div>
  );
};
