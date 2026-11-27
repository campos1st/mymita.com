package br.com.mymita.service;

import br.com.mymita.domain.EvolucaoBiometrica;
import br.com.mymita.domain.Marmita;
import br.com.mymita.domain.PerfilNutricional;
import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.ObjetivoNutricional;
import br.com.mymita.domain.enums.Role;
import br.com.mymita.domain.enums.SexoBiologico;
import br.com.mymita.dto.PerfilDtos.*;
import br.com.mymita.exception.ResourceNotFoundException;
import br.com.mymita.repository.EvolucaoBiometricaRepository;
import br.com.mymita.repository.PerfilNutricionalRepository;
import br.com.mymita.repository.UsuarioRepository;
import br.com.mymita.util.JsonListUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NutricaoService {

    private final PerfilNutricionalRepository perfilRepository;
    private final EvolucaoBiometricaRepository evolucaoRepository;
    private final UsuarioRepository usuarioRepository;

    public NutricaoService(
            PerfilNutricionalRepository perfilRepository,
            EvolucaoBiometricaRepository evolucaoRepository,
            UsuarioRepository usuarioRepository) {
        this.perfilRepository = perfilRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public PerfilNutricional obterOuCriarPerfil(Usuario cliente) {
        return perfilRepository.findByClienteId(cliente.getId()).orElseGet(() -> {
            PerfilNutricional p = new PerfilNutricional();
            p.setCliente(cliente);
            usuarioRepository.findByRoleAndAtivoTrue(Role.NUTRICIONISTA).stream()
                    .findFirst()
                    .ifPresent(p::setNutricionista);
            return perfilRepository.save(p);
        });
    }

    @Transactional
    public PerfilResponse getPerfil(Usuario cliente) {
        return toResponse(obterOuCriarPerfil(cliente));
    }

    @Transactional(readOnly = true)
    public PerfilResponse getPerfilByClienteId(Long clienteId) {
        PerfilNutricional p = perfilRepository.findByClienteId(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil nutricional não encontrado."));
        return toResponse(p);
    }

    /**
     * RF02 + RF03: Onboarding biométrico com cálculo automático de TMB (Mifflin-St Jeor),
     * GET e metas de calorias/macronutrientes. Respeita RN06 caso nutricionista já tenha definido metas.
     */
    @Transactional
    public PerfilResponse salvarOnboarding(Usuario cliente, OnboardingRequest req) {
        PerfilNutricional p = obterOuCriarPerfil(cliente);
        p.setPesoKg(req.pesoKg());
        p.setAlturaCm(req.alturaCm());
        p.setIdade(req.idade());
        p.setSexo(req.sexo());
        p.setNivelAtividade(req.nivelAtividade());
        p.setObjetivo(req.objetivo());
        p.setRestricoesJson(JsonListUtil.toJson(req.restricoes()));
        p.setAlergiasJson(JsonListUtil.toJson(req.alergias()));

        double peso = req.pesoKg().doubleValue();
        double tmb = (10.0 * peso) + (6.25 * req.alturaCm()) - (5.0 * req.idade())
                + (req.sexo() == SexoBiologico.MASCULINO ? 5.0 : -161.0);
        int tmbInt = (int) Math.round(tmb);
        int getInt = (int) Math.round(tmb * req.nivelAtividade().getFator());

        p.setTmbKcal(tmbInt);
        p.setGetKcal(getInt);

        // RN06: Se o nutricionista ainda não travou metas manuais, calcula metas automáticas
        if (!p.isMetasDefinidasNutri()) {
            int metaKcal = switch (req.objetivo()) {
                case EMAGRECIMENTO -> Math.max(1300, getInt - 400);
                case HIPERTROFIA -> getInt + 350;
                case MANUTENCAO -> getInt;
            };
            double protPorKg = req.objetivo() == ObjetivoNutricional.HIPERTROFIA ? 2.1
                    : (req.objetivo() == ObjetivoNutricional.EMAGRECIMENTO ? 2.0 : 1.7);
            int proteinaG = (int) Math.round(peso * protPorKg);
            int gorduraG = (int) Math.round((metaKcal * 0.25) / 9.0);
            int carboKcal = Math.max(200, metaKcal - (proteinaG * 4) - (gorduraG * 9));
            int carboG = (int) Math.round(carboKcal / 4.0);
            BigDecimal agua = BigDecimal.valueOf(peso * 0.035).setScale(2, RoundingMode.HALF_UP);

            p.setMetaKcal(metaKcal);
            p.setMetaProteinaG(proteinaG);
            p.setMetaGorduraG(gorduraG);
            p.setMetaCarboG(carboG);
            p.setMetaAguaLitros(agua);
        }

        p.setOnboardingConcluido(true);
        p.setAtualizadoEm(LocalDateTime.now());
        p = perfilRepository.save(p);

        // Registra ponto inicial de evolução se ainda não houver check-ins
        if (evolucaoRepository.findByClienteIdOrderByDataRegistroAsc(cliente.getId()).isEmpty()) {
            EvolucaoBiometrica ev = new EvolucaoBiometrica();
            ev.setCliente(cliente);
            ev.setDataRegistro(LocalDate.now());
            ev.setPesoKg(req.pesoKg());
            ev.setAguaLitros(p.getMetaAguaLitros());
            ev.setNotasPaciente("Check-in inicial do onboarding biométrico.");
            evolucaoRepository.save(ev);
        }

        return toResponse(p);
    }

    /**
     * RF04 + RN06: Ajuste manual de metas pelo nutricionista (soberania da prescrição clínica).
     */
    @Transactional
    public PerfilResponse ajustarMetasNutricionista(Long clienteId, AjusteMetasNutriRequest req) {
        PerfilNutricional p = perfilRepository.findByClienteId(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil do paciente não encontrado."));
        p.setMetaKcal(req.metaKcal());
        p.setMetaProteinaG(req.metaProteinaG());
        p.setMetaCarboG(req.metaCarboG());
        p.setMetaGorduraG(req.metaGorduraG());
        if (req.metaAguaLitros() != null) {
            p.setMetaAguaLitros(req.metaAguaLitros());
        }
        p.setObservacoesClinicas(JsonListUtil.sanitizeText(req.observacoesClinicas()));
        p.setMetasDefinidasNutri(true);
        p.setAtualizadoEm(LocalDateTime.now());
        return toResponse(perfilRepository.save(p));
    }

    @Transactional
    public EvolucaoResponse registrarCheckIn(Usuario cliente, CheckInRequest req) {
        EvolucaoBiometrica ev = new EvolucaoBiometrica();
        ev.setCliente(cliente);
        ev.setDataRegistro(LocalDate.now());
        ev.setPesoKg(req.pesoKg());
        ev.setPercentualGordura(req.percentualGordura());
        ev.setAguaLitros(req.aguaLitros());
        ev.setNotasPaciente(JsonListUtil.sanitizeText(req.notasPaciente()));
        ev = evolucaoRepository.save(ev);

        // Atualiza peso atual no perfil
        perfilRepository.findByClienteId(cliente.getId()).ifPresent(p -> {
            p.setPesoKg(req.pesoKg());
            p.setAtualizadoEm(LocalDateTime.now());
            perfilRepository.save(p);
        });

        return toEvolucaoResponse(ev);
    }

    public List<EvolucaoResponse> listarEvolucao(Long clienteId) {
        return evolucaoRepository.findByClienteIdOrderByDataRegistroAsc(clienteId)
                .stream()
                .map(this::toEvolucaoResponse)
                .toList();
    }

    /**
     * RN02: Verifica de forma determinística se uma marmita é segura frente às alergias/restrições do usuário.
     */
    public boolean marmitaEhSeguraParaPerfil(Marmita marmita, PerfilNutricional perfil) {
        if (perfil == null) return true;
        List<String> alergias = JsonListUtil.parseList(perfil.getAlergiasJson());
        List<String> restricoes = JsonListUtil.parseList(perfil.getRestricoesJson());
        List<String> alergenosMarmita = JsonListUtil.parseList(marmita.getAlergenosJson());

        Set<String> bloqueados = alergias.stream().map(String::toLowerCase).collect(Collectors.toSet());
        for (String r : restricoes) {
            String norm = r.toLowerCase();
            if (norm.contains("lactose")) bloqueados.add("lactose");
            if (norm.contains("gluten") || norm.contains("glúten")) bloqueados.add("gluten");
            if (norm.contains("amendoim")) bloqueados.add("amendoim");
            if (norm.contains("castanha") || norm.contains("oleaginosa")) bloqueados.add("castanhas");
            if (norm.contains("frutos_do_mar") || norm.contains("peixe")) bloqueados.add("peixe");
            if (norm.contains("soja")) bloqueados.add("soja");
            if (norm.contains("ovo")) bloqueados.add("ovo");
        }

        if (restricoes.stream().anyMatch(r -> r.equalsIgnoreCase("vegano"))) {
            if (marmita.getCategoria() != br.com.mymita.domain.enums.CategoriaMarmita.VEGANA) {
                return false;
            }
        }

        for (String a : alergenosMarmita) {
            if (bloqueados.contains(a.toLowerCase())) {
                return false;
            }
        }
        return true;
    }

    public PerfilResponse toResponse(PerfilNutricional p) {
        return new PerfilResponse(
                p.getId(),
                p.getCliente().getId(),
                p.getCliente().getNome(),
                p.getNutricionista() != null ? p.getNutricionista().getId() : null,
                p.getNutricionista() != null ? p.getNutricionista().getNome() : null,
                p.getNutricionista() != null ? p.getNutricionista().getCrn() : null,
                p.getPesoKg(),
                p.getAlturaCm(),
                p.getIdade(),
                p.getSexo(),
                p.getNivelAtividade(),
                p.getObjetivo(),
                JsonListUtil.parseList(p.getRestricoesJson()),
                JsonListUtil.parseList(p.getAlergiasJson()),
                p.getTmbKcal(),
                p.getGetKcal(),
                p.getMetaKcal(),
                p.getMetaProteinaG(),
                p.getMetaCarboG(),
                p.getMetaGorduraG(),
                p.getMetaAguaLitros(),
                p.isMetasDefinidasNutri(),
                p.getObservacoesClinicas(),
                p.isOnboardingConcluido()
        );
    }

    public EvolucaoResponse toEvolucaoResponse(EvolucaoBiometrica ev) {
        return new EvolucaoResponse(
                ev.getId(),
                ev.getDataRegistro(),
                ev.getPesoKg(),
                ev.getPercentualGordura(),
                ev.getAguaLitros(),
                ev.getNotasPaciente(),
                ev.getFeedbackNutri()
        );
    }
}
