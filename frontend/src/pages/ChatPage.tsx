import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCheck,
  Clock,
  Leaf,
  Plus,
  Send,
  ShoppingCart,
  Stethoscope,
  Utensils,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { MealDetailModal } from '../components/MealDetailModal';
import type { Marmita, MensagemChat } from '../types';

const ATALHOS_RAPIDOS = [
  'Quero uma opção de almoço com frango e poucas calorias',
  'Sugira um jantar low carb rico em proteína',
  'Tem alguma opção vegana para o almoço?',
  'Sugira um lanche da tarde sem amendoim',
];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { addMarmita } = useCart();

  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [modo, setModo] = useState<'IA' | 'NUTRICIONISTA'>('IA');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [selectedMarmita, setSelectedMarmita] = useState<Marmita | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .listarMensagensChat()
      .then(setMensagens)
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviar = async (conteudoParaEnviar?: string) => {
    const msg = (conteudoParaEnviar ?? texto).trim();
    if (!msg || enviando) return;
    setTexto('');
    setShowQuick(false);
    setEnviando(true);
    try {
      if (modo === 'IA') {
        const novas = await api.enviarMensagemIa(msg);
        setMensagens((prev) => [...prev, ...novas]);
      } else {
        const nova = await api.enviarMensagemNutri(msg);
        setMensagens((prev) => [...prev, nova]);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] lg:h-[calc(100vh-7.5rem)] mymita-card overflow-hidden">
      {/* Cabeçalho da Assistente Mila + alternador Híbrido Mila / Nutricionista (RF06) */}
      <div className="p-4 border-b border-[#E8ECEF] dark:border-[#26323D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#171D23]">
        <div className="flex items-center gap-3">
          {modo === 'IA' ? (
            <div className="relative shrink-0">
              <img
                src={enviando ? '/mila-thinking.jpg' : '/mila-avatar.jpg'}
                alt="Assistente virtual Mila em 3D"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#2E7D32]"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#2E7D32] ring-2 ring-white dark:ring-[#171D23]"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 bg-[#E53935]">
              <Stethoscope className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-base sm:text-lg leading-tight">
              {modo === 'IA' ? 'Mila • Assistente Nutricional' : 'Chat com Nutricionista'}
            </h1>
            <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
              {modo === 'IA'
                ? 'Tire suas dúvidas sobre alimentação, receitas, planos e substituições!'
                : 'Atendimento direto com seu nutricionista CRN vinculado.'}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl p-1 bg-[#F5F5F5] dark:bg-[#101418] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModo('IA')}
            aria-pressed={modo === 'IA'}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition ${
              modo === 'IA'
                ? 'bg-[#2E7D32] text-white'
                : 'text-[#5F6368] dark:text-[#94A3B8]'
            }`}
          >
            Mila (IA)
          </button>
          <button
            type="button"
            onClick={() => setModo('NUTRICIONISTA')}
            aria-pressed={modo === 'NUTRICIONISTA'}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition ${
              modo === 'NUTRICIONISTA'
                ? 'bg-[#E53935] text-white'
                : 'text-[#5F6368] dark:text-[#94A3B8]'
            }`}
          >
            Nutricionista
          </button>
        </div>
      </div>

      {/* Área de mensagens com aria-live para acessibilidade */}
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F9FA] dark:bg-[#101418]"
      >
        {mensagens.map((m) => {
          const isUser = m.remetenteTipo === 'CLIENTE';
          const isNutri = m.remetenteTipo === 'NUTRICIONISTA';
          const hora = new Date(m.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={m.id} className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                isNutri ? (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 bg-[#E53935]">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                ) : (
                  <img
                    src="/mila-avatar.jpg"
                    alt="Avatar 3D da Mila"
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-[#2E7D32]/40"
                  />
                )
              )}

              <div className={`max-w-[85%] sm:max-w-md space-y-2 ${isUser ? 'items-end flex flex-col' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#EEF2F6] dark:bg-[#1E2B38] text-[#202124] dark:text-white rounded-br-sm'
                      : isNutri
                        ? 'bg-[#FFF5F5] dark:bg-[#2B1C20] border border-[#E53935]/25 rounded-bl-sm'
                        : 'bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] rounded-bl-sm'
                  }`}
                >
                  {isNutri && (
                    <p className="text-[11px] font-bold text-[#E53935] mb-1">
                      Dra. Camila Mendes • Nutricionista CRN
                    </p>
                  )}
                  <p>{m.conteudo}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#5F6368] dark:text-[#94A3B8]">
                    <span>{hora}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#2E7D32]" />}
                  </div>
                </div>

                {/* Rich Card de Marmita sugerida pela IA (100% fiel ao protótipo p. 27!) */}
                {m.marmitaSugerida && (
                  <article className="mymita-card p-3.5 space-y-3 w-full">
                    <h3 className="font-bold text-sm sm:text-base">{m.marmitaSugerida.nome}</h3>
                    <img
                      src={m.marmitaSugerida.imagemUrl}
                      alt={m.marmitaSugerida.altText}
                      className="w-full h-44 rounded-xl object-cover"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
                      <span className="inline-flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-[#E53935]" /> {m.marmitaSugerida.kcal} kcal
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#5F6368] dark:text-[#94A3B8]" />{' '}
                        {m.marmitaSugerida.tempoPreparoMin} min
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#2E7D32] dark:text-emerald-400 font-semibold">
                        <Leaf className="w-3.5 h-3.5" /> {m.marmitaSugerida.proteinaG}g proteínas
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] leading-relaxed">
                      {m.marmitaSugerida.descricao}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMarmita(m.marmitaSugerida!)}
                        className="mymita-btn-green flex-1 text-xs !min-h-[40px]"
                      >
                        Ver receita completa <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => addMarmita(m.marmitaSugerida!)}
                        aria-label={`Adicionar ${m.marmitaSugerida.nome} ao carrinho`}
                        className="mymita-btn-secondary !min-h-[40px] !px-3"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#E53935]" />
                      </button>
                    </div>
                  </article>
                )}
              </div>

              {isUser && (
                <img
                  src={
                    user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome || 'U')}&background=E53935&color=fff`
                  }
                  alt="Seu avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              )}
            </div>
          );
        })}

        {enviando && (
          <div className="flex items-center gap-2.5 text-xs text-[#2E7D32] dark:text-emerald-400">
            <img
              src="/mila-thinking.jpg"
              alt="Mila pensando na melhor recomendação"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#2E7D32] animate-pulse"
            />
            <span>Mila está analisando seu perfil nutricional e alergias...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Sugestões rápidas (+ botão igual p. 27) */}
      {showQuick && (
        <div className="px-4 py-2.5 bg-white dark:bg-[#171D23] border-t border-[#E8ECEF] dark:border-[#26323D] flex flex-wrap gap-2">
          {ATALHOS_RAPIDOS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleEnviar(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#1C252D] hover:bg-[#2E7D32]/15 hover:text-[#2E7D32] dark:hover:text-emerald-300 transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Barra de entrada fixa no rodapé (igual p. 27) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEnviar();
        }}
        className="p-3 sm:p-4 bg-white dark:bg-[#171D23] border-t border-[#E8ECEF] dark:border-[#26323D] flex items-center gap-2.5"
      >
        <button
          type="button"
          onClick={() => setShowQuick((s) => !s)}
          aria-label="Abrir sugestões rápidas de perguntas"
          className="w-11 h-11 rounded-full bg-[#F5F5F5] dark:bg-[#1C252D] flex items-center justify-center text-[#5F6368] dark:text-[#94A3B8] hover:text-[#2E7D32]"
        >
          <Plus className="w-5 h-5" />
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Digite sua mensagem
        </label>
        <input
          id="chat-input"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            modo === 'IA'
              ? 'Digite sua mensagem para a Mila...'
              : 'Escreva uma mensagem para seu nutricionista...'
          }
          className="mymita-input flex-1 !rounded-full"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          aria-label="Enviar mensagem"
          className="w-11 h-11 rounded-full bg-[#2E7D32] hover:bg-[#236227] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <MealDetailModal
        marmita={selectedMarmita}
        onClose={() => setSelectedMarmita(null)}
        onAddToCart={(m) => addMarmita(m)}
      />
    </div>
  );
};
