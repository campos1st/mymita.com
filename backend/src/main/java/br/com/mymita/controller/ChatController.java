package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.dto.ChatDtos.*;
import br.com.mymita.service.GeminiChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final GeminiChatService chatService;

    public ChatController(GeminiChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/mensagens")
    public ResponseEntity<List<MensagemResponse>> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(chatService.listarMensagens(usuario.getId()));
    }

    @PostMapping("/ia")
    public ResponseEntity<List<MensagemResponse>> enviarIa(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody EnviarMensagemRequest req) {
        return ResponseEntity.ok(chatService.enviarParaIa(usuario, req.conteudo()));
    }

    @PostMapping("/nutricionista")
    public ResponseEntity<MensagemResponse> enviarNutricionista(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody EnviarMensagemRequest req) {
        return ResponseEntity.ok(chatService.enviarParaNutricionista(usuario, req.conteudo()));
    }
}
