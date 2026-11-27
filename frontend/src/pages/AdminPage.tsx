import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  MapPin,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { api } from '../services/api';
import type { FaixaCep, Marmita, RelatorioProducao, StatusEntrega } from '../types';

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<'PRODUCAO' | 'MARMITAS' | 'CEPS'>('PRODUCAO');
  const [producao, setProducao] = useState<RelatorioProducao | null>(null);
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [ceps, setCeps] = useState<FaixaCep[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [novaMarmita, setNovaMarmita] = useState({
    nome: '',
    descricao: '',
    imagemUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    altText: '',
    categoria: 'FIT',
    ingredientes: '',
    kcal: 380,
    proteinaG: 35,
    carboG: 32,
    gorduraG: 10,
    fibraG: 6,
    precoAvulso: 26.9,
  });

  const [novoCep, setNovoCep] = useState({
    cepInicio: '',
    cepFim: '',
    regiao: '',
    taxaEntrega: 0,
  });

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    const [prod, m, c] = await Promise.all([
      api.adminRelatorioProducao(),
      api.adminListarMarmitas(),
      api.adminListarCeps(),
    ]);
    setProducao(prod);
    setMarmitas(m);
    setCeps(c);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleStatus = async (pedidoId: number, statusEntrega: StatusEntrega) => {
    await api.adminAtualizarStatusPedido(pedidoId, statusEntrega);
    notify(`Status do pedido #${pedidoId} atualizado para ${statusEntrega.replace(/_/g, ' ')}.`);
    loadAll();
  };

  const handleCriarMarmita = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCriarMarmita({
      ...novaMarmita,
      altText: novaMarmita.altText || `Foto da marmita ${novaMarmita.nome}`,
      alergenos: [],
    });
    setNovaMarmita({ ...novaMarmita, nome: '', descricao: '', altText: '', ingredientes: '' });
    notify('Nova marmita cadastrada no catálogo!');
    loadAll();
  };

  const handleCriarCep = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCriarCep(novoCep);
    setNovoCep({ cepInicio: '', cepFim: '', regiao: '', taxaEntrega: 0 });
    notify('Faixa de CEP adicionada à malha de cobertura (RN05)!');
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#E53935]">
          <ChefHat className="w-4 h-4" /> Painel Admin & Produção da Cozinha
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Gestão Operacional MyMita</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'PRODUCAO', label: 'Fila de Produção (RN03)', icon: ChefHat },
          { key: 'MARMITAS', label: 'Catálogo de Marmitas', icon: UtensilsCrossed },
          { key: 'CEPS', label: 'Malha de CEPs (RN05)', icon: MapPin },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              aria-pressed={active}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                active
                  ? 'bg-[#E53935] text-white'
                  : 'bg-white dark:bg-[#1C252D] border border-[#E8ECEF] dark:border-[#26323D]'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {toast && (
        <div role="status" className="p-3.5 rounded-xl bg-[#E8F5E9] dark:bg-[#143628] text-[#1B5E20] dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {tab === 'PRODUCAO' && producao && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="mymita-card p-5">
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">Pedidos Confirmados (RN03)</p>
              <p className="text-3xl font-extrabold mt-1">{producao.totalPedidosConfirmados}</p>
            </div>
            <div className="mymita-card p-5">
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">Total de Marmitas a Produzir</p>
              <p className="text-3xl font-extrabold text-[#2E7D32] dark:text-emerald-400 mt-1">
                {producao.totalMarmitas}
              </p>
            </div>
            <div className="mymita-card p-5">
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">Pratos Distintos no Lote</p>
              <p className="text-3xl font-extrabold text-[#E53935] mt-1">{producao.itens.length}</p>
            </div>
          </div>

          <div className="mymita-card p-5 space-y-3">
            <h2 className="font-bold text-base">Consolidado por Prato (ODS 12 — Zero Desperdício)</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {producao.itens.map((it) => (
                <div key={it.marmitaId} className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{it.marmitaNome}</p>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">{it.categoria}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#E53935] text-white font-extrabold text-sm">
                    {it.quantidadeTotal}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-base">Controle Logístico de Pedidos</h2>
            {producao.pedidos.map((p) => (
              <div key={p.id} className="mymita-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold">
                    Pedido #{p.id} — {p.clienteNome}
                  </p>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                    Entrega: {new Date(p.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')} ({p.janelaHorario}) •{' '}
                    {p.endereco.bairro}, {p.endereco.cidade}/{p.endereco.uf}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`st-${p.id}`} className="sr-only">Status do pedido #{p.id}</label>
                  <select
                    id={`st-${p.id}`}
                    value={p.statusEntrega}
                    onChange={(e) => handleStatus(p.id, e.target.value as StatusEntrega)}
                    className="mymita-input !w-auto text-xs font-bold"
                  >
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="EM_PREPARO">EM PREPARO</option>
                    <option value="SAIU_PARA_ENTREGA">SAIU PARA ENTREGA</option>
                    <option value="ENTREGUE">ENTREGUE</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'MARMITAS' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={handleCriarMarmita} className="lg:col-span-5 mymita-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-base flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#E53935]" /> Nova Marmita Fitness
            </h2>
            <input type="text" required placeholder="Nome do prato" value={novaMarmita.nome} onChange={(e) => setNovaMarmita({ ...novaMarmita, nome: e.target.value })} className="mymita-input" />
            <input type="text" required placeholder="Descrição breve" value={novaMarmita.descricao} onChange={(e) => setNovaMarmita({ ...novaMarmita, descricao: e.target.value })} className="mymita-input" />
            <input type="text" required placeholder="Ingredientes" value={novaMarmita.ingredientes} onChange={(e) => setNovaMarmita({ ...novaMarmita, ingredientes: e.target.value })} className="mymita-input" />
            <input type="text" placeholder="Texto alternativo (alt WCAG)" value={novaMarmita.altText} onChange={(e) => setNovaMarmita({ ...novaMarmita, altText: e.target.value })} className="mymita-input" />
            <div className="grid grid-cols-2 gap-2">
              <select value={novaMarmita.categoria} onChange={(e) => setNovaMarmita({ ...novaMarmita, categoria: e.target.value })} className="mymita-input">
                <option value="FIT">FIT</option>
                <option value="LOW_CARB">LOW CARB</option>
                <option value="HIPERTROFIA">HIPERTROFIA</option>
                <option value="VEGANA">VEGANA</option>
              </select>
              <input type="number" step="0.10" placeholder="Preço R$" value={novaMarmita.precoAvulso} onChange={(e) => setNovaMarmita({ ...novaMarmita, precoAvulso: Number(e.target.value) })} className="mymita-input" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input type="number" placeholder="Kcal" value={novaMarmita.kcal} onChange={(e) => setNovaMarmita({ ...novaMarmita, kcal: Number(e.target.value) })} className="mymita-input" />
              <input type="number" placeholder="Prot" value={novaMarmita.proteinaG} onChange={(e) => setNovaMarmita({ ...novaMarmita, proteinaG: Number(e.target.value) })} className="mymita-input" />
              <input type="number" placeholder="Carb" value={novaMarmita.carboG} onChange={(e) => setNovaMarmita({ ...novaMarmita, carboG: Number(e.target.value) })} className="mymita-input" />
              <input type="number" placeholder="Gord" value={novaMarmita.gorduraG} onChange={(e) => setNovaMarmita({ ...novaMarmita, gorduraG: Number(e.target.value) })} className="mymita-input" />
            </div>
            <button type="submit" className="mymita-btn-primary w-full">Cadastrar Marmita</button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {marmitas.map((m) => (
              <div key={m.id} className="mymita-card p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={m.imagemUrl} alt={m.altText} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">
                      {m.nome} {!m.disponivel && <span className="text-[#E53935]">(Inativa)</span>}
                    </p>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                      {m.categoria} • {m.kcal} kcal • R$ {Number(m.precoAvulso).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                {m.disponivel && (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminInativarMarmita(m.id);
                      notify('Marmita inativada.');
                      loadAll();
                    }}
                    aria-label={`Inativar ${m.nome}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E53935] hover:bg-[#E53935]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'CEPS' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={handleCriarCep} className="lg:col-span-5 mymita-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-base">Nova Faixa de Cobertura (RN05)</h2>
            <input type="text" required placeholder="CEP início (8 dígitos)" value={novoCep.cepInicio} onChange={(e) => setNovoCep({ ...novoCep, cepInicio: e.target.value })} className="mymita-input" />
            <input type="text" required placeholder="CEP fim (8 dígitos)" value={novoCep.cepFim} onChange={(e) => setNovoCep({ ...novoCep, cepFim: e.target.value })} className="mymita-input" />
            <input type="text" required placeholder="Região (ex: Curitiba - PR)" value={novoCep.regiao} onChange={(e) => setNovoCep({ ...novoCep, regiao: e.target.value })} className="mymita-input" />
            <input type="number" step="0.10" placeholder="Taxa de entrega (R$)" value={novoCep.taxaEntrega} onChange={(e) => setNovoCep({ ...novoCep, taxaEntrega: Number(e.target.value) })} className="mymita-input" />
            <button type="submit" className="mymita-btn-green w-full">Adicionar Faixa</button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {ceps.map((c) => (
              <div key={c.id} className="mymita-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{c.regiao}</p>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                    CEP {c.cepInicio} até {c.cepFim} • Frete avulso: R$ {Number(c.taxaEntrega).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.adminRemoverCep(c.id);
                    loadAll();
                  }}
                  aria-label={`Remover faixa ${c.regiao}`}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E53935] hover:bg-[#E53935]/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
