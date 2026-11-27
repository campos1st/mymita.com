package br.com.mymita.domain;

import br.com.mymita.domain.enums.StatusAprovacaoCardapio;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cardapio_planejado")
public class CardapioPlanejado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cardapio")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @Column(name = "semana_referencia", nullable = false)
    private LocalDate semanaReferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_aprovacao", nullable = false, length = 30)
    private StatusAprovacaoCardapio statusAprovacao = StatusAprovacaoCardapio.GERADO_IA;

    @Column(name = "orientacoes_nutri", columnDefinition = "TEXT")
    private String orientacoesNutri;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @OneToMany(mappedBy = "cardapio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CardapioItem> itens = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }
    public LocalDate getSemanaReferencia() { return semanaReferencia; }
    public void setSemanaReferencia(LocalDate semanaReferencia) { this.semanaReferencia = semanaReferencia; }
    public StatusAprovacaoCardapio getStatusAprovacao() { return statusAprovacao; }
    public void setStatusAprovacao(StatusAprovacaoCardapio statusAprovacao) { this.statusAprovacao = statusAprovacao; }
    public String getOrientacoesNutri() { return orientacoesNutri; }
    public void setOrientacoesNutri(String orientacoesNutri) { this.orientacoesNutri = orientacoesNutri; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
    public List<CardapioItem> getItens() { return itens; }
    public void setItens(List<CardapioItem> itens) { this.itens = itens; }
}
