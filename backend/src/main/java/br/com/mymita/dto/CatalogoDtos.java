package br.com.mymita.dto;

import br.com.mymita.domain.enums.CategoriaMarmita;
import br.com.mymita.domain.enums.FrequenciaPlano;
import br.com.mymita.domain.enums.TipoRefeicao;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public final class CatalogoDtos {
    private CatalogoDtos() {}

    public record MarmitaResponse(
            Long id,
            String nome,
            String descricao,
            String imagemUrl,
            String altText,
            CategoriaMarmita categoria,
            TipoRefeicao tipoSugerido,
            Integer pesoGramas,
            Integer tempoPreparoMin,
            String ingredientes,
            List<String> alergenos,
            Integer kcal,
            Integer proteinaG,
            Integer carboG,
            Integer gorduraG,
            Integer fibraG,
            BigDecimal precoAvulso,
            boolean disponivel
    ) {}

    public record MarmitaUpsertRequest(
            @NotBlank String nome,
            @NotBlank String descricao,
            @NotBlank String imagemUrl,
            @NotBlank String altText,
            @NotNull CategoriaMarmita categoria,
            TipoRefeicao tipoSugerido,
            @Min(100) Integer pesoGramas,
            @Min(1) Integer tempoPreparoMin,
            @NotBlank String ingredientes,
            List<String> alergenos,
            @NotNull @Min(50) Integer kcal,
            @NotNull @Min(0) Integer proteinaG,
            @NotNull @Min(0) Integer carboG,
            @NotNull @Min(0) Integer gorduraG,
            @Min(0) Integer fibraG,
            @NotNull @DecimalMin("1.00") BigDecimal precoAvulso,
            Boolean disponivel
    ) {}

    public record PlanoResponse(
            Long id,
            String nomePlano,
            String descricao,
            FrequenciaPlano frequencia,
            Integer qtdMarmitas,
            boolean incluiConsultaNutri,
            BigDecimal preco,
            boolean destaque,
            boolean ativo
    ) {}

    public record PlanoUpsertRequest(
            @NotBlank String nomePlano,
            String descricao,
            @NotNull FrequenciaPlano frequencia,
            @NotNull @Min(1) Integer qtdMarmitas,
            boolean incluiConsultaNutri,
            @NotNull @DecimalMin("1.00") BigDecimal preco,
            boolean destaque,
            Boolean ativo
    ) {}
}
