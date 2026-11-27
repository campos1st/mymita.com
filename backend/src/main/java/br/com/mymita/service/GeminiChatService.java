package br.com.mymita.service;

import br.com.mymita.domain.Marmita;
import br.com.mymita.domain.MensagemChat;
import br.com.mymita.domain.PerfilNutricional;
import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.CategoriaMarmita;
import br.com.mymita.domain.enums.RemetenteChat;
import br.com.mymita.domain.enums.TipoRefeicao;
import br.com.mymita.dto.ChatDtos.*;
import br.com.mymita.exception.ResourceNotFoundException;
import br.com.mymita.repository.MarmitaRepository;
import br.com.mymita.repository.MensagemChatRepository;
import br.com.mymita.repository.UsuarioRepository;
import br.com.mymita.util.JsonListUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeminiChatService {

    private final MensagemChatRepository chatRepository;
    private final MarmitaRepository marmitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NutricaoService nutricaoService;
    private final CatalogoService catalogoService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    @Value("${mymita.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${mymita.gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    public GeminiChatService(
            MensagemChatRepository chatRepository,
            MarmitaRepository marmitaRepository,
            UsuarioRepository usuarioRepository,
            NutricaoService nutricaoService,
            CatalogoService catalogoService) {
        this.chatRepository = chatRepository;
        this.marmitaRepository = marmitaRepository;
        this.usuarioRepository = usuarioRepository;
        this.nutricaoService = nutricaoService;
        this.catalogoService = catalogoService;
    }

    @Transactional(readOnly = true)
    public List<MensagemResponse> listarMensagens(Long clienteId) {
        return chatRepository.findByClienteIdOrderByTimestampAsc(clienteId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * RF06 + RN02 + RN06: Envia mensagem para o assistente de IA (Google Gemini API ou motor sandbox local).
     * Bloqueia determinísticamente qualquer marmita com alergênicos do paciente (RN02) e respeita metas clínicas (RN06).
     */
    @Transactional
    public List<MensagemResponse> enviarParaIa(Usuario cliente, String conteudoBruto) {
        String conteudo = JsonListUtil.sanitizeText(conteudoBruto);
        MensagemChat msgUser = new MensagemChat();
        msgUser.setCliente(cliente);
        msgUser.setRemetenteTipo(RemetenteChat.CLIENTE);
        msgUser.setConteudo(conteudo);
        msgUser.setTimestamp(LocalDateTime.now());
        chatRepository.save(msgUser);

        PerfilNutricional perfil = nutricaoService.obterOuCriarPerfil(cliente);
        // RN02: Apenas marmitas 100% livres dos alergênicos/restrições do usuário chegam ao motor de IA
        List<Marmita> catalogoSeguro = marmitaRepository.findByDisponivelTrueOrderByIdAsc().stream()
                .filter(m -> nutricaoService.marmitaEhSeguraParaPerfil(m, perfil))
                .toList();

        Marmita sugerida = selecionarMelhorMarmitaSegura(conteudo, catalogoSeguro, perfil);
        String respostaTexto = chamarGeminiOuFallback(conteudo, perfil, catalogoSeguro, sugerida);

        MensagemChat msgIa = new MensagemChat();
        msgIa.setCliente(cliente);
        msgIa.setRemetenteTipo(RemetenteChat.IA);
        msgIa.setConteudo(respostaTexto);
        msgIa.setMarmitaSugerida(sugerida);
        msgIa.setTimestamp(LocalDateTime.now().plusSeconds(1));
        chatRepository.save(msgIa);

        return List.of(toResponse(msgUser), toResponse(msgIa));
    }

    /**
     * RF06: Cliente envia mensagem direta escalonada para o nutricionista vinculado.
     */
    @Transactional
    public MensagemResponse enviarParaNutricionista(Usuario cliente, String conteudoBruto) {
        MensagemChat msg = new MensagemChat();
        msg.setCliente(cliente);
        msg.setRemetenteTipo(RemetenteChat.CLIENTE);
        msg.setConteudo("[Para o Nutricionista] " + JsonListUtil.sanitizeText(conteudoBruto));
        msg.setTimestamp(LocalDateTime.now());
        return toResponse(chatRepository.save(msg));
    }

    /**
     * RF06: Nutricionista responde diretamente no chat híbrido do paciente.
     */
    @Transactional
    public MensagemResponse responderComoNutricionista(Long clienteId, String conteudoBruto, Long marmitaSugeridaId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado."));
        MensagemChat msg = new MensagemChat();
        msg.setCliente(cliente);
        msg.setRemetenteTipo(RemetenteChat.NUTRICIONISTA);
        msg.setConteudo(JsonListUtil.sanitizeText(conteudoBruto));
        if (marmitaSugeridaId != null) {
            Marmita m = marmitaRepository.findById(marmitaSugeridaId).orElse(null);
            PerfilNutricional perfil = nutricaoService.obterOuCriarPerfil(cliente);
            if (m != null && nutricaoService.marmitaEhSeguraParaPerfil(m, perfil)) {
                msg.setMarmitaSugerida(m);
            }
        }
        msg.setTimestamp(LocalDateTime.now());
        return toResponse(chatRepository.save(msg));
    }

    private Marmita selecionarMelhorMarmitaSegura(String pergunta, List<Marmita> seguras, PerfilNutricional perfil) {
        if (seguras.isEmpty()) return null;
        String q = pergunta.toLowerCase();

        // Pontuação semântica simples e determinística sobre o catálogo já filtrado por RN02
        return seguras.stream()
                .max(Comparator.comparingInt(m -> pontuarMarmita(m, q, perfil)))
                .orElse(seguras.getFirst());
    }

    private int pontuarMarmita(Marmita m, String q, PerfilNutricional perfil) {
        int score = 0;
        String texto = (m.getNome() + " " + m.getIngredientes() + " " + m.getDescricao()).toLowerCase();

        if (q.contains("lanche") && (m.getTipoSugerido() == TipoRefeicao.LANCHE_TARDE || m.getTipoSugerido() == TipoRefeicao.LANCHE_MANHA)) score += 10;
        if ((q.contains("café") || q.contains("cafe") || q.contains("manhã") || q.contains("manha")) && m.getTipoSugerido() == TipoRefeicao.CAFE_MANHA) score += 10;
        if (q.contains("almoço") || q.contains("almoco")) {
            if (m.getTipoSugerido() == TipoRefeicao.ALMOCO) score += 8;
        }
        if (q.contains("jantar") && m.getTipoSugerido() == TipoRefeicao.JANTAR) score += 9;
        if (q.contains("frango") && texto.contains("frango")) score += 8;
        if ((q.contains("salmão") || q.contains("salmao") || q.contains("peixe") || q.contains("tilápia")) && (texto.contains("salmão") || texto.contains("tilápia"))) score += 8;
        if ((q.contains("carne") || q.contains("patinho")) && (texto.contains("patinho") || texto.contains("carne"))) score += 8;
        if ((q.contains("vegano") || q.contains("vegana") || q.contains("planta")) && m.getCategoria() == CategoriaMarmita.VEGANA) score += 10;
        if (q.contains("low carb") && m.getCategoria() == CategoriaMarmita.LOW_CARB) score += 9;
        if ((q.contains("poucas calorias") || q.contains("leve") || q.contains("emagrec")) && m.getKcal() <= 360) score += 6;
        if ((q.contains("proteína") || q.contains("proteina") || q.contains("hipertrofia")) && m.getProteinaG() >= 32) score += 6;
        if (q.contains("arroz") && texto.contains("arroz")) score += 5;
        if (q.contains("abóbora") || q.contains("abobora")) {
            if (texto.contains("abóbora")) score += 8;
        }
        return score;
    }

    private String chamarGeminiOuFallback(String pergunta, PerfilNutricional perfil, List<Marmita> seguras, Marmita sugerida) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String catalogoStr = seguras.stream()
                        .limit(8)
                        .map(m -> String.format("- %s (%s, %d kcal, %dg prot, %dg carb, %dg gord)",
                                m.getNome(), m.getCategoria(), m.getKcal(), m.getProteinaG(), m.getCarboG(), m.getGorduraG()))
                        .collect(Collectors.joining("\n"));

                String prompt = """
                        Você é a Mila, assistente nutricional oficial do MYMita. Responda em português do Brasil, de forma curta, acolhedora e objetiva (máximo 3 frases).
                        Regras obrigatórias:
                        - NUNCA sugira alimentos contendo alergias do cliente: %s.
                        - Respeite rigorosamente as metas do cliente: %d kcal/dia, %dg proteína, objetivo %s%s.
                        - Destaque a marmita segura recomendada: %s.
                        Catálogo seguro disponível:
                        %s
                        Pergunta do cliente: %s
                        """.formatted(
                        perfil.getAlergiasJson(),
                        perfil.getMetaKcal() != null ? perfil.getMetaKcal() : 2000,
                        perfil.getMetaProteinaG() != null ? perfil.getMetaProteinaG() : 140,
                        perfil.getObjetivo() != null ? perfil.getObjetivo() : "SAUDE",
                        perfil.isMetasDefinidasNutri() ? " (prescrição clínica travada pelo nutricionista)" : "",
                        sugerida != null ? sugerida.getNome() : "opção do catálogo",
                        catalogoStr,
                        pergunta
                );

                Map<String, Object> body = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
                );

                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;
                String raw = restClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);

                JsonNode root = objectMapper.readTree(raw);
                String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("");
                if (!text.isBlank()) return text.trim();
            } catch (Exception ignored) {
                // Fallback seguro caso API externa falhe
            }
        }

        // Resposta inteligente em modo Sandbox respeitando RN02 e RN06
        String alergiasInfo = JsonListUtil.parseList(perfil.getAlergiasJson()).isEmpty()
                ? ""
                : " (100% livre das suas alergias cadastradas: " + String.join(", ", JsonListUtil.parseList(perfil.getAlergiasJson())) + ")";
        String metaInfo = perfil.getMetaKcal() != null
                ? String.format("alinhada à sua meta de %d kcal e %dg de proteína%s",
                        perfil.getMetaKcal(),
                        perfil.getMetaProteinaG(),
                        perfil.isMetasDefinidasNutri() ? " prescrita pelo seu nutricionista" : "")
                : "equilibrada para sua rotina";

        if (sugerida != null) {
            return String.format(
                    "Aqui está uma ótima opção %s%s! Recomendo **%s** (%d kcal, %dg de proteína). Você pode ver os detalhes ou aplicar diretamente no seu plano alimentar.",
                    metaInfo, alergiasInfo, sugerida.getNome(), sugerida.getKcal(), sugerida.getProteinaG()
            );
        }
        return "Analisei seu perfil nutricional e estou pronto para ajudar! Você também pode acionar seu nutricionista diretamente pela aba acima.";
    }

    public MensagemResponse toResponse(MensagemChat m) {
        return new MensagemResponse(
                m.getId(),
                m.getRemetenteTipo(),
                m.getConteudo(),
                m.getMarmitaSugerida() != null ? catalogoService.toMarmitaResponse(m.getMarmitaSugerida()) : null,
                m.getTimestamp()
        );
    }
}
