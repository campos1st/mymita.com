package br.com.mymita.dto;

import br.com.mymita.domain.enums.DiaSemana;
import br.com.mymita.domain.enums.StatusAprovacaoCardapio;
import br.com.mymita.domain.enums.TipoRefeicao;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class CardapioDtos {
    private CardapioDtos() {}

    public record CardapioItemResponse(
            Long id,
            DiaSemana diaSemana,
            TipoRefeicao tipoRefeicao,
            String tipoLabel,
            String horarioSugerido,
            boolean consumido,
            boolean travadoNutri,
            CatalogoDtos.MarmitaResponse marmita
    ) {}

    public record ResumoMacros(
            int kcal,
            int proteinaG,
            int carboG,
            int gorduraG,
            int fibraG
    ) {}

    public record CardapioResponse(
            Long id,
            LocalDate semanaReferencia,
            StatusAprovacaoCardapio statusAprovacao,
            String orientacoesNutri,
            List<CardapioItemResponse> itens,
            Map<DiaSemana, ResumoMacros> macrosPorDia,
            ResumoMacros macrosSemana
    ) {}

    public record TrocarPratoRequest(
            @NotNull Long novaMarmitaId
    ) {}

    public record AprovarCardapioRequest(
            String orientacoesNutri
    ) {}
}
