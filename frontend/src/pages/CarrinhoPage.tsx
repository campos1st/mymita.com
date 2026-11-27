import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useCart } from '../contexts/CartContext';
import type { CepCobertura, Endereco } from '../types';

export const CarrinhoPage: React.FC = () => {
  const { items, selectedPlan, totalItems, subtotal, updateQty, removeMarmita, selectPlan, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<'CARRINHO' | 'CHECKOUT' | 'SUCESSO'>('CARRINHO');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoId, setEnderecoId] = useState<number | ''>('');
  const [cepCheck, setCepCheck] = useState('');
  const [cobertura, setCobertura] = useState<CepCobertura | null>(null);
  const [showNovoEndereco, setShowNovoEndereco] = useState(false);

  // Novo endereço
  const [novoEnd, setNovoEnd] = useState({
    apelido: 'Trabalho',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Brasília',
    uf: 'DF',
  });

  // Agendamento & Pagamento
  const minDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const [dataEntrega, setDataEntrega] = useState(minDate);
  const [janelaHorario, setJanelaHorario] = useState('18:00 - 20:00');
  const [formaPagamento, setFormaPagamento] = useState<'CARTAO_CREDITO' | 'PIX' | 'VALE_REFEICAO'>('CARTAO_CREDITO');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidoCriadoId, setPedidoCriadoId] = useState<number | null>(null);

  useEffect(() => {
    api
      .listarEnderecos()
      .then((list) => {
        setEnderecos(list);
        if (list.length > 0) {
          setEnderecoId(list[0].id);
          setCepCheck(list[0].cep);
          api.validarCep(list[0].cep).then(setCobertura).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleValidarCep = async () => {
    setError(null);
    const res = await api.validarCep(cepCheck);
    setCobertura(res);
  };

  const handleCriarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const criado = await api.criarEndereco(novoEnd);
      setEnderecos((prev) => [...prev, criado]);
      setEnderecoId(criado.id);
      setCepCheck(criado.cep);
      const cob = await api.validarCep(criado.cep);
      setCobertura(cob);
      setShowNovoEndereco(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar endereço.');
    }
  };

  const freteEstimado = selectedPlan ? 0 : Number(cobertura?.taxaEntrega ?? 0);
  const total = subtotal + freteEstimado;

  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!enderecoId) {
      setError('Selecione ou cadastre um endereço de entrega atendido.');
      return;
    }
    setLoading(true);
    try {
      const pedido = await api.checkout({
        planoId: selectedPlan?.id ?? null,
        enderecoId: Number(enderecoId),
        dataEntrega,
        janelaHorario,
        formaPagamento,
        observacoes,
        itens: items.map((i) => ({ marmitaId: i.marmita.id, quantidade: i.quantidade })),
      });
      setPedidoCriadoId(pedido.id);
      clearCart();
      setStep('SUCESSO');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao processar checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'SUCESSO') {
    return (
      <div className="max-w-lg mx-auto py-10">
        <div className="mymita-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold">Pedido #{pedidoCriadoId} confirmado!</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Pagamento validado com segurança (PCI-DSS / Sandbox) e pedido liberado para a fila de produção da cozinha (RN03).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => navigate('/mais')} className="mymita-btn-primary flex-1">
              Acompanhar entrega
            </button>
            <button type="button" onClick={() => navigate('/')} className="mymita-btn-secondary flex-1">
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho fiel à Tela 4 (p. 28) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {step === 'CARRINHO' ? 'Meu Carrinho' : 'Finalizar Compra'}
          </h1>
          <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
            {step === 'CARRINHO'
              ? 'Revise seus itens ou plano antes do agendamento.'
              : 'Etapa única de endereço, janela de entrega e pagamento seguro.'}
          </p>
        </div>
        <span className="text-sm font-semibold text-[#5F6368] dark:text-[#94A3B8]">
          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {totalItems === 0 ? (
        <div className="mymita-card p-10 text-center space-y-4">
          <ShoppingCart className="w-12 h-12 mx-auto text-[#94A3B8]" />
          <h2 className="text-lg font-bold">Seu carrinho está vazio</h2>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Escolha um plano semanal/mensal ou adicione marmitas avulsas do nosso catálogo fitness.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/catalogo" className="mymita-btn-primary">
              Ver Catálogo & Planos
            </Link>
            <Link to="/plano" className="mymita-btn-secondary">
              Ver Meu Plano
            </Link>
          </div>
        </div>
      ) : step === 'CARRINHO' ? (
        <>
          {/* Plano Selecionado (se houver) */}
          {selectedPlan && (
            <div className="mymita-card p-4 border-l-4 border-l-[#2E7D32] flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#2E7D32] dark:text-emerald-400">
                  Assinatura {selectedPlan.frequencia} • Frete Grátis
                </span>
                <h2 className="font-bold text-base">{selectedPlan.nomePlano}</h2>
                <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                  {selectedPlan.qtdMarmitas} marmitas • R$ {Number(selectedPlan.preco).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectPlan(null)}
                aria-label="Remover plano do carrinho"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#E53935] hover:bg-[#E53935]/10"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Lista de Itens do Carrinho (fiel ao protótipo p. 28) */}
          <div className="space-y-3">
            {items.map(({ marmita, quantidade }) => (
              <article key={marmita.id} className="mymita-card p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={marmita.imagemUrl}
                    alt={marmita.altText}
                    className="w-16 h-16 rounded-full object-cover shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm sm:text-base truncate">{marmita.nome}</h2>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                      {marmita.pesoGramas} g • {marmita.kcal} kcal
                    </p>
                    <p className="text-sm font-extrabold mt-0.5">
                      R$ {Number(marmita.precoAvulso).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#171D23] border border-[#E0E4E8] dark:border-[#26323D]">
                    <button
                      type="button"
                      onClick={() => updateQty(marmita.id, -1)}
                      aria-label={`Diminuir quantidade de ${marmita.nome}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-[#1C252D]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{quantidade}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(marmita.id, 1)}
                      aria-label={`Aumentar quantidade de ${marmita.nome}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-[#1C252D]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMarmita(marmita.id)}
                    aria-label={`Remover ${marmita.nome} do carrinho`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E53935] hover:bg-[#E53935]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Validação de CEP / Área de cobertura (RN05) */}
          <div className="mymita-card p-4 space-y-3">
            <label htmlFor="cep-check" className="flex items-center gap-2 text-sm font-bold">
              <MapPin className="w-4 h-4 text-[#E53935]" /> Calcular frete e área de cobertura (RN05)
            </label>
            <div className="flex gap-2">
              <input
                id="cep-check"
                type="text"
                value={cepCheck}
                onChange={(e) => setCepCheck(e.target.value)}
                placeholder="Ex: 72445-020"
                className="mymita-input flex-1"
              />
              <button type="button" onClick={handleValidarCep} className="mymita-btn-secondary">
                Validar CEP
              </button>
            </div>
            {cobertura && (
              <p
                className={`text-xs font-semibold ${
                  cobertura.atendido ? 'text-[#2E7D32] dark:text-emerald-400' : 'text-[#E53935]'
                }`}
              >
                {cobertura.mensagem}
              </p>
            )}
          </div>

          {/* Card Resumo da Compra + Botão Vermelho com Cadeado (100% fiel à p. 28!) */}
          <div className="mymita-card p-5 space-y-3">
            <h2 className="font-bold text-base">Resumo da compra</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-[#5F6368] dark:text-[#94A3B8]">
                <span>Frete (estimado)</span>
                <span>R$ {freteEstimado.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="pt-3 border-t border-[#E8ECEF] dark:border-[#26323D] flex justify-between text-base font-extrabold">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('CHECKOUT')}
              className="mymita-btn-primary w-full mt-2"
            >
              <Lock className="w-4 h-4" />
              Finalizar compra
            </button>
          </div>
        </>
      ) : (
        /* Etapa de Checkout (Endereço + Agendamento + Pagamento) */
        <form onSubmit={handleConfirmarPedido} className="space-y-5">
          <div className="mymita-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">1. Endereço de entrega</h2>
              <button
                type="button"
                onClick={() => setShowNovoEndereco((s) => !s)}
                className="text-xs font-bold text-[#E53935] hover:underline"
              >
                {showNovoEndereco ? 'Cancelar' : '+ Novo endereço'}
              </button>
            </div>

            <div className="space-y-2">
              {enderecos.map((end) => (
                <label
                  key={end.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${
                    enderecoId === end.id
                      ? 'border-[#E53935] bg-[#E53935]/5'
                      : 'border-[#E8ECEF] dark:border-[#26323D]'
                  }`}
                >
                  <input
                    type="radio"
                    name="endereco"
                    checked={enderecoId === end.id}
                    onChange={() => setEnderecoId(end.id)}
                    className="accent-[#E53935]"
                  />
                  <div className="text-sm">
                    <p className="font-bold">
                      {end.apelido || 'Endereço'} — CEP {end.cep}
                    </p>
                    <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
                      {end.logradouro}, {end.numero} {end.complemento ? `• ${end.complemento}` : ''} — {end.bairro}, {end.cidade}/{end.uf}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {showNovoEndereco && (
              <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#171D23] space-y-3 border border-[#E8ECEF] dark:border-[#26323D]">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="CEP (ex: 72445020)"
                    value={novoEnd.cep}
                    onChange={(e) => setNovoEnd({ ...novoEnd, cep: e.target.value })}
                    className="mymita-input"
                  />
                  <input
                    type="text"
                    placeholder="Logradouro"
                    value={novoEnd.logradouro}
                    onChange={(e) => setNovoEnd({ ...novoEnd, logradouro: e.target.value })}
                    className="mymita-input sm:col-span-2"
                  />
                </div>
                <div className="grid sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Número"
                    value={novoEnd.numero}
                    onChange={(e) => setNovoEnd({ ...novoEnd, numero: e.target.value })}
                    className="mymita-input"
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={novoEnd.bairro}
                    onChange={(e) => setNovoEnd({ ...novoEnd, bairro: e.target.value })}
                    className="mymita-input"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={novoEnd.cidade}
                    onChange={(e) => setNovoEnd({ ...novoEnd, cidade: e.target.value })}
                    className="mymita-input"
                  />
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="UF"
                    value={novoEnd.uf}
                    onChange={(e) => setNovoEnd({ ...novoEnd, uf: e.target.value })}
                    className="mymita-input"
                  />
                </div>
                <button type="button" onClick={handleCriarEndereco} className="mymita-btn-green text-sm">
                  Salvar endereço (valida cobertura RN05)
                </button>
              </div>
            )}
          </div>

          <div className="mymita-card p-5 space-y-4">
            <h2 className="font-bold text-base">2. Agendamento da entrega</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-data" className="block text-sm font-semibold mb-1">
                  Data de entrega
                </label>
                <input
                  id="chk-data"
                  type="date"
                  min={minDate}
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  className="mymita-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="chk-janela" className="block text-sm font-semibold mb-1">
                  Janela de horário
                </label>
                <select
                  id="chk-janela"
                  value={janelaHorario}
                  onChange={(e) => setJanelaHorario(e.target.value)}
                  className="mymita-input"
                >
                  <option value="09:00 - 12:00">Manhã (09:00 - 12:00)</option>
                  <option value="14:00 - 17:00">Tarde (14:00 - 17:00)</option>
                  <option value="18:00 - 20:00">Noite (18:00 - 20:00)</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="chk-obs" className="block text-sm font-semibold mb-1">
                Observações para a cozinha/entregador (opcional)
              </label>
              <input
                id="chk-obs"
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Deixar na portaria"
                className="mymita-input"
              />
            </div>
          </div>

          <div className="mymita-card p-5 space-y-4">
            <h2 className="font-bold text-base">3. Pagamento Seguro (PCI-DSS / Sandbox)</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { id: 'CARTAO_CREDITO', label: 'Cartão de Crédito', icon: CreditCard },
                { id: 'PIX', label: 'PIX Instantâneo', icon: QrCode },
                { id: 'VALE_REFEICAO', label: 'Vale-Refeição', icon: CreditCard },
              ].map((pg) => {
                const Icon = pg.icon;
                const active = formaPagamento === pg.id;
                return (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => setFormaPagamento(pg.id as typeof formaPagamento)}
                    aria-pressed={active}
                    className={`min-h-[52px] rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                      active
                        ? 'border-[#E53935] bg-[#E53935]/10 text-[#E53935]'
                        : 'border-[#DCE1E7] dark:border-[#26323D]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {pg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">
              Nenhum dado de cartão é armazenado localmente (RNF04). Total a pagar:{' '}
              <strong className="text-[#202124] dark:text-white">
                R$ {total.toFixed(2).replace('.', ',')}
              </strong>
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('CARRINHO')} className="mymita-btn-secondary">
              Voltar ao carrinho
            </button>
            <button type="submit" disabled={loading} className="mymita-btn-primary flex-1">
              <Lock className="w-4 h-4" />
              {loading ? 'Processando pagamento...' : `Confirmar pedido (R$ ${total.toFixed(2).replace('.', ',')})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
