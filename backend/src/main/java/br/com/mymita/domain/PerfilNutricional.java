package br.com.mymita.domain;

import br.com.mymita.domain.enums.NivelAtividade;
import br.com.mymita.domain.enums.ObjetivoNutricional;
import br.com.mymita.domain.enums.SexoBiologico;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "perfil_nutricional")
public class PerfilNutricional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_perfil")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false, unique = true)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_nutricionista")
    private Usuario nutricionista;

    @Column(name = "peso_kg", precision = 5, scale = 2)
    private BigDecimal pesoKg;

    @Column(name = "altura_cm")
    private Integer alturaCm;

    private Integer idade;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SexoBiologico sexo;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_atividade", length = 30)
    private NivelAtividade nivelAtividade;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ObjetivoNutricional objetivo;

    @Column(name = "restricoes_json", nullable = false, columnDefinition = "TEXT")
    private String restricoesJson = "[]";

    @Column(name = "alergias_json", nullable = false, columnDefinition = "TEXT")
    private String alergiasJson = "[]";

    @Column(name = "tmb_kcal")
    private Integer tmbKcal;

    @Column(name = "get_kcal")
    private Integer getKcal;

    @Column(name = "meta_kcal")
    private Integer metaKcal;

    @Column(name = "meta_proteina_g")
    private Integer metaProteinaG;

    @Column(name = "meta_carbo_g")
    private Integer metaCarboG;

    @Column(name = "meta_gordura_g")
    private Integer metaGorduraG;

    @Column(name = "meta_agua_litros", precision = 4, scale = 2)
    private BigDecimal metaAguaLitros = BigDecimal.valueOf(2.50);

    @Column(name = "metas_definidas_nutri", nullable = false)
    private boolean metasDefinidasNutri = false;

    @Column(name = "observacoes_clinicas", columnDefinition = "TEXT")
    private String observacoesClinicas;

    @Column(name = "onboarding_concluido", nullable = false)
    private boolean onboardingConcluido = false;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }
    public Usuario getNutricionista() { return nutricionista; }
    public void setNutricionista(Usuario nutricionista) { this.nutricionista = nutricionista; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal pesoKg) { this.pesoKg = pesoKg; }
    public Integer getAlturaCm() { return alturaCm; }
    public void setAlturaCm(Integer alturaCm) { this.alturaCm = alturaCm; }
    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }
    public SexoBiologico getSexo() { return sexo; }
    public void setSexo(SexoBiologico sexo) { this.sexo = sexo; }
    public NivelAtividade getNivelAtividade() { return nivelAtividade; }
    public void setNivelAtividade(NivelAtividade nivelAtividade) { this.nivelAtividade = nivelAtividade; }
    public ObjetivoNutricional getObjetivo() { return objetivo; }
    public void setObjetivo(ObjetivoNutricional objetivo) { this.objetivo = objetivo; }
    public String getRestricoesJson() { return restricoesJson; }
    public void setRestricoesJson(String restricoesJson) { this.restricoesJson = restricoesJson; }
    public String getAlergiasJson() { return alergiasJson; }
    public void setAlergiasJson(String alergiasJson) { this.alergiasJson = alergiasJson; }
    public Integer getTmbKcal() { return tmbKcal; }
    public void setTmbKcal(Integer tmbKcal) { this.tmbKcal = tmbKcal; }
    public Integer getGetKcal() { return getKcal; }
    public void setGetKcal(Integer getKcal) { this.getKcal = getKcal; }
    public Integer getMetaKcal() { return metaKcal; }
    public void setMetaKcal(Integer metaKcal) { this.metaKcal = metaKcal; }
    public Integer getMetaProteinaG() { return metaProteinaG; }
    public void setMetaProteinaG(Integer metaProteinaG) { this.metaProteinaG = metaProteinaG; }
    public Integer getMetaCarboG() { return metaCarboG; }
    public void setMetaCarboG(Integer metaCarboG) { this.metaCarboG = metaCarboG; }
    public Integer getMetaGorduraG() { return metaGorduraG; }
    public void setMetaGorduraG(Integer metaGorduraG) { this.metaGorduraG = metaGorduraG; }
    public BigDecimal getMetaAguaLitros() { return metaAguaLitros; }
    public void setMetaAguaLitros(BigDecimal metaAguaLitros) { this.metaAguaLitros = metaAguaLitros; }
    public boolean isMetasDefinidasNutri() { return metasDefinidasNutri; }
    public void setMetasDefinidasNutri(boolean metasDefinidasNutri) { this.metasDefinidasNutri = metasDefinidasNutri; }
    public String getObservacoesClinicas() { return observacoesClinicas; }
    public void setObservacoesClinicas(String observacoesClinicas) { this.observacoesClinicas = observacoesClinicas; }
    public boolean isOnboardingConcluido() { return onboardingConcluido; }
    public void setOnboardingConcluido(boolean onboardingConcluido) { this.onboardingConcluido = onboardingConcluido; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
