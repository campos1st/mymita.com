package br.com.mymita.dto;

import br.com.mymita.domain.enums.StatusAssinatura;
import br.com.mymita.domain.enums.StatusEntrega;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class PedidoDtos {
    private PedidoDtos() {}

    public record EnderecoRequest(
            String apelido,
            @NotBlank String logradouro,
            @NotBlank String numero,
            String complemento,
            @NotBlank String bairro,
            @NotBlank String cidade,
            @NotBlank @Size(min = 2, max = 2) String uf,
            @NotBlank String cep
    ) {}

    public record EnderecoResponse(
            Long id,
            String apelido,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf,
            String cep
    ) {}

    public record CepCoberturaResponse(
            String cep,
            boolean atendido,
            String regiao,
            BigDecimal taxaEntrega,
            String mensagem
    ) {}

    public record AssinarPlanoRequest(
            @NotNull Long planoId,
            @NotNull Long enderecoId,
            @NotBlank String diaEntregaPreferencial,
            @NotBlank String janelaHorarioPreferencial,
            @NotBlank String formaPagamento
    ) {}

    public record AssinaturaResponse(
            Long id,
            CatalogoDtos.PlanoResponse plano,
            LocalDate dataInicio,
            LocalDate proximaCobranca,
            StatusAssinatura status,
            String diaEntregaPreferencial,
            String janelaHorarioPreferencial,
            String formaPagamento,
            LocalDate pausadaAte
    ) {}

    public record PausarAssinaturaRequest(
            @NotNull LocalDate pausarAte
    ) {}

    public record CheckoutItemRequest(
            @NotNull Long marmitaId,
            @NotNull @Min(1) Integer quantidade
    ) {}

    public record CheckoutRequest(
            Long planoId,
            @NotNull Long enderecoId,
            @NotNull LocalDate dataEntrega,
            @NotBlank String janelaHorario,
            @NotBlank String formaPagamento,
            String observacoes,
            List<CheckoutItemRequest> itens
    ) {}

    public record PedidoItemResponse(
            Long id,
            Long marmitaId,
            String marmitaNome,
            String marmitaImagemUrl,
            Integer quantidade,
            BigDecimal precoUnitario
    ) {}

    public record PedidoResponse(
            Long id,
            Long clienteId,
            String clienteNome,
            Long assinaturaId,
            EnderecoResponse endereco,
            LocalDate dataEntrega,
            String janelaHorario,
            StatusEntrega statusEntrega,
            String formaPagamento,
            String gatewayPaymentId,
            BigDecimal valorFrete,
            BigDecimal valorTotal,
            String observacoes,
            boolean podeAlterarOuCancelar,
            LocalDateTime criadoEm,
            List<PedidoItemResponse> itens
    ) {}

    public record WebhookPagamentoRequest(
            String gatewayPaymentId,
            String gatewaySubscriptionId,
            String evento
    ) {}

    public record AtualizarStatusPedidoRequest(
            @NotNull StatusEntrega statusEntrega
    ) {}

    public record ProducaoConsolidadaItem(
            Long marmitaId,
            String marmitaNome,
            String categoria,
            int quantidadeTotal
    ) {}

    public record RelatorioProducaoResponse(
            LocalDate dataEntrega,
            int totalPedidosConfirmados,
            int totalMarmitas,
            List<ProducaoConsolidadaItem> itens,
            List<PedidoResponse> pedidos
    ) {}
}
