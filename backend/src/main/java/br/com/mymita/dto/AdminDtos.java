package br.com.mymita.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public final class AdminDtos {
    private AdminDtos() {}

    public record FaixaCepRequest(
            @NotBlank String cepInicio,
            @NotBlank String cepFim,
            @NotBlank String regiao,
            @NotNull @DecimalMin("0.00") BigDecimal taxaEntrega
    ) {}

    public record FaixaCepResponse(
            Long id,
            String cepInicio,
            String cepFim,
            String regiao,
            BigDecimal taxaEntrega,
            boolean ativo
    ) {}

    public record PacienteResumo(
            Long clienteId,
            String nome,
            String email,
            String objetivo,
            Integer metaKcal,
            Integer metaProteinaG,
            BigDecimal pesoAtual,
            String statusCardapio,
            int totalMensagensChat
    ) {}
}
