import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useCart } from '../contexts/CartContext';
import type { CardapioItem, CardapioPlanejado, DiaSemana, Marmita } from '../types';

const DIAS: { key: DiaSemana; curto: string; completo: string; dataLabel: string }[] = [
  { key: 'SEG', curto: 'Seg', completo: 'Segunda-feira', dataLabel: '26/04' },
  { key: 'TER', curto: 'Ter', completo: 'Terça-feira', dataLabel: '27/04' },
  { key: 'QUA', curto: 'Qua', completo: 'Quarta-feira', dataLabel: '28/04' },
  { key: 'QUI', curto: 'Qui', completo: 'Quinta-feira', dataLabel: '29/04' },
  { key: 'SEX', curto: 'Sex', completo: 'Sexta-feira', dataLabel: '30/04' },
  { key: 'SAB', curto: 'Sáb', completo: 'Sábado', dataLabel: '01/05' },
  { key: 'DOM', curto: 'Dom', completo: 'Domingo', dataLabel: '02/05' },
];

export const PlanoPage: React.FC = () => {
  const { addMarmita } = useCart();
  const [cardapio, setCardapio] = useState<CardapioPlanejado | null>(null);
  const [selectedDay, setSelectedDay] = useState<DiaSemana>('SEG');
  const [marmitasSeguras, setMarmitasSeguras] = useState<Marmita[]>([]);
  const [swapTarget, setSwapTarget] = useState<CardapioItem | null>(null);
  const [loadingIa, setLoadingIa] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const loadData = async () => {
    try {
      const [c, m] = await Promise.all([
        api.getCardapioAtual(),
        api.listarMarmitas({ filtrarAlergenos: true }),
      ]);
      setCardapio(c);
      setMarmitasSeguras(m);
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao carregar plano.' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGerarComIa = async () => {
    setLoadingIa(true);
    setFeedback(null);
    try {
      const novo = await api.gerarCardapioIa();
      setCardapio(novo);
      setFeedback({
        type: 'ok',
        msg: 'Cardápio regenerado pela IA respeitando suas alergias (RN02) e refeições travadas pelo nutricionista (RN06)!',
      });
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao gerar cardápio.' });
    } finally {
      setLoadingIa(false);
    }
  };

  const handleTrocarPrato = async (novaMarmitaId: number) => {
    if (!swapTarget) return;
    setFeedback(null);
    try {
      const atualizado = await api.trocarPrato(swapTarget.id, novaMarmitaId);
      setCardapio(atualizado);
      setSwapTarget(null);
      setFeedback({ type: 'ok', msg: 'Refeição substituída e macros recalculados em tempo real!' });
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Não foi possível trocar a refeição.' });
      setSwapTarget(null);
    }
  };

  const handleConsumido = async (itemId: number) => {
    try {
      const atualizado = await api.alternarConsumido(itemId);
      setCardapio(atualizado);
    } catch {}
  };

  const handleAdicionarDiaAoCarrinho = () => {
    const itensDia = (cardapio?.itens || []).filter((i) => i.diaSemana === selectedDay);
    itensDia.forEach((i) => addMarmita(i.marmita, 1));
    setFeedback({ type: 'ok', msg: `${itensDia.length} refeições de ${diaInfo.completo} adicionadas ao carrinho!` });
  };

  const diaInfo = DIAS.find((d) => d.key === selectedDay) || DIAS[0];
  const itensDia = (cardapio?.itens || []).filter((i) => i.diaSemana === selectedDay);
  const macrosDia = cardapio?.macrosPorDia?.[selectedDay];

  return (
    <div className="space-y-6">
      {/* Cabeçalho fiel à Tela 2 (p. 26) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Meu Plano Alimentar</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Seu plano personalizado para uma semana mais saudável.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGerarComIa}
            disabled={loadingIa}
            className="mymita-btn-green text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {loadingIa ? 'Gerando...' : 'Otimizar com IA'}
          </button>
          <button type="button" onClick={handleAdicionarDiaAoCarrinho} className="mymita-btn-secondary text-sm">
            <ShoppingCart className="w-4 h-4 text-[#E53935]" />
            Adicionar dia ao carrinho
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl text-sm border ${
            feedback.type === 'ok'
              ? 'bg-[#E8F5E9] dark:bg-[#143628] border-[#2E7D32]/30 text-[#1B5E20] dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedback.msg}
          </span>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Fechar aviso" className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navegador de semana + 7 dias (igual p. 26) */}
      <div className="mymita-card p-3 space-y-3">
        <div className="flex items-center justify-between px-2">
          <button type="button" aria-label="Semana anterior" className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#171D23]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-2 text-sm font-bold">
            <Calendar className="w-4 h-4 text-[#E53935]" />
            <span>Seg, 26/04 - Dom, 02/05</span>
            {cardapio?.statusAprovacao === 'APROVADO_NUTRI' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
                Aprovado pelo Nutri
              </span>
            )}
          </div>
          <button type="button" aria-label="Próxima semana" className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#171D23]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d) => {
            const active = selectedDay === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                aria-pressed={active}
                className={`min-h-[54px] rounded-xl flex flex-col items-center justify-center transition ${
                  active
                    ? 'bg-[#E53935] text-white shadow'
                    : 'hover:bg-[#F5F5F5] dark:hover:bg-[#171D23] text-[#5F6368] dark:text-[#94A3B8]'
                }`}
              >
                <span className="text-xs font-medium">{d.curto}</span>
                <span className={`text-sm font-bold ${active ? 'text-white' : 'text-[#202124] dark:text-white'}`}>
                  {d.dataLabel.split('/')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cabeçalho do dia + recálculo de macros em tempo real (RF10) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold">
            {diaInfo.completo}{' '}
            <span className="font-normal text-[#5F6368] dark:text-[#94A3B8]">{diaInfo.dataLabel}</span>
          </h2>
        </div>

        {macrosDia && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-[#E53935]/10 text-[#E53935]">
              {macrosDia.kcal} kcal
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#2E7D32]/15 text-[#2E7D32] dark:text-emerald-300">
              P: {macrosDia.proteinaG}g
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              C: {macrosDia.carboG}g
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#1E88E5]/15 text-[#1E88E5]">
              G: {macrosDia.gorduraG}g
            </span>
          </div>
        )}
      </div>

      {cardapio?.orientacoesNutri && (
        <div className="p-4 rounded-2xl bg-[#F5F5F5] dark:bg-[#171D23] border border-[#E8ECEF] dark:border-[#26323D] text-xs sm:text-sm">
          <strong className="text-[#2E7D32] dark:text-emerald-400">Orientações do Nutricionista:</strong>{' '}
          {cardapio.orientacoesNutri}
        </div>
      )}

      {/* Lista de Refeições do dia (fiel à p. 26) */}
      <div className="space-y-3">
        {itensDia.map((item) => (
          <article
            key={item.id}
            className="mymita-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={item.marmita.imagemUrl}
                alt={item.marmita.altText}
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6368] dark:text-[#94A3B8]">
                  <span className="font-semibold text-[#202124] dark:text-white">
                    {item.tipoLabel} / {item.horarioSugerido}
                  </span>
                  {item.travadoNutri && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <Lock className="w-3 h-3" /> Travado pelo Nutri (RN06)
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base">{item.marmita.nome}</h3>
                <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">{item.marmita.ingredientes}</p>
                <p className="text-[11px] font-medium text-[#5F6368] dark:text-[#94A3B8]">
                  P: {item.marmita.proteinaG}g • C: {item.marmita.carboG}g • G: {item.marmita.gorduraG}g • Fibras: {item.marmita.fibraG}g
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#E53935]">
                <Flame className="w-4 h-4" /> {item.marmita.kcal} kcal
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConsumido(item.id)}
                  aria-pressed={item.consumido}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition ${
                    item.consumido
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-[#F5F5F5] dark:bg-[#171D23] border-[#DCE1E7] dark:border-[#26323D]'
                  }`}
                >
                  {item.consumido ? '✓ Consumida' : 'Marcar'}
                </button>
                <button
                  type="button"
                  disabled={item.travadoNutri}
                  onClick={() => setSwapTarget(item)}
                  title={
                    item.travadoNutri
                      ? 'Refeição travada na prescrição nutricional (RN06)'
                      : 'Trocar prato com recálculo instantâneo de macros'
                  }
                  className="min-h-[38px] px-3 rounded-xl text-xs font-semibold bg-[#F5F5F5] dark:bg-[#171D23] border border-[#DCE1E7] dark:border-[#26323D] hover:border-[#E53935] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Trocar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Banner Verde inferior — "Seu plano está completo!" (fiel à p. 26) */}
      <Link
        to="/chat"
        className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#E8F5E9] dark:bg-gradient-to-r dark:from-[#123324] dark:to-[#194732] border border-[#2E7D32]/25"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-[#2E7D32] dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-sm sm:text-base text-[#1B5E20] dark:text-emerald-200">
              Seu plano está completo!
            </p>
            <p className="text-xs text-[#2E7D32] dark:text-emerald-300/80">
              Você pode ver os detalhes de cada refeição ou pedir substituições para a Mila.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#2E7D32] dark:text-emerald-300 shrink-0" />
      </Link>

      {/* Modal de Troca Dinâmica de Prato (RF10 + RN02) */}
      {swapTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-troca-titulo"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSwapTarget(null)}
        >
          <div
            className="mymita-card w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E8ECEF] dark:border-[#26323D] flex items-center justify-between">
              <div>
                <h2 id="modal-troca-titulo" className="font-bold text-lg">
                  Trocar {swapTarget.tipoLabel}
                </h2>
                <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                  Exibindo apenas opções 100% seguras para suas restrições e alergias (RN02)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwapTarget(null)}
                aria-label="Fechar modal de troca"
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#171D23]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2.5">
              {marmitasSeguras.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleTrocarPrato(m.id)}
                  className="w-full p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23] hover:border-[#E53935] border border-transparent flex items-center gap-3 text-left transition"
                >
                  <img src={m.imagemUrl} alt={m.altText} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{m.nome}</p>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                      {m.kcal} kcal • P: {m.proteinaG}g • C: {m.carboG}g • G: {m.gorduraG}g
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#2E7D32] dark:text-emerald-400">Selecionar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
