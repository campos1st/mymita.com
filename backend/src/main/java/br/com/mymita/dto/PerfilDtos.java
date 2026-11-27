package br.com.mymita.dto;

import br.com.mymita.domain.enums.NivelAtividade;
import br.com.mymita.domain.enums.ObjetivoNutricional;
import br.com.mymita.domain.enums.SexoBiologico;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class PerfilDtos {
    private PerfilDtos() {}

    public record OnboardingRequest(
            @NotNull @DecimalMin("30.0") @DecimalMax("300.0") BigDecimal pesoKg,
            @NotNull @Min(100) @Max(250) Integer alturaCm,
            @NotNull @Min(14) @Max(110) Integer idade,
            @NotNull SexoBiologico sexo,
            @NotNull NivelAtividade nivelAtividade,
            @NotNull ObjetivoNutricional objetivo,
            List<String> restricoes,
            List<String> alergias
    ) {}

    public record PerfilResponse(
            Long id,
            Long clienteId,
            String clienteNome,
            Long nutricionistaId,
            String nutricionistaNome,
            String nutricionistaCrn,
            BigDecimal pesoKg,
            Integer alturaCm,
            Integer idade,
            SexoBiologico sexo,
            NivelAtividade nivelAtividade,
            ObjetivoNutricional objetivo,
            List<String> restricoes,
            List<String> alergias,
            Integer tmbKcal,
            Integer getKcal,
            Integer metaKcal,
            Integer metaProteinaG,
            Integer metaCarboG,
            Integer metaGorduraG,
            BigDecimal metaAguaLitros,
            boolean metasDefinidasNutri,
            String observacoesClinicas,
            boolean onboardingConcluido
    ) {}

    public record CheckInRequest(
            @NotNull @DecimalMin("30.0") BigDecimal pesoKg,
            BigDecimal percentualGordura,
            BigDecimal aguaLitros,
            String notasPaciente
    ) {}

    public record EvolucaoResponse(
            Long id,
            LocalDate dataRegistro,
            BigDecimal pesoKg,
            BigDecimal percentualGordura,
            BigDecimal aguaLitros,
            String notasPaciente,
            String feedbackNutri
    ) {}

    public record AjusteMetasNutriRequest(
            @NotNull @Min(1000) @Max(6000) Integer metaKcal,
            @NotNull @Min(40) Integer metaProteinaG,
            @NotNull @Min(20) Integer metaCarboG,
            @NotNull @Min(20) Integer metaGorduraG,
            BigDecimal metaAguaLitros,
            String observacoesClinicas
    ) {}
}
