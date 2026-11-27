package br.com.mymita.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "faixa_cep_cobertura")
public class FaixaCepCobertura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_faixa")
    private Long id;

    @Column(name = "cep_inicio", nullable = false, length = 8)
    private String cepInicio;

    @Column(name = "cep_fim", nullable = false, length = 8)
    private String cepFim;

    @Column(nullable = false, length = 120)
    private String regiao;

    @Column(name = "taxa_entrega", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaEntrega = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean ativo = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCepInicio() { return cepInicio; }
    public void setCepInicio(String cepInicio) { this.cepInicio = cepInicio; }
    public String getCepFim() { return cepFim; }
    public void setCepFim(String cepFim) { this.cepFim = cepFim; }
    public String getRegiao() { return regiao; }
    public void setRegiao(String regiao) { this.regiao = regiao; }
    public BigDecimal getTaxaEntrega() { return taxaEntrega; }
    public void setTaxaEntrega(BigDecimal taxaEntrega) { this.taxaEntrega = taxaEntrega; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
