package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.dto.PerfilDtos.*;
import br.com.mymita.service.CardapioService;
import br.com.mymita.service.NutricaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/perfil")
public class PerfilController {

    private final NutricaoService nutricaoService;
    private final CardapioService cardapioService;

    public PerfilController(NutricaoService nutricaoService, CardapioService cardapioService) {
        this.nutricaoService = nutricaoService;
        this.cardapioService = cardapioService;
    }

    @GetMapping
    public ResponseEntity<PerfilResponse> getPerfil(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(nutricaoService.getPerfil(usuario));
    }

    @PutMapping("/onboarding")
    public ResponseEntity<PerfilResponse> salvarOnboarding(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody OnboardingRequest req) {
        PerfilResponse resp = nutricaoService.salvarOnboarding(usuario, req);
        // Gera cardápio inicial automático compatível com o novo perfil (RN02)
        cardapioService.gerarCardapioInteligente(usuario);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/evolucao")
    public ResponseEntity<List<EvolucaoResponse>> listarEvolucao(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(nutricaoService.listarEvolucao(usuario.getId()));
    }

    @PostMapping("/evolucao")
    public ResponseEntity<EvolucaoResponse> registrarCheckIn(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CheckInRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(nutricaoService.registrarCheckIn(usuario, req));
    }
}
