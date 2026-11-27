package br.com.mymita.controller;

import br.com.mymita.domain.PerfilNutricional;
import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.Role;
import br.com.mymita.dto.AdminDtos.PacienteResumo;
import br.com.mymita.dto.CardapioDtos.*;
import br.com.mymita.dto.ChatDtos.*;
import br.com.mymita.dto.PerfilDtos.*;
import br.com.mymita.repository.CardapioPlanejadoRepository;
import br.com.mymita.repository.MensagemChatRepository;
import br.com.mymita.repository.PerfilNutricionalRepository;
import br.com.mymita.service.CardapioService;
import br.com.mymita.service.GeminiChatService;
import br.com.mymita.service.NutricaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/nutri")
public class NutricionistaController {

    private final PerfilNutricionalRepository perfilRepository;
    private final CardapioPlanejadoRepository cardapioRepository;
    private final MensagemChatRepository chatRepository;
    private final NutricaoService nutricaoService;
    private final CardapioService cardapioService;
    private final GeminiChatService chatService;

    public NutricionistaController(
            PerfilNutricionalRepository perfilRepository,
            CardapioPlanejadoRepository cardapioRepository,
            MensagemChatRepository chatRepository,
            NutricaoService nutricaoService,
            CardapioService cardapioService,
            GeminiChatService chatService) {
        this.perfilRepository = perfilRepository;
        this.cardapioRepository = cardapioRepository;
        this.chatRepository = chatRepository;
        this.nutricaoService = nutricaoService;
        this.cardapioService = cardapioService;
        this.chatService = chatService;
    }

    @GetMapping("/pacientes")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PacienteResumo>> listarPacientes(@AuthenticationPrincipal Usuario nutri) {
        List<PerfilNutricional> perfis = nutri.getRole() == Role.ADMIN
                ? perfilRepository.findAll()
                : perfilRepository.findByNutricionistaId(nutri.getId());

        List<PacienteResumo> resumos = perfis.stream().map(p -> {
            Long cid = p.getCliente().getId();
            String statusCardapio = cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(cid)
                    .map(c -> c.getStatusAprovacao().name())
                    .orElse("SEM_CARDAPIO");
            int totalMsgs = chatRepository.findByClienteIdOrderByTimestampAsc(cid).size();
            return new PacienteResumo(
                    cid,
                    p.getCliente().getNome(),
                    p.getCliente().getEmail(),
                    p.getObjetivo() != null ? p.getObjetivo().name() : "N/D",
                    p.getMetaKcal(),
                    p.getMetaProteinaG(),
                    p.getPesoKg(),
                    statusCardapio,
                    totalMsgs
            );
        }).toList();

        return ResponseEntity.ok(resumos);
    }

    @GetMapping("/pacientes/{clienteId}/prontuario")
    public ResponseEntity<Map<String, Object>> obterProntuario(@PathVariable Long clienteId) {
        PerfilResponse perfil = nutricaoService.getPerfilByClienteId(clienteId);
        List<EvolucaoResponse> evolucao = nutricaoService.listarEvolucao(clienteId);
        CardapioResponse cardapio = null;
        try {
            cardapio = cardapioService.obterCardapioPorClienteId(clienteId);
        } catch (Exception ignored) {}
        List<MensagemResponse> chat = chatService.listarMensagens(clienteId);

        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("perfil", perfil);
        payload.put("evolucao", evolucao);
        payload.put("cardapio", cardapio);
        payload.put("chat", chat);
        return ResponseEntity.ok(payload);
    }

    @PutMapping("/pacientes/{clienteId}/metas")
    public ResponseEntity<PerfilResponse> ajustarMetas(
            @PathVariable Long clienteId,
            @Valid @RequestBody AjusteMetasNutriRequest req) {
        return ResponseEntity.ok(nutricaoService.ajustarMetasNutricionista(clienteId, req));
    }

    @PatchMapping("/cardapios/{cardapioId}/aprovar")
    public ResponseEntity<CardapioResponse> aprovarCardapio(
            @PathVariable Long cardapioId,
            @RequestBody(required = false) AprovarCardapioRequest req) {
        return ResponseEntity.ok(cardapioService.aprovarCardapio(cardapioId, req));
    }

    @PatchMapping("/cardapios/itens/{itemId}/travar")
    public ResponseEntity<CardapioResponse> alternarTrava(@PathVariable Long itemId) {
        return ResponseEntity.ok(cardapioService.alternarTravaNutricionista(itemId));
    }

    @PostMapping("/pacientes/{clienteId}/chat")
    public ResponseEntity<MensagemResponse> responderChat(
            @PathVariable Long clienteId,
            @RequestParam(required = false) Long marmitaSugeridaId,
            @Valid @RequestBody EnviarMensagemRequest req) {
        return ResponseEntity.ok(chatService.responderComoNutricionista(clienteId, req.conteudo(), marmitaSugeridaId));
    }
}
