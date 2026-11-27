import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Maximize2,
  Send,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { MensagemChat } from '../types';

const DICAS_MILA = [
  'Oi! Eu sou a Mila ✨ Quer uma sugestão pro almoço?',
  'Posso trocar pratos do seu plano respeitando suas alergias!',
  'Precisa bater sua meta de proteína hoje? Me chama!',
];

export const MilaAssistantWidget: React.FC = () => {
  const { user } = useAuth();
  const { addMarmita } = useCart();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Não exibe o widget flutuante quando já estamos na tela cheia da Mila (/chat) ou em login/cadastro
  const hiddenRoutes = ['/chat', '/login', '/cadastro'];
  const isHidden =
    hiddenRoutes.includes(location.pathname) ||
    user?.role === 'ADMIN' ||
    user?.role === 'NUTRICIONISTA';

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % DICAS_MILA.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open && user?.role === 'CLIENTE') {
      api
        .listarMensagensChat()
        .then(setMensagens)
        .catch(() => {});
    }
  }, [open, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, open]);

  if (isHidden) return null;

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || pensando || !user) return;
    setTexto('');
    setPensando(true);
    try {
      const novas = await api.enviarMensagemIa(msg);
      setMensagens((prev) => [...prev, ...novas]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-3">
      {/* Mini-chat flutuante da Mila */}
      {open && (
        <section
          aria-label="Assistente nutricional Mila"
          className="animate-mila-pop w-[calc(100vw-2rem)] sm:w-96 mymita-card shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        >
          {/* Cabeçalho da Mila */}
          <div className="p-3.5 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={pensando ? '/mila-thinking.jpg' : '/mila-avatar.jpg'}
                  alt="Rosto 3D da assistente Mila"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/80"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-300 ring-2 ring-[#1B5E20]"
                />
              </div>
              <div className="leading-tight">
                <h2 className="font-extrabold text-sm flex items-center gap-1">
                  Mila <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                </h2>
                <p className="text-[11px] text-emerald-100">
                  {pensando ? 'Pensando na melhor opção...' : 'Sua assistente nutricional MYMita'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <Link
                  to="/chat"
                  onClick={() => setOpen(false)}
                  aria-label="Abrir chat completo com a Mila"
                  title="Expandir chat"
                  className="w-9 h-9 rounded-lg hover:bg-white/15 flex items-center justify-center"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar janela da Mila"
                className="w-9 h-9 rounded-lg hover:bg-white/15 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!user ? (
            <div className="p-5 text-center space-y-3 bg-white dark:bg-[#1C252D]">
              <img
                src="/mila-avatar.jpg"
                alt="Mila acenando"
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-[#2E7D32]/20"
              />
              <p className="text-sm font-bold">Oi! Eu sou a Mila 👋</p>
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                Crie sua conta gratuita para eu calcular suas metas, montar seu cardápio fitness e sugerir pratos seguros para você!
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  to="/cadastro"
                  onClick={() => setOpen(false)}
                  className="mymita-btn-primary flex-1 text-xs"
                >
                  Criar conta
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="mymita-btn-secondary flex-1 text-xs"
                >
                  Entrar
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div
                aria-live="polite"
                className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F8F9FA] dark:bg-[#101418] min-h-[240px]"
              >
                {mensagens.length === 0 && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] text-xs leading-relaxed">
                    <strong className="text-[#2E7D32] dark:text-emerald-400">Mila:</strong> Oi,{' '}
                    {user.nome.split(' ')[0]}! Pode me pedir sugestões de almoço, jantar, lanches ou trocas no seu cardápio que eu respeito todas as suas metas e alergias.
                  </div>
                )}

                {mensagens.slice(-6).map((m) => {
                  const isUser = m.remetenteTipo === 'CLIENTE';
                  return (
                    <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#E53935] text-white rounded-br-sm'
                            : 'bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] rounded-bl-sm'
                        }`}
                      >
                        {m.conteudo}
                      </div>
                      {m.marmitaSugerida && (
                        <div className="max-w-[88%] mymita-card p-2.5 flex items-center gap-2.5">
                          <img
                            src={m.marmitaSugerida.imagemUrl}
                            alt={m.marmitaSugerida.altText}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs truncate">{m.marmitaSugerida.nome}</p>
                            <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">
                              {m.marmitaSugerida.kcal} kcal • {m.marmitaSugerida.proteinaG}g prot
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addMarmita(m.marmitaSugerida!)}
                            aria-label={`Adicionar ${m.marmitaSugerida.nome} ao carrinho`}
                            className="w-9 h-9 rounded-xl bg-[#E53935]/10 text-[#E53935] flex items-center justify-center shrink-0 hover:bg-[#E53935] hover:text-white transition"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {pensando && (
                  <div className="flex items-center gap-2 text-xs text-[#2E7D32] dark:text-emerald-400">
                    <img
                      src="/mila-thinking.jpg"
                      alt="Mila pensando"
                      className="w-7 h-7 rounded-full object-cover animate-pulse"
                    />
                    <span>Mila está pensando...</span>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={handleEnviar}
                className="p-2.5 bg-white dark:bg-[#171D23] border-t border-[#E8ECEF] dark:border-[#26323D] flex items-center gap-2"
              >
                <label htmlFor="mila-mini-input" className="sr-only">
                  Pergunte algo para a Mila
                </label>
                <input
                  id="mila-mini-input"
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Pergunte para a Mila..."
                  className="mymita-input !min-h-[40px] !py-1.5 text-xs flex-1 !rounded-full"
                />
                <button
                  type="submit"
                  disabled={pensando || !texto.trim()}
                  aria-label="Enviar mensagem para a Mila"
                  className="w-10 h-10 rounded-full bg-[#2E7D32] hover:bg-[#236227] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {/* Balão proativo + Botão 3D animado da Mila no canto */}
      <div className="flex items-end gap-2.5">
        {!open && showBubble && (
          <div className="animate-mila-pop hidden sm:flex items-center gap-2 max-w-[235px] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] shadow-lg text-xs">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-left font-medium leading-snug hover:text-[#2E7D32] dark:hover:text-emerald-400 transition"
            >
              {DICAS_MILA[tipIndex]}
            </button>
            <button
              type="button"
              onClick={() => setShowBubble(false)}
              aria-label="Fechar dica da Mila"
              className="text-[#94A3B8] hover:text-[#E53935] p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fechar assistente Mila' : 'Conversar com a assistente Mila'}
          aria-expanded={open}
          className="group relative w-16 h-16 rounded-full animate-mila-float animate-mila-halo p-0.5 bg-gradient-to-tr from-[#2E7D32] via-emerald-400 to-[#E53935] transition-transform hover:scale-110 active:scale-95"
        >
          <img
            src={pensando ? '/mila-thinking.jpg' : '/mila-avatar.jpg'}
            alt="Assistente virtual Mila"
            className="w-full h-full rounded-full object-cover bg-white"
          />
          <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-[#E53935] text-white text-[10px] font-extrabold shadow">
            Mila
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#2E7D32] ring-2 ring-white dark:ring-[#101418]"
          />
        </button>
      </div>
    </div>
  );
};
