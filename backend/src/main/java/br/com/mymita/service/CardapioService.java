package br.com.mymita.service;

import br.com.mymita.domain.*;
import br.com.mymita.domain.enums.*;
import br.com.mymita.dto.CardapioDtos.*;
import br.com.mymita.exception.BusinessException;
import br.com.mymita.exception.ResourceNotFoundException;
import br.com.mymita.repository.CardapioItemRepository;
import br.com.mymita.repository.CardapioPlanejadoRepository;
import br.com.mymita.repository.MarmitaRepository;
import br.com.mymita.repository.UsuarioRepository;
import br.com.mymita.util.JsonListUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class CardapioService {

    private final CardapioPlanejadoRepository cardapioRepository;
    private final CardapioItemRepository itemRepository;
    private final MarmitaRepository marmitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NutricaoService nutricaoService;
    private final CatalogoService catalogoService;

    public CardapioService(
            CardapioPlanejadoRepository cardapioRepository,
            CardapioItemRepository itemRepository,
            MarmitaRepository marmitaRepository,
            UsuarioRepository usuarioRepository,
            NutricaoService nutricaoService,
            CatalogoService catalogoService) {
        this.cardapioRepository = cardapioRepository;
        this.itemRepository = itemRepository;
        this.marmitaRepository = marmitaRepository;
        this.usuarioRepository = usuarioRepository;
        this.nutricaoService = nutricaoService;
        this.catalogoService = catalogoService;
    }

    @Transactional
    public CardapioResponse obterOuGerarCardapioAtual(Usuario cliente) {
        return cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(cliente.getId())
                .map(this::toResponse)
                .orElseGet(() -> gerarCardapioInteligente(cliente));
    }

    @Transactional(readOnly = true)
    public CardapioResponse obterCardapioPorClienteId(Long clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
        return cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(cliente.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente ainda não possui cardápio gerado."));
    }

    /**
     * Gera ou regenera cardápio semanal personalizado respeitando estritamente:
     * - RN02: Bloqueio estrito de alergênicos do perfil.
     * - RN06: Soberania da prescrição nutricional (itens com travadoNutri = true são preservados).
     */
    @Transactional
    public CardapioResponse gerarCardapioInteligente(Usuario cliente) {
        PerfilNutricional perfil = nutricaoService.obterOuCriarPerfil(cliente);
        List<Marmita> seguras = marmitaRepository.findByDisponivelTrueOrderByIdAsc().stream()
                .filter(m -> nutricaoService.marmitaEhSeguraParaPerfil(m, perfil))
                .toList();

        if (seguras.isEmpty()) {
            throw new BusinessException("Nenhuma marmita disponível compatível com suas restrições alimentares.");
        }

        LocalDate inicioSemana = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        CardapioPlanejado cardapio = cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(cliente.getId())
                .orElseGet(() -> {
                    CardapioPlanejado c = new CardapioPlanejado();
                    c.setCliente(cliente);
                    c.setSemanaReferencia(inicioSemana);
                    return c;
                });

        // Preserva itens travados pelo nutricionista (RN06)
        Map<String, CardapioItem> travados = new HashMap<>();
        for (CardapioItem existing : cardapio.getItens()) {
            if (existing.isTravadoNutri()) {
                travados.put(existing.getDiaSemana().name() + "_" + existing.getTipoRefeicao().name(), existing);
            }
        }

        cardapio.getItens().removeIf(i -> !i.isTravadoNutri());
        cardapio.setSemanaReferencia(inicioSemana);
        if (cardapio.getStatusAprovacao() != StatusAprovacaoCardapio.APROVADO_NUTRI) {
            cardapio.setStatusAprovacao(StatusAprovacaoCardapio.GERADO_IA);
        }
        cardapio.setAtualizadoEm(LocalDateTime.now());

        List<Marmita> cafes = filtrarPorTipo(seguras, TipoRefeicao.CAFE_MANHA);
        List<Marmita> lanches = filtrarPorTipo(seguras, TipoRefeicao.LANCHE_MANHA, TipoRefeicao.LANCHE_TARDE);
        List<Marmita> principais = filtrarPorTipo(seguras, TipoRefeicao.ALMOCO, TipoRefeicao.JANTAR);

        int idx = 0;
        for (DiaSemana dia : DiaSemana.values()) {
            for (TipoRefeicao tipo : TipoRefeicao.values()) {
                String key = dia.name() + "_" + tipo.name();
                if (travados.containsKey(key)) continue;

                List<Marmita> pool = switch (tipo) {
                    case CAFE_MANHA -> cafes;
                    case LANCHE_MANHA, LANCHE_TARDE -> lanches;
                    case ALMOCO, JANTAR -> principais;
                };
                if (pool.isEmpty()) pool = seguras;

                Marmita escolhida = pool.get((idx++) % pool.size());
                CardapioItem item = new CardapioItem();
                item.setCardapio(cardapio);
                item.setDiaSemana(dia);
                item.setTipoRefeicao(tipo);
                item.setHorarioSugerido(tipo.getHorarioPadrao());
                item.setMarmita(escolhida);
                item.setTravadoNutri(false);
                cardapio.getItens().add(item);
            }
        }

        cardapio = cardapioRepository.save(cardapio);
        return toResponse(cardapio);
    }

    /**
     * RF10 + RN02 + RN06: Troca dinâmica de prato no cardápio com recálculo instantâneo de macros.
     */
    @Transactional
    public CardapioResponse trocarPrato(Usuario usuario, Long itemId, Long novaMarmitaId) {
        CardapioItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Refeição do cardápio não encontrada."));

        boolean isNutriOrAdmin = usuario.getRole() == Role.NUTRICIONISTA || usuario.getRole() == Role.ADMIN;
        if (!isNutriOrAdmin && !item.getCardapio().getCliente().getId().equals(usuario.getId())) {
            throw new BusinessException("Você não pode alterar o cardápio de outro usuário.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        // RN06: Cliente não pode alterar refeição travada pelo nutricionista
        if (!isNutriOrAdmin && item.isTravadoNutri()) {
            throw new BusinessException(
                    "Esta refeição foi travada na prescrição do seu nutricionista (RN06). Converse pelo chat para solicitar ajuste.",
                    "RN06_LOCKED_BY_NUTRI",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Marmita nova = marmitaRepository.findById(novaMarmitaId)
                .orElseThrow(() -> new ResourceNotFoundException("Marmita selecionada não encontrada."));

        // RN02: Valida alergênicos do paciente
        PerfilNutricional perfil = nutricaoService.obterOuCriarPerfil(item.getCardapio().getCliente());
        if (!nutricaoService.marmitaEhSeguraParaPerfil(nova, perfil)) {
            throw new BusinessException(
                    "Esta marmita contém alergênicos ou restrições cadastradas no perfil (RN02).",
                    "RN02_ALLERGEN_BLOCKED",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        item.setMarmita(nova);
        item.getCardapio().setAtualizadoEm(LocalDateTime.now());
        itemRepository.save(item);
        return toResponse(cardapioRepository.findById(item.getCardapio().getId()).orElseThrow());
    }

    @Transactional
    public CardapioResponse alternarConsumido(Usuario cliente, Long itemId) {
        CardapioItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Refeição não encontrada."));
        if (!item.getCardapio().getCliente().getId().equals(cliente.getId())) {
            throw new BusinessException("Acesso negado.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }
        item.setConsumido(!item.isConsumido());
        itemRepository.save(item);
        return toResponse(cardapioRepository.findById(item.getCardapio().getId()).orElseThrow());
    }

    /**
     * RF05 + RN06: Nutricionista trava ou destrava uma refeição específica.
     */
    @Transactional
    public CardapioResponse alternarTravaNutricionista(Long itemId) {
        CardapioItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do cardápio não encontrado."));
        item.setTravadoNutri(!item.isTravadoNutri());
        itemRepository.save(item);
        return toResponse(cardapioRepository.findById(item.getCardapio().getId()).orElseThrow());
    }

    /**
     * RF05: Nutricionista aprova o cardápio clínico do paciente.
     */
    @Transactional
    public CardapioResponse aprovarCardapio(Long cardapioId, AprovarCardapioRequest req) {
        CardapioPlanejado c = cardapioRepository.findById(cardapioId)
                .orElseThrow(() -> new ResourceNotFoundException("Cardápio não encontrado."));
        c.setStatusAprovacao(StatusAprovacaoCardapio.APROVADO_NUTRI);
        if (req != null && req.orientacoesNutri() != null) {
            c.setOrientacoesNutri(JsonListUtil.sanitizeText(req.orientacoesNutri()));
        }
        c.setAtualizadoEm(LocalDateTime.now());
        return toResponse(cardapioRepository.save(c));
    }

    private List<Marmita> filtrarPorTipo(List<Marmita> todas, TipoRefeicao... tipos) {
        Set<TipoRefeicao> set = Set.of(tipos);
        return todas.stream().filter(m -> set.contains(m.getTipoSugerido())).toList();
    }

    public CardapioResponse toResponse(CardapioPlanejado c) {
        List<CardapioItem> sorted = new ArrayList<>(c.getItens());
        sorted.sort(Comparator.comparingInt((CardapioItem i) -> i.getDiaSemana().ordinal())
                .thenComparingInt(i -> i.getTipoRefeicao().ordinal()));

        List<CardapioItemResponse> itensDto = sorted.stream()
                .map(i -> new CardapioItemResponse(
                        i.getId(),
                        i.getDiaSemana(),
                        i.getTipoRefeicao(),
                        i.getTipoRefeicao().getLabel(),
                        i.getHorarioSugerido(),
                        i.isConsumido(),
                        i.isTravadoNutri(),
                        catalogoService.toMarmitaResponse(i.getMarmita())
                ))
                .toList();

        Map<DiaSemana, ResumoMacros> porDia = new EnumMap<>(DiaSemana.class);
        int sKcal = 0, sProt = 0, sCarb = 0, sGord = 0, sFibra = 0;

        for (DiaSemana d : DiaSemana.values()) {
            int kcal = 0, prot = 0, carb = 0, gord = 0, fibra = 0;
            for (CardapioItem i : sorted) {
                if (i.getDiaSemana() == d) {
                    Marmita m = i.getMarmita();
                    kcal += m.getKcal();
                    prot += m.getProteinaG();
                    carb += m.getCarboG();
                    gord += m.getGorduraG();
                    fibra += m.getFibraG();
                }
            }
            porDia.put(d, new ResumoMacros(kcal, prot, carb, gord, fibra));
            sKcal += kcal;
            sProt += prot;
            sCarb += carb;
            sGord += gord;
            sFibra += fibra;
        }

        return new CardapioResponse(
                c.getId(),
                c.getSemanaReferencia(),
                c.getStatusAprovacao(),
                c.getOrientacoesNutri(),
                itensDto,
                porDia,
                new ResumoMacros(sKcal, sProt, sCarb, sGord, sFibra)
        );
    }
}
