package br.com.mymita.service;

import br.com.mymita.domain.*;
import br.com.mymita.domain.enums.FrequenciaPlano;
import br.com.mymita.domain.enums.StatusAssinatura;
import br.com.mymita.domain.enums.StatusEntrega;
import br.com.mymita.dto.AdminDtos.*;
import br.com.mymita.dto.PedidoDtos.*;
import br.com.mymita.exception.BusinessException;
import br.com.mymita.exception.ResourceNotFoundException;
import br.com.mymita.repository.*;
import br.com.mymita.util.JsonListUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class PedidoService {

    private final EnderecoRepository enderecoRepository;
    private final FaixaCepCoberturaRepository cepRepository;
    private final PlanoRepository planoRepository;
    private final AssinaturaRepository assinaturaRepository;
    private final MarmitaRepository marmitaRepository;
    private final PedidoRepository pedidoRepository;
    private final CatalogoService catalogoService;

    public PedidoService(
            EnderecoRepository enderecoRepository,
            FaixaCepCoberturaRepository cepRepository,
            PlanoRepository planoRepository,
            AssinaturaRepository assinaturaRepository,
            MarmitaRepository marmitaRepository,
            PedidoRepository pedidoRepository,
            CatalogoService catalogoService) {
        this.enderecoRepository = enderecoRepository;
        this.cepRepository = cepRepository;
        this.planoRepository = planoRepository;
        this.assinaturaRepository = assinaturaRepository;
        this.marmitaRepository = marmitaRepository;
        this.pedidoRepository = pedidoRepository;
        this.catalogoService = catalogoService;
    }

    /**
     * RN05: Valida se o CEP informado está dentro da malha de cobertura dos parceiros logísticos.
     */
    public CepCoberturaResponse validarCep(String cepBruto) {
        String cepLimpo = cepBruto == null ? "" : cepBruto.replaceAll("\\D", "");
        if (cepLimpo.length() != 8) {
            return new CepCoberturaResponse(cepBruto, false, null, BigDecimal.ZERO, "Informe um CEP válido com 8 dígitos.");
        }

        int cepNum = Integer.parseInt(cepLimpo);
        for (FaixaCepCobertura faixa : cepRepository.findByAtivoTrue()) {
            int ini = Integer.parseInt(faixa.getCepInicio().replaceAll("\\D", ""));
            int fim = Integer.parseInt(faixa.getCepFim().replaceAll("\\D", ""));
            if (cepNum >= ini && cepNum <= fim) {
                return new CepCoberturaResponse(
                        cepLimpo, true, faixa.getRegiao(), faixa.getTaxaEntrega(),
                        "Endereço atendido na região " + faixa.getRegiao() + "!"
                );
            }
        }
        return new CepCoberturaResponse(
                cepLimpo, false, null, BigDecimal.ZERO,
                "Ainda não atendemos este CEP. Confira nossa área de cobertura (DF, SP, RJ, GO)."
        );
    }

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listarEnderecos(Usuario usuario) {
        return enderecoRepository.findByUsuarioIdAndAtivoTrue(usuario.getId()).stream()
                .map(this::toEnderecoResponse)
                .toList();
    }

    @Transactional
    public EnderecoResponse criarEndereco(Usuario usuario, EnderecoRequest req) {
        CepCoberturaResponse cobertura = validarCep(req.cep());
        if (!cobertura.atendido()) {
            throw new BusinessException(cobertura.mensagem(), "RN05_OUT_OF_COVERAGE", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Endereco e = new Endereco();
        e.setUsuario(usuario);
        e.setApelido(JsonListUtil.sanitizeText(req.apelido() != null ? req.apelido() : "Principal"));
        e.setLogradouro(JsonListUtil.sanitizeText(req.logradouro()));
        e.setNumero(JsonListUtil.sanitizeText(req.numero()));
        e.setComplemento(JsonListUtil.sanitizeText(req.complemento()));
        e.setBairro(JsonListUtil.sanitizeText(req.bairro()));
        e.setCidade(JsonListUtil.sanitizeText(req.cidade()));
        e.setUf(req.uf().trim().toUpperCase());
        e.setCep(cobertura.cep());
        e.setAtivo(true);
        return toEnderecoResponse(enderecoRepository.save(e));
    }

    @Transactional(readOnly = true)
    public List<AssinaturaResponse> listarAssinaturas(Usuario cliente) {
        return assinaturaRepository.findByClienteIdOrderByDataInicioDesc(cliente.getId()).stream()
                .map(this::toAssinaturaResponse)
                .toList();
    }

    @Transactional
    public AssinaturaResponse pausarAssinatura(Usuario cliente, Long assinaturaId, LocalDate pausarAte) {
        Assinatura a = assinaturaRepository.findById(assinaturaId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada."));
        if (!a.getCliente().getId().equals(cliente.getId())) {
            throw new BusinessException("Acesso negado.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }
        // RN01: Verifica se existe entrega ativa nas próximas 24 horas
        boolean entregaImminente = pedidoRepository.findByClienteIdOrderByCriadoEmDesc(cliente.getId()).stream()
                .filter(p -> p.getAssinatura() != null && p.getAssinatura().getId().equals(a.getId()))
                .filter(p -> p.getStatusEntrega() == StatusEntrega.CONFIRMADO || p.getStatusEntrega() == StatusEntrega.EM_PREPARO)
                .anyMatch(p -> !dentroDaJanela24h(p.getDataEntrega(), p.getJanelaHorario()));

        if (entregaImminente) {
            throw new BusinessException(
                    "Não é possível pausar: você possui entrega agendada com menos de 24 horas de antecedência (RN01).",
                    "RN01_24H_WINDOW",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        a.setStatus(StatusAssinatura.PAUSADA);
        a.setPausadaAte(pausarAte);
        return toAssinaturaResponse(assinaturaRepository.save(a));
    }

    @Transactional
    public AssinaturaResponse reativarAssinatura(Usuario cliente, Long assinaturaId) {
        Assinatura a = assinaturaRepository.findById(assinaturaId)
                .orElseThrow(() -> new ResourceNotFoundException("Assinatura não encontrada."));
        if (!a.getCliente().getId().equals(cliente.getId())) {
            throw new BusinessException("Acesso negado.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }
        a.setStatus(StatusAssinatura.ATIVA);
        a.setPausadaAte(null);
        return toAssinaturaResponse(assinaturaRepository.save(a));
    }

    /**
     * RF11 + RF12 + RF13 + RN03 + RN05: Checkout de plano recorrente ou compra avulsa.
     */
    @Transactional
    public PedidoResponse realizarCheckout(Usuario cliente, CheckoutRequest req) {
        Endereco endereco = enderecoRepository.findById(req.enderecoId())
                .orElseThrow(() -> new ResourceNotFoundException("Endereço de entrega não encontrado."));
        if (!endereco.getUsuario().getId().equals(cliente.getId())) {
            throw new BusinessException("Endereço inválido.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        // RN05: Valida área de cobertura
        CepCoberturaResponse cobertura = validarCep(endereco.getCep());
        if (!cobertura.atendido()) {
            throw new BusinessException(cobertura.mensagem(), "RN05_OUT_OF_COVERAGE", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (req.dataEntrega().isBefore(LocalDate.now().plusDays(1))) {
            throw new BusinessException("A data de entrega deve ter pelo menos 1 dia de antecedência.", "INVALID_DELIVERY_DATE", HttpStatus.BAD_REQUEST);
        }

        Assinatura assinatura = null;
        BigDecimal subtotal = BigDecimal.ZERO;
        List<PedidoItem> itensPedido = new ArrayList<>();

        if (req.planoId() != null) {
            Plano plano = planoRepository.findById(req.planoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plano não encontrado."));
            assinatura = new Assinatura();
            assinatura.setCliente(cliente);
            assinatura.setPlano(plano);
            assinatura.setGatewaySubscriptionId("sub_sandbox_" + UUID.randomUUID().toString().substring(0, 8));
            assinatura.setDataInicio(LocalDate.now());
            assinatura.setProximaCobranca(plano.getFrequencia() == FrequenciaPlano.SEMANAL
                    ? LocalDate.now().plusWeeks(1)
                    : LocalDate.now().plusMonths(1));
            assinatura.setStatus(StatusAssinatura.ATIVA);
            assinatura.setDiaEntregaPreferencial(req.dataEntrega().getDayOfWeek().name());
            assinatura.setJanelaHorarioPreferencial(req.janelaHorario());
            assinatura.setFormaPagamento(req.formaPagamento());
            assinatura = assinaturaRepository.save(assinatura);
            subtotal = plano.getPreco();
        }

        if (req.itens() != null && !req.itens().isEmpty()) {
            for (CheckoutItemRequest itemReq : req.itens()) {
                Marmita m = marmitaRepository.findById(itemReq.marmitaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Marmita ID " + itemReq.marmitaId() + " não encontrada."));
                PedidoItem pi = new PedidoItem();
                pi.setMarmita(m);
                pi.setQuantidade(itemReq.quantidade());
                pi.setPrecoUnitario(m.getPrecoAvulso());
                itensPedido.add(pi);
                if (req.planoId() == null) {
                    subtotal = subtotal.add(m.getPrecoAvulso().multiply(BigDecimal.valueOf(itemReq.quantidade())));
                }
            }
        } else if (req.planoId() == null) {
            throw new BusinessException("Selecione um plano ou adicione marmitas ao carrinho.");
        }

        BigDecimal frete = req.planoId() != null ? BigDecimal.ZERO : cobertura.taxaEntrega();

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setAssinatura(assinatura);
        pedido.setEndereco(endereco);
        pedido.setDataEntrega(req.dataEntrega());
        pedido.setJanelaHorario(req.janelaHorario());
        pedido.setFormaPagamento(req.formaPagamento());
        pedido.setGatewayPaymentId("pay_sandbox_" + UUID.randomUUID().toString().substring(0, 10));
        pedido.setValorFrete(frete);
        pedido.setValorTotal(subtotal.add(frete));
        pedido.setObservacoes(JsonListUtil.sanitizeText(req.observacoes()));
        // RN03: Nasce como AGUARDANDO_PAGAMENTO; em sandbox aprova imediatamente após simulação de gateway (exceto se forma for PIX_PENDENTE)
        if ("PIX_PENDENTE".equalsIgnoreCase(req.formaPagamento())) {
            pedido.setStatusEntrega(StatusEntrega.AGUARDANDO_PAGAMENTO);
        } else {
            pedido.setStatusEntrega(StatusEntrega.CONFIRMADO);
        }

        for (PedidoItem pi : itensPedido) {
            pi.setPedido(pedido);
            pedido.getItens().add(pi);
        }

        pedido = pedidoRepository.save(pedido);
        return toPedidoResponse(pedido);
    }

    /**
     * RN01: Cancelamento de pedido agendado só permitido com mínimo 24h de antecedência.
     */
    @Transactional
    public PedidoResponse cancelarPedido(Usuario cliente, Long pedidoId) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado."));
        if (!p.getCliente().getId().equals(cliente.getId())) {
            throw new BusinessException("Acesso negado.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }
        if (p.getStatusEntrega() == StatusEntrega.ENTREGUE || p.getStatusEntrega() == StatusEntrega.CANCELADO) {
            throw new BusinessException("Este pedido não pode mais ser cancelado.");
        }
        if (!dentroDaJanela24h(p.getDataEntrega(), p.getJanelaHorario())) {
            throw new BusinessException(
                    "O cancelamento ou alteração só pode ser realizado com no mínimo 24 horas de antecedência da entrega (RN01).",
                    "RN01_24H_WINDOW",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        p.setStatusEntrega(StatusEntrega.CANCELADO);
        return toPedidoResponse(pedidoRepository.save(p));
    }

    /**
     * RF13 + RN03 + RN04: Webhook do gateway de pagamentos (Stripe/Mercado Pago/Sandbox).
     */
    @Transactional
    public String processarWebhook(WebhookPagamentoRequest req) {
        String evento = req.evento() == null ? "" : req.evento().toLowerCase();
        if (evento.contains("paid") || evento.contains("succeeded") || evento.contains("approved")) {
            if (req.gatewayPaymentId() != null) {
                pedidoRepository.findByGatewayPaymentId(req.gatewayPaymentId()).ifPresent(p -> {
                    if (p.getStatusEntrega() == StatusEntrega.AGUARDANDO_PAGAMENTO) {
                        p.setStatusEntrega(StatusEntrega.CONFIRMADO);
                        pedidoRepository.save(p);
                    }
                });
            }
            if (req.gatewaySubscriptionId() != null) {
                assinaturaRepository.findByGatewaySubscriptionId(req.gatewaySubscriptionId()).ifPresent(a -> {
                    a.setStatus(StatusAssinatura.ATIVA);
                    assinaturaRepository.save(a);
                });
            }
            return "Pagamento confirmado e pedido liberado para produção (RN03).";
        }

        if (evento.contains("failed") || evento.contains("past_due")) {
            // RN04: Suspensão automática por inadimplência
            if (req.gatewaySubscriptionId() != null) {
                assinaturaRepository.findByGatewaySubscriptionId(req.gatewaySubscriptionId()).ifPresent(a -> {
                    a.setStatus(StatusAssinatura.SUSPENSA);
                    assinaturaRepository.save(a);
                });
            }
            return "Assinatura suspensa automaticamente por falha no pagamento (RN04).";
        }
        return "Evento ignorado.";
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarPedidosCliente(Usuario cliente) {
        return pedidoRepository.findByClienteIdOrderByCriadoEmDesc(cliente.getId()).stream()
                .map(this::toPedidoResponse)
                .toList();
    }

    /**
     * RF14 + RN03: Relatório consolidado da cozinha — exibe apenas pedidos com pagamento confirmado.
     */
    @Transactional(readOnly = true)
    public RelatorioProducaoResponse relatorioProducaoAdmin(LocalDate dataFiltro) {
        List<StatusEntrega> validos = List.of(
                StatusEntrega.CONFIRMADO, StatusEntrega.EM_PREPARO,
                StatusEntrega.SAIU_PARA_ENTREGA, StatusEntrega.ENTREGUE
        );
        List<Pedido> pedidos = dataFiltro != null
                ? pedidoRepository.findByDataEntregaAndStatusEntregaIn(dataFiltro, validos)
                : pedidoRepository.findByStatusEntregaNotInOrderByDataEntregaAsc(
                        List.of(StatusEntrega.AGUARDANDO_PAGAMENTO, StatusEntrega.CANCELADO));

        Map<Long, ProducaoConsolidadaItem> mapa = new LinkedHashMap<>();
        int totalMarmitas = 0;

        for (Pedido p : pedidos) {
            for (PedidoItem pi : p.getItens()) {
                Marmita m = pi.getMarmita();
                totalMarmitas += pi.getQuantidade();
                mapa.compute(m.getId(), (k, old) -> new ProducaoConsolidadaItem(
                        m.getId(),
                        m.getNome(),
                        m.getCategoria().name(),
                        (old == null ? 0 : old.quantidadeTotal()) + pi.getQuantidade()
                ));
            }
        }

        return new RelatorioProducaoResponse(
                dataFiltro,
                pedidos.size(),
                totalMarmitas,
                new ArrayList<>(mapa.values()),
                pedidos.stream().map(this::toPedidoResponse).toList()
        );
    }

    @Transactional
    public PedidoResponse atualizarStatusAdmin(Long pedidoId, StatusEntrega novoStatus) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado."));
        // RN03: Não permite avançar para produção sem pagamento confirmado
        if (p.getStatusEntrega() == StatusEntrega.AGUARDANDO_PAGAMENTO
                && (novoStatus == StatusEntrega.EM_PREPARO || novoStatus == StatusEntrega.SAIU_PARA_ENTREGA)) {
            throw new BusinessException("Pedido aguardando pagamento não pode entrar em produção (RN03).", "RN03_PAYMENT_REQUIRED", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        p.setStatusEntrega(novoStatus);
        return toPedidoResponse(pedidoRepository.save(p));
    }

    public List<FaixaCepResponse> listarFaixasCep() {
        return cepRepository.findAll().stream()
                .map(f -> new FaixaCepResponse(f.getId(), f.getCepInicio(), f.getCepFim(), f.getRegiao(), f.getTaxaEntrega(), f.isAtivo()))
                .toList();
    }

    @Transactional
    public FaixaCepResponse criarFaixaCep(FaixaCepRequest req) {
        FaixaCepCobertura f = new FaixaCepCobertura();
        f.setCepInicio(req.cepInicio().replaceAll("\\D", ""));
        f.setCepFim(req.cepFim().replaceAll("\\D", ""));
        f.setRegiao(JsonListUtil.sanitizeText(req.regiao()));
        f.setTaxaEntrega(req.taxaEntrega());
        f.setAtivo(true);
        f = cepRepository.save(f);
        return new FaixaCepResponse(f.getId(), f.getCepInicio(), f.getCepFim(), f.getRegiao(), f.getTaxaEntrega(), f.isAtivo());
    }

    @Transactional
    public void removerFaixaCep(Long id) {
        cepRepository.deleteById(id);
    }

    public boolean dentroDaJanela24h(LocalDate dataEntrega, String janelaHorario) {
        LocalTime hora = LocalTime.of(12, 0);
        if (janelaHorario != null && janelaHorario.length() >= 5) {
            try {
                hora = LocalTime.parse(janelaHorario.substring(0, 5));
            } catch (Exception ignored) {}
        }
        LocalDateTime entregaDateTime = LocalDateTime.of(dataEntrega, hora);
        return LocalDateTime.now().plusHours(24).isBefore(entregaDateTime);
    }

    public EnderecoResponse toEnderecoResponse(Endereco e) {
        return new EnderecoResponse(
                e.getId(), e.getApelido(), e.getLogradouro(), e.getNumero(),
                e.getComplemento(), e.getBairro(), e.getCidade(), e.getUf(), e.getCep()
        );
    }

    public AssinaturaResponse toAssinaturaResponse(Assinatura a) {
        return new AssinaturaResponse(
                a.getId(),
                catalogoService.toPlanoResponse(a.getPlano()),
                a.getDataInicio(),
                a.getProximaCobranca(),
                a.getStatus(),
                a.getDiaEntregaPreferencial(),
                a.getJanelaHorarioPreferencial(),
                a.getFormaPagamento(),
                a.getPausadaAte()
        );
    }

    public PedidoResponse toPedidoResponse(Pedido p) {
        boolean podeAlterar = (p.getStatusEntrega() == StatusEntrega.AGUARDANDO_PAGAMENTO
                || p.getStatusEntrega() == StatusEntrega.CONFIRMADO)
                && dentroDaJanela24h(p.getDataEntrega(), p.getJanelaHorario());

        return new PedidoResponse(
                p.getId(),
                p.getCliente().getId(),
                p.getCliente().getNome(),
                p.getAssinatura() != null ? p.getAssinatura().getId() : null,
                toEnderecoResponse(p.getEndereco()),
                p.getDataEntrega(),
                p.getJanelaHorario(),
                p.getStatusEntrega(),
                p.getFormaPagamento(),
                p.getGatewayPaymentId(),
                p.getValorFrete(),
                p.getValorTotal(),
                p.getObservacoes(),
                podeAlterar,
                p.getCriadoEm(),
                p.getItens().stream().map(i -> new PedidoItemResponse(
                        i.getId(),
                        i.getMarmita().getId(),
                        i.getMarmita().getNome(),
                        i.getMarmita().getImagemUrl(),
                        i.getQuantidade(),
                        i.getPrecoUnitario()
                )).toList()
        );
    }
}
