import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Package,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Sliders,
  Trash2,
  Truck,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Assinatura, EvolucaoBiometrica, Pedido, StatusEntrega } from '../types';

const STATUS_STEPS: { key: StatusEntrega; label: string }[] = [
  { key: 'AGUARDANDO_PAGAMENTO', label: 'Pagamento' },
  { key: 'CONFIRMADO', label: 'Confirmado' },
  { key: 'EM_PREPARO', label: 'Em Preparo' },
  { key: 'SAIU_PARA_ENTREGA', label: 'A Caminho' },
  { key: 'ENTREGUE', label: 'Entregue' },
];

export const MaisPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'PEDIDOS' | 'ASSINATURA' | 'EVOLUCAO' | 'LGPD'>('PEDIDOS');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoBiometrica[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Check-in físico (RF07)
  const [pesoKg, setPesoKg] = useState('78.0');
  const [gordura, setGordura] = useState('16.2');
  const [agua, setAgua] = useState('2.5');
  const [notas, setNotas] = useState('');

  // Edição de dados pessoais (LGPD RNF04)
  const [nome, setNome] = useState(user?.nome || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');

  const loadAll = async () => {
    if (!user) return;
    try {
      const [p, a, e] = await Promise.all([
        api.listarPedidos(),
        api.listarAssinaturas(),
        user.role === 'CLIENTE' ? api.listarEvolucao() : Promise.resolve([]),
      ]);
      setPedidos(p);
      setAssinaturas(a);
      setEvolucao(e);
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleCancelarPedido = async (id: number) => {
    setFeedback(null);
    try {
      await api.cancelarPedido(id);
      setFeedback({ type: 'ok', msg: `Pedido #${id} cancelado com sucesso.` });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao cancelar.' });
    }
  };

  const handlePausar = async (id: number) => {
    setFeedback(null);
    const daqui14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    try {
      await api.pausarAssinatura(id, daqui14);
      setFeedback({ type: 'ok', msg: 'Assinatura pausada por 14 dias (férias/viagem).' });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao pausar.' });
    }
  };

  const handleReativar = async (id: number) => {
    setFeedback(null);
    try {
      await api.reativarAssinatura(id);
      setFeedback({ type: 'ok', msg: 'Assinatura reativada!' });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao reativar.' });
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await api.registrarCheckIn({
        pesoKg: Number(pesoKg),
        percentualGordura: gordura ? Number(gordura) : null,
        aguaLitros: agua ? Number(agua) : null,
        notasPaciente: notas,
      });
      setNotas('');
      setFeedback({ type: 'ok', msg: 'Check-in de evolução registrado e compartilhado com seu nutricionista!' });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao registrar check-in.' });
    }
  };

  const handleSalvarDadosLgpd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await api.updateMe({ nome, cpf, telefone });
      await refreshUser();
      setFeedback({ type: 'ok', msg: 'Seus dados pessoais foram atualizados (LGPD).' });
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao atualizar dados.' });
    }
  };

  const handleExcluirContaLgpd = async () => {
    if (!window.confirm('Tem certeza? Esta ação exclui definitivamente sua conta e histórico conforme a LGPD (Lei nº 13.709/2018).')) {
      return;
    }
    try {
      await api.deleteMeLgpd();
      logout();
      navigate('/login');
    } catch (err) {
      setFeedback({ type: 'err', msg: err instanceof ApiError ? err.message : 'Erro ao excluir conta.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Meus Pedidos & Perfil</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Acompanhe entregas, pause sua assinatura, registre sua evolução e gerencie seus dados LGPD.
          </p>
        </div>
        {user?.role === 'CLIENTE' && (
          <Link to="/onboarding" className="mymita-btn-secondary text-xs">
            <Sliders className="w-4 h-4 text-[#E53935]" /> Refazer Onboarding Biométrico
          </Link>
        )}
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'PEDIDOS', label: 'Entregas & Pedidos', icon: Truck },
          { key: 'ASSINATURA', label: 'Minha Assinatura', icon: Package },
          ...(user?.role === 'CLIENTE' ? [{ key: 'EVOLUCAO', label: 'Evolução Física', icon: Activity }] : []),
          { key: 'LGPD', label: 'Perfil & Privacidade (LGPD)', icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              aria-pressed={active}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition ${
                active
                  ? 'bg-[#E53935] text-white'
                  : 'bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D] text-[#5F6368] dark:text-[#94A3B8]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-center gap-2 p-4 rounded-xl text-sm border ${
            feedback.type === 'ok'
              ? 'bg-[#E8F5E9] dark:bg-[#143628] border-[#2E7D32]/30 text-[#1B5E20] dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* TAB 1: Rastreamento de Pedidos (RF15 + RN01) */}
      {tab === 'PEDIDOS' && (
        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <div className="mymita-card p-8 text-center text-sm text-[#5F6368] dark:text-[#94A3B8]">
              Nenhum pedido encontrado ainda.
            </div>
          ) : (
            pedidos.map((p) => {
              const stepIdx = STATUS_STEPS.findIndex((s) => s.key === p.statusEntrega);
              return (
                <article key={p.id} className="mymita-card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-base">
                        Pedido #{p.id} • Entrega em {new Date(p.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')} ({p.janelaHorario})
                      </h2>
                      <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                        {p.endereco.logradouro}, {p.endereco.numero} — {p.endereco.bairro}, {p.endereco.cidade}/{p.endereco.uf}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
                        {p.statusEntrega.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm font-extrabold mt-1">
                        R$ {Number(p.valorTotal).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Stepper de rastreio visual (RF15) */}
                  {p.statusEntrega !== 'CANCELADO' && (
                    <div className="grid grid-cols-5 gap-1.5 pt-2">
                      {STATUS_STEPS.map((s, idx) => (
                        <div key={s.key} className="space-y-1">
                          <div
                            className={`h-2 rounded-full ${
                              idx <= stepIdx ? 'bg-[#2E7D32]' : 'bg-[#E8ECEF] dark:bg-[#26323D]'
                            }`}
                          />
                          <p className="text-[10px] sm:text-xs text-center font-medium text-[#5F6368] dark:text-[#94A3B8]">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8ECEF] dark:border-[#26323D]">
                    <div className="flex flex-wrap gap-2 text-xs text-[#5F6368] dark:text-[#94A3B8]">
                      {p.itens.map((it) => (
                        <span key={it.id} className="px-2.5 py-1 rounded-lg bg-[#F5F5F5] dark:bg-[#171D23]">
                          {it.quantidade}x {it.marmitaNome}
                        </span>
                      ))}
                    </div>
                    {p.podeAlterarOuCancelar && (
                      <button
                        type="button"
                        onClick={() => handleCancelarPedido(p.id)}
                        className="text-xs font-bold text-[#E53935] hover:underline min-h-[36px]"
                      >
                        Cancelar pedido (&gt;24h — RN01)
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Gestão de Assinaturas & Pausa de Ciclo (RF12) */}
      {tab === 'ASSINATURA' && (
        <div className="space-y-4">
          {assinaturas.length === 0 ? (
            <div className="mymita-card p-8 text-center space-y-3">
              <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">Você ainda não possui assinatura ativa.</p>
              <Link to="/catalogo" className="mymita-btn-primary">
                Conhecer Planos
              </Link>
            </div>
          ) : (
            assinaturas.map((a) => (
              <div key={a.id} className="mymita-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      a.status === 'ATIVA'
                        ? 'bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {a.status}
                  </span>
                  <h2 className="text-lg font-extrabold">{a.plano.nomePlano}</h2>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                    {a.plano.qtdMarmitas} refeições ({a.plano.frequencia}) • Próxima cobrança:{' '}
                    {new Date(a.proximaCobranca + 'T12:00:00').toLocaleDateString('pt-BR')} • Janela:{' '}
                    {a.janelaHorarioPreferencial}
                  </p>
                  {a.pausadaAte && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Pausada até {new Date(a.pausadaAte + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div>
                  {a.status === 'ATIVA' ? (
                    <button type="button" onClick={() => handlePausar(a.id)} className="mymita-btn-secondary text-sm">
                      <PauseCircle className="w-4 h-4 text-amber-500" /> Pausar ciclo (viagem)
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleReativar(a.id)} className="mymita-btn-green text-sm">
                      <PlayCircle className="w-4 h-4" /> Reativar assinatura
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Evolução Física & Check-ins com Gráfico SVG (RF07) */}
      {tab === 'EVOLUCAO' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="mymita-card p-5 space-y-4">
            <h2 className="font-bold text-base">Gráfico de Evolução de Peso (kg)</h2>
            {evolucao.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3 h-44 pt-4 px-2 bg-[#F8F9FA] dark:bg-[#171D23] rounded-xl">
                  {evolucao.map((ev) => {
                    const weights = evolucao.map((x) => Number(x.pesoKg));
                    const minW = Math.min(...weights) - 2;
                    const maxW = Math.max(...weights) + 2;
                    const pct = Math.max(18, Math.round(((Number(ev.pesoKg) - minW) / Math.max(1, maxW - minW)) * 100));
                    return (
                      <div key={ev.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                        <span className="text-xs font-bold text-[#2E7D32] dark:text-emerald-400">
                          {Number(ev.pesoKg).toFixed(1)}
                        </span>
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#2E7D32] to-emerald-400 transition-all"
                        />
                        <span className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] pb-1">
                          {new Date(ev.dataRegistro + 'T12:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...evolucao].reverse().map((ev) => (
                    <div key={ev.id} className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23] text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{new Date(ev.dataRegistro + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>
                          {ev.pesoKg} kg {ev.percentualGordura ? `• ${ev.percentualGordura}% GC` : ''}{' '}
                          {ev.aguaLitros ? `• ${ev.aguaLitros}L água` : ''}
                        </span>
                      </div>
                      {ev.notasPaciente && <p className="text-[#5F6368] dark:text-[#94A3B8]">{ev.notasPaciente}</p>}
                      {ev.feedbackNutri && (
                        <p className="text-[#2E7D32] dark:text-emerald-400 font-medium">
                          Nutricionista: {ev.feedbackNutri}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">Nenhum registro ainda.</p>
            )}
          </div>

          <form onSubmit={handleCheckIn} className="mymita-card p-5 space-y-4">
            <h2 className="font-bold text-base">Registrar novo Check-in</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ev-peso" className="block text-xs font-semibold mb-1">
                  Peso (kg)
                </label>
                <input
                  id="ev-peso"
                  type="number"
                  step="0.1"
                  required
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  className="mymita-input"
                />
              </div>
              <div>
                <label htmlFor="ev-gc" className="block text-xs font-semibold mb-1">
                  % Gordura
                </label>
                <input
                  id="ev-gc"
                  type="number"
                  step="0.1"
                  value={gordura}
                  onChange={(e) => setGordura(e.target.value)}
                  className="mymita-input"
                />
              </div>
              <div>
                <label htmlFor="ev-agua" className="block text-xs font-semibold mb-1">
                  Água (L/dia)
                </label>
                <input
                  id="ev-agua"
                  type="number"
                  step="0.1"
                  value={agua}
                  onChange={(e) => setAgua(e.target.value)}
                  className="mymita-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ev-notas" className="block text-xs font-semibold mb-1">
                Notas de adesão / sensação nos treinos
              </label>
              <textarea
                id="ev-notas"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ex: Semana 100% no plano, boa disposição no treino..."
                className="mymita-input !min-h-[88px]"
              />
            </div>
            <button type="submit" className="mymita-btn-green w-full">
              Registrar Check-in
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Perfil & Privacidade LGPD (RNF04) */}
      {tab === 'LGPD' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleSalvarDadosLgpd} className="mymita-card p-5 space-y-4">
            <h2 className="font-bold text-base">Meus Dados Pessoais (Retificação LGPD)</h2>
            <div>
              <label htmlFor="lgpd-nome" className="block text-sm font-semibold mb-1">
                Nome completo
              </label>
              <input
                id="lgpd-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mymita-input"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="lgpd-cpf" className="block text-sm font-semibold mb-1">
                  CPF
                </label>
                <input
                  id="lgpd-cpf"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="mymita-input"
                />
              </div>
              <div>
                <label htmlFor="lgpd-tel" className="block text-sm font-semibold mb-1">
                  Telefone
                </label>
                <input
                  id="lgpd-tel"
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="mymita-input"
                />
              </div>
            </div>
            <button type="submit" className="mymita-btn-primary">
              Salvar alterações
            </button>
          </form>

          <div className="mymita-card p-5 space-y-4 border-l-4 border-l-[#2E7D32]">
            <h2 className="font-bold text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2E7D32]" /> Portal de Privacidade — LGPD (Lei nº 13.709/2018)
            </h2>
            <p className="text-xs leading-relaxed text-[#5F6368] dark:text-[#94A3B8]">
              Seus dados são protegidos com criptografia de senhas (BCrypt), autenticação stateless JWT e nenhum dado de cartão é armazenado na plataforma (conformidade PCI-DSS).
            </p>
            <div className="p-3 rounded-xl bg-[#E8F5E9] dark:bg-[#143628] text-xs font-semibold text-[#1B5E20] dark:text-emerald-200">
              Consentimento explícito LGPD ativo desde{' '}
              {user?.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : 'o cadastro'}.
            </div>
            <div className="pt-3 border-t border-[#E8ECEF] dark:border-[#26323D]">
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mb-3">
                Você tem direito à exclusão definitiva de sua conta, prontuário biométrico e histórico de mensagens.
              </p>
              <button
                type="button"
                onClick={handleExcluirContaLgpd}
                className="mymita-btn-secondary text-[#E53935] border-[#E53935]/40 hover:bg-[#E53935]/10"
              >
                <Trash2 className="w-4 h-4" /> Solicitar exclusão definitiva da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
