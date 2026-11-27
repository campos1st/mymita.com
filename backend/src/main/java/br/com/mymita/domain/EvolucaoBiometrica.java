package br.com.mymita.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "evolucao_biometrica")
public class EvolucaoBiometrica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evolucao")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @Column(name = "data_registro", nullable = false)
    private LocalDate dataRegistro = LocalDate.now();

    @Column(name = "peso_kg", nullable = false, precision = 5, scale = 2)
    private BigDecimal pesoKg;

    @Column(name = "percentual_gordura", precision = 4, scale = 1)
    private BigDecimal percentualGordura;

    @Column(name = "agua_litros", precision = 4, scale = 2)
    private BigDecimal aguaLitros;

    @Column(name = "notas_paciente", columnDefinition = "TEXT")
    private String notasPaciente;

    @Column(name = "feedback_nutri", columnDefinition = "TEXT")
    private String feedbackNutri;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }
    public LocalDate getDataRegistro() { return dataRegistro; }
    public void setDataRegistro(LocalDate dataRegistro) { this.dataRegistro = dataRegistro; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal pesoKg) { this.pesoKg = pesoKg; }
    public BigDecimal getPercentualGordura() { return percentualGordura; }
    public void setPercentualGordura(BigDecimal percentualGordura) { this.percentualGordura = percentualGordura; }
    public BigDecimal getAguaLitros() { return aguaLitros; }
    public void setAguaLitros(BigDecimal aguaLitros) { this.aguaLitros = aguaLitros; }
    public String getNotasPaciente() { return notasPaciente; }
    public void setNotasPaciente(String notasPaciente) { this.notasPaciente = notasPaciente; }
    public String getFeedbackNutri() { return feedbackNutri; }
    public void setFeedbackNutri(String feedbackNutri) { this.feedbackNutri = feedbackNutri; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
