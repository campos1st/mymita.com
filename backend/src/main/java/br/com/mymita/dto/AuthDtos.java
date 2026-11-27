package br.com.mymita.dto;

import br.com.mymita.domain.enums.Role;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Informe seu nome completo") String nome,
            @NotBlank(message = "Informe um e-mail válido") @Email(message = "Por favor, insira um e-mail válido no formato nome@dominio.com") String email,
            @NotBlank(message = "Crie uma senha") @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres") String senha,
            String cpf,
            String telefone,
            Role role,
            String crn,
            @AssertTrue(message = "É necessário aceitar o termo de consentimento LGPD") boolean consentimentoLgpd
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe a senha") String senha
    ) {}

    public record UserSummary(
            Long id,
            String nome,
            String email,
            String cpf,
            String telefone,
            String avatarUrl,
            Role role,
            String crn,
            boolean consentimentoLgpd,
            boolean onboardingConcluido,
            LocalDateTime dataCadastro
    ) {}

    public record AuthResponse(
            String token,
            UserSummary usuario
    ) {}

    public record UpdateUserRequest(
            @NotBlank(message = "Nome é obrigatório") String nome,
            String cpf,
            String telefone
    ) {}
}
