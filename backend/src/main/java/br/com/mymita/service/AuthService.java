package br.com.mymita.service;

import br.com.mymita.config.JwtService;
import br.com.mymita.domain.PerfilNutricional;
import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.Role;
import br.com.mymita.dto.AuthDtos.*;
import br.com.mymita.exception.BusinessException;
import br.com.mymita.repository.PerfilNutricionalRepository;
import br.com.mymita.repository.UsuarioRepository;
import br.com.mymita.util.JsonListUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PerfilNutricionalRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PerfilNutricionalRepository perfilRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe uma conta cadastrada com este e-mail.", "EMAIL_IN_USE", HttpStatus.CONFLICT);
        }

        Role role = req.role() != null ? req.role() : Role.CLIENTE;
        if (role == Role.ADMIN) {
            role = Role.CLIENTE; // Impede auto-cadastro como ADMIN
        }
        if (role == Role.NUTRICIONISTA && (req.crn() == null || req.crn().isBlank())) {
            throw new BusinessException("Nutricionistas devem informar o registro CRN válido.", "CRN_REQUIRED", HttpStatus.BAD_REQUEST);
        }

        Usuario u = new Usuario();
        u.setNome(JsonListUtil.sanitizeText(req.nome()));
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(req.senha()));
        u.setCpf(JsonListUtil.sanitizeText(req.cpf()));
        u.setTelefone(JsonListUtil.sanitizeText(req.telefone()));
        u.setRole(role);
        u.setCrn(role == Role.NUTRICIONISTA ? JsonListUtil.sanitizeText(req.crn()) : null);
        u.setConsentimentoLgpd(req.consentimentoLgpd());
        u.setDataConsentimentoLgpd(LocalDateTime.now());
        u.setAtivo(true);
        u = usuarioRepository.save(u);

        if (role == Role.CLIENTE) {
            PerfilNutricional perfil = new PerfilNutricional();
            perfil.setCliente(u);
            // Vincula automaticamente ao primeiro nutricionista ativo (RF04)
            usuarioRepository.findByRoleAndAtivoTrue(Role.NUTRICIONISTA).stream()
                    .findFirst()
                    .ifPresent(perfil::setNutricionista);
            perfilRepository.save(perfil);
        }

        String token = jwtService.generateToken(u);
        return new AuthResponse(token, toSummary(u));
    }

    public AuthResponse login(LoginRequest req) {
        Usuario u = usuarioRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));

        if (!u.isAtivo() || !passwordEncoder.matches(req.senha(), u.getSenhaHash())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }

        String token = jwtService.generateToken(u);
        return new AuthResponse(token, toSummary(u));
    }

    public UserSummary getMe(Usuario usuario) {
        return toSummary(usuario);
    }

    @Transactional
    public UserSummary updateMe(Usuario usuario, UpdateUserRequest req) {
        usuario.setNome(JsonListUtil.sanitizeText(req.nome()));
        usuario.setCpf(JsonListUtil.sanitizeText(req.cpf()));
        usuario.setTelefone(JsonListUtil.sanitizeText(req.telefone()));
        usuario = usuarioRepository.save(usuario);
        return toSummary(usuario);
    }

    @Transactional
    public void excluirContaLgpd(Usuario usuario) {
        // Exclusão definitiva conforme LGPD (Lei nº 13.709/2018 - RNF04)
        usuarioRepository.deleteById(usuario.getId());
    }

    public UserSummary toSummary(Usuario u) {
        boolean onboardingConcluido = u.getRole() != Role.CLIENTE ||
                perfilRepository.findByClienteId(u.getId())
                        .map(PerfilNutricional::isOnboardingConcluido)
                        .orElse(false);

        return new UserSummary(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getCpf(),
                u.getTelefone(),
                u.getAvatarUrl(),
                u.getRole(),
                u.getCrn(),
                u.isConsentimentoLgpd(),
                onboardingConcluido,
                u.getDataCadastro()
        );
    }
}
