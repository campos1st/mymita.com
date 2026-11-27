package br.com.mymita.domain;

import br.com.mymita.domain.enums.FrequenciaPlano;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "plano")
public class Plano {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plano")
    private Long id;

    @Column(name = "nome_plano", nullable = false, length = 120)
    private String nomePlano;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FrequenciaPlano frequencia;

    @Column(name = "qtd_marmitas", nullable = false)
    private Integer qtdMarmitas;

    @Column(name = "inclui_consulta_nutri", nullable = false)
    private boolean incluiConsultaNutri = false;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false)
    private boolean destaque = false;

    @Column(nullable = false)
    private boolean ativo = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNomePlano() { return nomePlano; }
    public void setNomePlano(String nomePlano) { this.nomePlano = nomePlano; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public FrequenciaPlano getFrequencia() { return frequencia; }
    public void setFrequencia(FrequenciaPlano frequencia) { this.frequencia = frequencia; }
    public Integer getQtdMarmitas() { return qtdMarmitas; }
    public void setQtdMarmitas(Integer qtdMarmitas) { this.qtdMarmitas = qtdMarmitas; }
    public boolean isIncluiConsultaNutri() { return incluiConsultaNutri; }
    public void setIncluiConsultaNutri(boolean incluiConsultaNutri) { this.incluiConsultaNutri = incluiConsultaNutri; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public boolean isDestaque() { return destaque; }
    public void setDestaque(boolean destaque) { this.destaque = destaque; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
