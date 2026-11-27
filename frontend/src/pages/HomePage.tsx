import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  Coffee,
  Droplets,
  Flame,
  LayoutGrid,
  MessageCircle,
  Moon,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { MealDetailModal } from '../components/MealDetailModal';
import type { CardapioPlanejado, DiaSemana, Marmita, PerfilNutricional, Plano, TipoRefeicao } from '../types';

const DIAS_SEMANA: { key: DiaSemana; label: string; num: string }[] = [
  { key: 'SEG', label: 'Seg', num: '26' },
  { key: 'TER', label: 'Ter', num: '27' },
  { key: 'QUA', label: 'Qua', num: '28' },
  { key: 'QUI', label: 'Qui', num: '29' },
  { key: 'SEX', label: 'Sex', num: '30' },
  { key: 'SAB', label: 'Sáb', num: '01' },
  { key: 'DOM', label: 'Dom', num: '02' },
];

const getMealIcon = (tipo: TipoRefeicao) => {
  switch (tipo) {
    case 'CAFE_MANHA':
      return <Coffee className="w-3.5 h-3.5 text-amber-500" />;
    case 'JANTAR':
      return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    default:
      return <Utensils className="w-3.5 h-3.5 text-[#E53935]" />;
  }
};

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { addMarmita } = useCart();
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState<DiaSemana>('SEG');
  const [cardapio, setCardapio] = useState<CardapioPlanejado | null>(null);
  const [perfil, setPerfil] = useState<PerfilNutricional | null>(null);
  const [publicMarmitas, setPublicMarmitas] = useState<Marmita[]>([]);
  const [publicPlanos, setPublicPlanos] = useState<Plano[]>([]);
  const [selectedMarmita, setSelectedMarmita] = useState<Marmita | null>(null);

  useEffect(() => {
    if (user?.role === 'NUTRICIONISTA') {
      navigate('/nutricionista', { replace: true });
      return;
    }
    if (user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
      return;
    }
    if (user) {
      Promise.all([api.getCardapioAtual(), api.getPerfil()])
        .then(([c, p]) => {
          setCardapio(c);
          setPerfil(p);
        })
        .catch(() => {});
    } else {
      Promise.all([api.listarMarmitas(), api.listarPlanos()])
        .then(([m, pl]) => {
          setPublicMarmitas(m.slice(0, 4));
          setPublicPlanos(pl.slice(0, 3));
        })
        .catch(() => {});
    }
  }, [user, navigate]);

  // Landing Page Pública (quando não logado)
  if (!user) {
    return (
      <div className="space-y-12 py-4">
        <section className="mymita-card p-6 sm:p-10 bg-gradient-to-br from-white via-white to-[#E8F5E9]/70 dark:from-[#1C252D] dark:via-[#1C252D] dark:to-[#143628]/70 overflow-hidden relative">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E53935]/10 text-[#E53935]">
              <Sparkles className="w-3.5 h-3.5" /> IA Nutricional + Nutricionista CRN + Entregas Recorrentes
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Sua alimentação saudável no <span className="text-[#E53935]">piloto automático.</span>
            </h1>
            <p className="text-base text-[#5F6368] dark:text-[#94A3B8]">
              Receba marmitas fitness frescas alinhadas exatamente às suas metas de calorias e macronutrientes, com assistente de IA Gemini e acompanhamento de nutricionista.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/cadastro" className="mymita-btn-primary">
                Montar meu plano agora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="mymita-btn-secondary">
                Já tenho conta
              </Link>
              <Link to="/catalogo" className="mymita-btn-secondary">
                Explorar catálogo
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-[#5F6368] dark:text-[#94A3B8]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32]" /> Bloqueio estrito de alergênicos (RN02)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32]" /> Acessibilidade WCAG 2.1 AA & LGPD
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Pratos mais populares</h2>
              <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
                Ficha nutricional completa e ingredientes selecionados
              </p>
            </div>
            <Link to="/catalogo" className="text-sm font-semibold text-[#E53935] hover:underline">
              Ver catálogo completo →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {publicMarmitas.map((m) => (
              <article key={m.id} className="mymita-card overflow-hidden flex flex-col">
                <img src={m.imagemUrl} alt={m.altText} className="h-40 w-full object-cover" />
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#2E7D32] dark:text-emerald-400">
                      {m.categoria.replace('_', ' ')} • {m.kcal} kcal
                    </span>
                    <h3 className="font-bold mt-1">{m.nome}</h3>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mt-1 line-clamp-2">
                      {m.ingredientes}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8ECEF] dark:border-[#26323D]">
                    <span className="font-extrabold text-[#E53935]">
                      R$ {Number(m.precoAvulso).toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMarmita(m)}
                      className="text-xs font-semibold text-[#2E7D32] dark:text-emerald-400 hover:underline min-h-[36px]"
                    >
                      Ver tabela nutricional
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Planos por Assinatura</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {publicPlanos.map((p) => (
              <div
                key={p.id}
                className={`mymita-card p-6 flex flex-col justify-between gap-4 ${
                  p.destaque ? 'ring-2 ring-[#E53935]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#2E7D32] dark:text-emerald-400">
                      {p.frequencia} • {p.qtdMarmitas} marmitas
                    </span>
                    {p.destaque && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E53935] text-white">
                        Mais popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mt-2">{p.nomePlano}</h3>
                  <p className="text-sm text-[#5F6368] dark:text-[#94A3B8] mt-1">{p.descricao}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-extrabold">
                    R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-[#5F6368] dark:text-[#94A3B8]">
                      /{p.frequencia === 'SEMANAL' ? 'sem' : 'mês'}
                    </span>
                  </p>
                  <Link to="/cadastro" className="mymita-btn-primary w-full">
                    Assinar plano
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MealDetailModal marmita={selectedMarmita} onClose={() => setSelectedMarmita(null)} />
      </div>
    );
  }

  // Tela 1 — Início / Dashboard do Assinante (Fiel ao protótipo p. 25)
  const refeicoesDia = (cardapio?.itens || []).filter((i) => i.diaSemana === selectedDay);
  // Exibe 4 principais cards no grid 2x2 como no protótipo (Café, Almoço, Lanche da tarde, Jantar)
  const cardsPrincipais = refeicoesDia.filter((i) => i.tipoRefeicao !== 'LANCHE_MANHA').slice(0, 4);
  const macrosDia = cardapio?.macrosPorDia?.[selectedDay] || { kcal: 1450, proteinaG: 85, carboG: 140, gorduraG: 45, fibraG: 20 };

  const metaKcal = perfil?.metaKcal || 1800;
  const metaProt = perfil?.metaProteinaG || 120;
  const metaAgua = Number(perfil?.metaAguaLitros || 2.5);
  const kcalConsumidas = refeicoesDia.filter((i) => i.consumido).reduce((a, i) => a + i.marmita.kcal, 0) || macrosDia.kcal;
  const protConsumidas = refeicoesDia.filter((i) => i.consumido).reduce((a, i) => a + i.marmita.proteinaG, 0) || macrosDia.proteinaG;
  const aguaAtual = Math.min(metaAgua, Number((metaAgua * 0.6).toFixed(1)));
  const pctMeta = Math.min(100, Math.round((kcalConsumidas / metaKcal) * 100));

  // SVG Ring geometry
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pctMeta / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Saudação + Pill de Data (igual p. 25) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user.nome.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Sua alimentação saudável no piloto automático.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] text-xs font-semibold">
          <Calendar className="w-4 h-4 text-[#E53935]" />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
        </div>
      </section>

      {/* Seletor Semanal de 7 dias (card vermelho no dia ativo — igual p. 25) */}
      <section aria-label="Seletor de dias da semana" className="mymita-card p-2">
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS_SEMANA.map((d) => {
            const active = selectedDay === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                aria-pressed={active}
                className={`min-h-[58px] rounded-xl flex flex-col items-center justify-center transition font-semibold ${
                  active
                    ? 'bg-[#E53935] text-white shadow-md'
                    : 'hover:bg-[#F5F5F5] dark:hover:bg-[#171D23] text-[#5F6368] dark:text-[#94A3B8]'
                }`}
              >
                <span className="text-xs">{d.label}</span>
                <span className={`text-sm font-bold ${active ? 'text-white' : 'text-[#202124] dark:text-white'}`}>
                  {d.num}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Suas refeições de hoje — Grid 2x2 fiel ao protótipo p. 25 */}
      <section aria-labelledby="titulo-refeicoes-hoje" className="space-y-3">
        <div>
          <h2 id="titulo-refeicoes-hoje" className="text-lg font-bold">
            Suas refeições de hoje
          </h2>
          <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
            Tudo o que você precisa para um dia mais saudável.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cardsPrincipais.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedMarmita(item.marmita)}
              className="mymita-card p-3.5 flex items-center gap-3.5 text-left hover:border-[#E53935]/50 transition group"
            >
              <img
                src={item.marmita.imagemUrl}
                alt={item.marmita.altText}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-[#5F6368] dark:text-[#94A3B8]">
                  {getMealIcon(item.tipoRefeicao)}
                  <span className="font-semibold text-[#202124] dark:text-white">{item.tipoLabel}</span>
                  <span>• {item.horarioSugerido}</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base mt-1 truncate group-hover:text-[#E53935] transition">
                  {item.marmita.nome}
                </h3>
                <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                  {item.marmita.ingredientes}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94A3B8] shrink-0 group-hover:translate-x-0.5 transition" />
            </button>
          ))}
        </div>
      </section>

      {/* Banner Verde CTA — "Seu plano alimentar completo" (igual p. 25) */}
      <Link
        to="/plano"
        className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#E8F5E9] dark:bg-gradient-to-r dark:from-[#123324] dark:to-[#194732] border border-[#2E7D32]/25 hover:brightness-95 dark:hover:brightness-110 transition"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#1B5E20] dark:text-emerald-200">
              Seu plano alimentar completo
            </h2>
            <p className="text-xs text-[#2E7D32] dark:text-emerald-300/80 mt-0.5">
              Acesse todas as refeições da semana, troque opções e ajuste conforme sua rotina.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#2E7D32] dark:text-emerald-300 shrink-0" />
      </Link>

      {/* Card Meta do dia — Anel circular SVG + Calorias, Proteínas, Água (igual p. 25) */}
      <section aria-labelledby="titulo-meta-dia" className="mymita-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-[#E8ECEF] dark:text-[#26323D]"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="#2E7D32"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[#2E7D32] dark:text-emerald-400">
                {pctMeta}%
              </span>
            </div>
            <div>
              <h2 id="titulo-meta-dia" className="font-bold text-base">
                Meta do dia
              </h2>
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                {pctMeta >= 75 ? 'Você está indo muito bem!' : 'Continue registrando suas refeições!'}
              </p>
              {perfil?.metasDefinidasNutri && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-[#2E7D32] dark:text-emerald-400">
                  ✓ Prescrito por {perfil.nutricionistaNome || 'Nutricionista'}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23]">
              <Flame className="w-5 h-5 text-[#E53935] shrink-0" />
              <div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">Calorias</p>
                <p className="text-xs sm:text-sm font-bold">
                  {kcalConsumidas}{' '}
                  <span className="font-normal text-[#5F6368] dark:text-[#94A3B8]">/ {metaKcal}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23]">
              <Utensils className="w-5 h-5 text-[#E53935] shrink-0" />
              <div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">Proteínas</p>
                <p className="text-xs sm:text-sm font-bold">
                  {protConsumidas}{' '}
                  <span className="font-normal text-[#5F6368] dark:text-[#94A3B8]">/ {metaProt}g</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23]">
              <Droplets className="w-5 h-5 text-[#1E88E5] shrink-0" />
              <div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">Água</p>
                <p className="text-xs sm:text-sm font-bold">
                  {aguaAtual.toFixed(1).replace('.', ',')}{' '}
                  <span className="font-normal text-[#5F6368] dark:text-[#94A3B8]">
                    / {metaAgua.toFixed(1).replace('.', ',')}L
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ações rápidas (igual p. 25) */}
      <section aria-labelledby="titulo-acoes-rapidas" className="space-y-3">
        <h2 id="titulo-acoes-rapidas" className="text-base font-bold">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { to: '/plano', label: 'Meu Plano', icon: CalendarDays, bg: 'bg-[#E53935]/10 text-[#E53935]' },
            { to: '/chat', label: 'Falar com Mila', icon: MessageCircle, bg: 'bg-[#2E7D32]/15 text-[#2E7D32] dark:text-emerald-400' },
            { to: '/carrinho', label: 'Carrinho', icon: ShoppingCart, bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
            { to: '/catalogo', label: 'Catálogo', icon: UtensilsCrossed, bg: 'bg-[#1E88E5]/15 text-[#1E88E5]' },
            { to: '/mais', label: 'Mais', icon: LayoutGrid, bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="mymita-card p-4 flex flex-col items-center justify-center gap-2 hover:border-[#E53935]/40 transition"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <MealDetailModal
        marmita={selectedMarmita}
        onClose={() => setSelectedMarmita(null)}
        onAddToCart={(m) => addMarmita(m)}
      />
    </div>
  );
};
