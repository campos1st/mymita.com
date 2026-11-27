import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  MessageCircle,
  Send,
  Stethoscope,
  Unlock,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  CardapioPlanejado,
  EvolucaoBiometrica,
  MensagemChat,
  PacienteResumo,
  PerfilNutricional,
} from '../types';

export const NutricionistaPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prontuario, setProntuario] = useState<{
    perfil: PerfilNutricional;
    evolucao: EvolucaoBiometrica[];
    cardapio: CardapioPlanejado | null;
    chat: MensagemChat[];
  } | null>(null);

  const [metaKcal, setMetaKcal] = useState(1800);
  const [metaProt, setMetaProt] = useState(120);
  const [metaCarb, setMetaCarb] = useState(180);
  const [metaGord, setMetaGord] = useState(60);
  const [obsClinicas, setObsClinicas] = useState('');
  const [orientacoes, setOrientacoes] = useState('');
  const [msgChat, setMsgChat] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.listarPacientes().then((list) => {
      setPacientes(list);
      if (list.length > 0) setSelectedId(list[0].clienteId);
    });
  }, []);

  const loadProntuario = async (clienteId: string) => {
    const data = await api.obterProntuario(clienteId);
    setProntuario(data);
    setMetaKcal(data.perfil.metaKcal || 1800);
    setMetaProt(data.perfil.metaProteinaG || 120);
    setMetaCarb(data.perfil.metaCarboG || 180);
    setMetaGord(data.perfil.metaGorduraG || 60);
    setObsClinicas(data.perfil.observacoesClinicas || '');
    setOrientacoes(data.cardapio?.orientacoesNutri || '');
  };

  useEffect(() => {
    if (selectedId) loadProntuario(selectedId);
  }, [selectedId]);

  const handleSalvarMetas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await api.ajustarMetasNutri(selectedId, {
      metaKcal,
      metaProteinaG: metaProt,
      metaCarboG: metaCarb,
      metaGorduraG: metaGord,
      observacoesClinicas: obsClinicas,
    });
    notify('Metas clínicas salvas! A IA agora obedece rigorosamente esta prescrição (RN06).');
    loadProntuario(selectedId);
  };

  const handleTravarItem = async (itemId: number) => {
    if (!selectedId) return;
    await api.alternarTravaNutri(itemId);
    notify('Status de trava clínica da refeição atualizado (RN06).');
    loadProntuario(selectedId);
  };

  const handleAprovarCardapio = async () => {
    if (!selectedId || !prontuario?.cardapio) return;
    await api.aprovarCardapio(prontuario.cardapio.id, orientacoes);
    notify('Cardápio clínico aprovado com sucesso (RF05)!');
    loadProntuario(selectedId);
  };

  const handleEnviarChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !msgChat.trim()) return;
    await api.responderChatNutri(selectedId, msgChat.trim());
    setMsgChat('');
    loadProntuario(selectedId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#2E7D32] dark:text-emerald-400">
            <Stethoscope className="w-4 h-4" /> Painel Clínico — Nutricionista
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Acompanhamento de Pacientes</h1>
        </div>
      </div>

      {toast && (
        <div role="status" className="p-3.5 rounded-xl bg-[#E8F5E9] dark:bg-[#143628] text-[#1B5E20] dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Lista de pacientes vinculados (RF04) */}
        <aside className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8] flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Pacientes ({pacientes.length})
          </h2>
          {pacientes.map((p) => (
            <button
              key={p.clienteId}
              type="button"
              onClick={() => setSelectedId(p.clienteId)}
              className={`w-full mymita-card p-4 text-left transition ${
                selectedId === p.clienteId ? 'ring-2 ring-[#2E7D32]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">{p.nome}</p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
                  {p.objetivo}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mt-1">
                Meta: {p.metaKcal || '--'} kcal • Prot: {p.metaProteinaG || '--'}g • Peso: {p.pesoAtual || '--'} kg
              </p>
            </button>
          ))}
        </aside>

        {/* Prontuário, Prescrição & Chat Clínico */}
        {prontuario && (
          <div className="lg:col-span-8 space-y-6">
            {/* Prescrição de Metas Manuais (RF04 + RN06) */}
            <form onSubmit={handleSalvarMetas} className="mymita-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-lg">Prontuário de {prontuario.perfil.clienteNome}</h2>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                    Alergias: {prontuario.perfil.alergias.join(', ') || 'Nenhuma'} • Restrições:{' '}
                    {prontuario.perfil.restricoes.join(', ') || 'Nenhuma'} • TMB: {prontuario.perfil.tmbKcal} kcal
                  </p>
                </div>
                <span className="text-xs font-bold text-[#2E7D32] dark:text-emerald-400">
                  Soberania Clínica (RN06)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="n-kcal" className="block text-xs font-semibold mb-1">Meta Kcal</label>
                  <input id="n-kcal" type="number" value={metaKcal} onChange={(e) => setMetaKcal(Number(e.target.value))} className="mymita-input" />
                </div>
                <div>
                  <label htmlFor="n-prot" className="block text-xs font-semibold mb-1">Proteína (g)</label>
                  <input id="n-prot" type="number" value={metaProt} onChange={(e) => setMetaProt(Number(e.target.value))} className="mymita-input" />
                </div>
                <div>
                  <label htmlFor="n-carb" className="block text-xs font-semibold mb-1">Carbo (g)</label>
                  <input id="n-carb" type="number" value={metaCarb} onChange={(e) => setMetaCarb(Number(e.target.value))} className="mymita-input" />
                </div>
                <div>
                  <label htmlFor="n-gord" className="block text-xs font-semibold mb-1">Gordura (g)</label>
                  <input id="n-gord" type="number" value={metaGord} onChange={(e) => setMetaGord(Number(e.target.value))} className="mymita-input" />
                </div>
              </div>

              <div>
                <label htmlFor="n-obs" className="block text-xs font-semibold mb-1">Observações clínicas</label>
                <textarea id="n-obs" rows={2} value={obsClinicas} onChange={(e) => setObsClinicas(e.target.value)} className="mymita-input !min-h-[68px]" />
              </div>

              <button type="submit" className="mymita-btn-green text-sm">
                Salvar e Travar Metas Clínicas
              </button>
            </form>

            {/* Aprovação e Travamento de Refeições do Cardápio (RF05 + RN06) */}
            {prontuario.cardapio && (
              <div className="mymita-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-base">
                    Cardápio Semanal ({prontuario.cardapio.statusAprovacao})
                  </h2>
                  <button type="button" onClick={handleAprovarCardapio} className="mymita-btn-primary text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Aprovar Cardápio
                  </button>
                </div>

                <div>
                  <label htmlFor="n-orient" className="block text-xs font-semibold mb-1">
                    Orientações de horários e hidratação
                  </label>
                  <input
                    id="n-orient"
                    type="text"
                    value={orientacoes}
                    onChange={(e) => setOrientacoes(e.target.value)}
                    className="mymita-input"
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {prontuario.cardapio.itens.slice(0, 10).map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold">
                          {it.diaSemana} • {it.tipoLabel} — {it.marmita.nome}
                        </p>
                        <p className="text-[#5F6368] dark:text-[#94A3B8]">
                          {it.marmita.kcal} kcal • P:{it.marmita.proteinaG}g C:{it.marmita.carboG}g
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTravarItem(it.id)}
                        className={`min-h-[36px] px-3 rounded-lg font-bold inline-flex items-center gap-1 ${
                          it.travadoNutri
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-white dark:bg-[#1C252D] border border-[#DCE1E7] dark:border-[#26323D]'
                        }`}
                      >
                        {it.travadoNutri ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        {it.travadoNutri ? 'Travada' : 'Travar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Clínico Direto com o Paciente (RF06) */}
            <div className="mymita-card p-5 space-y-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#E53935]" /> Chat Híbrido com Paciente
              </h2>
              <div className="space-y-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#101418]">
                {prontuario.chat.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      m.remetenteTipo === 'NUTRICIONISTA'
                        ? 'bg-[#E8F5E9] dark:bg-[#143628] ml-8'
                        : 'bg-white dark:bg-[#1C252D] mr-8'
                    }`}
                  >
                    <p className="font-bold text-[10px] uppercase text-[#5F6368] dark:text-[#94A3B8] mb-0.5">
                      {m.remetenteTipo}
                    </p>
                    <p>{m.conteudo}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleEnviarChat} className="flex gap-2">
                <input
                  type="text"
                  value={msgChat}
                  onChange={(e) => setMsgChat(e.target.value)}
                  placeholder="Enviar orientação clínica para o paciente..."
                  className="mymita-input flex-1"
                />
                <button type="submit" className="mymita-btn-green">
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
