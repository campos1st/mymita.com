package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.dto.AuthDtos.*;
import br.com.mymita.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/usuarios/me")
    public ResponseEntity<UserSummary> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(authService.getMe(usuario));
    }

    @PutMapping("/usuarios/me")
    public ResponseEntity<UserSummary> updateMe(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(authService.updateMe(usuario, req));
    }

    @DeleteMapping("/usuarios/me")
    public ResponseEntity<Map<String, String>> excluirContaLgpd(@AuthenticationPrincipal Usuario usuario) {
        authService.excluirContaLgpd(usuario);
        return ResponseEntity.ok(Map.of("mensagem", "Conta e dados pessoais excluídos definitivamente conforme a LGPD (Lei nº 13.709/2018)."));
    }
}
