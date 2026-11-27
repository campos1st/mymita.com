package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.dto.CardapioDtos.*;
import br.com.mymita.service.CardapioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cardapios")
public class CardapioController {

    private final CardapioService cardapioService;

    public CardapioController(CardapioService cardapioService) {
        this.cardapioService = cardapioService;
    }

    @GetMapping("/atual")
    public ResponseEntity<CardapioResponse> obterAtual(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(cardapioService.obterOuGerarCardapioAtual(usuario));
    }

    @PostMapping("/gerar-ia")
    public ResponseEntity<CardapioResponse> gerarComIa(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(cardapioService.gerarCardapioInteligente(usuario));
    }

    @PatchMapping("/itens/{itemId}")
    public ResponseEntity<CardapioResponse> trocarPrato(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long itemId,
            @Valid @RequestBody TrocarPratoRequest req) {
        return ResponseEntity.ok(cardapioService.trocarPrato(usuario, itemId, req.novaMarmitaId()));
    }

    @PatchMapping("/itens/{itemId}/consumido")
    public ResponseEntity<CardapioResponse> alternarConsumido(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(cardapioService.alternarConsumido(usuario, itemId));
    }
}
