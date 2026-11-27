package br.com.mymita.domain;

import br.com.mymita.domain.enums.DiaSemana;
import br.com.mymita.domain.enums.TipoRefeicao;
import jakarta.persistence.*;

@Entity
@Table(name = "cardapio_item")
public class CardapioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cardapio", nullable = false)
    private CardapioPlanejado cardapio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_marmita", nullable = false)
    private Marmita marmita;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana", nullable = false, length = 10)
    private DiaSemana diaSemana;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_refeicao", nullable = false, length = 25)
    private TipoRefeicao tipoRefeicao;

    @Column(name = "horario_sugerido", nullable = false, length = 10)
    private String horarioSugerido = "12:30";

    @Column(nullable = false)
    private boolean consumido = false;

    @Column(name = "travado_nutri", nullable = false)
    private boolean travadoNutri = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CardapioPlanejado getCardapio() { return cardapio; }
    public void setCardapio(CardapioPlanejado cardapio) { this.cardapio = cardapio; }
    public Marmita getMarmita() { return marmita; }
    public void setMarmita(Marmita marmita) { this.marmita = marmita; }
    public DiaSemana getDiaSemana() { return diaSemana; }
    public void setDiaSemana(DiaSemana diaSemana) { this.diaSemana = diaSemana; }
    public TipoRefeicao getTipoRefeicao() { return tipoRefeicao; }
    public void setTipoRefeicao(TipoRefeicao tipoRefeicao) { this.tipoRefeicao = tipoRefeicao; }
    public String getHorarioSugerido() { return horarioSugerido; }
    public void setHorarioSugerido(String horarioSugerido) { this.horarioSugerido = horarioSugerido; }
    public boolean isConsumido() { return consumido; }
    public void setConsumido(boolean consumido) { this.consumido = consumido; }
    public boolean isTravadoNutri() { return travadoNutri; }
    public void setTravadoNutri(boolean travadoNutri) { this.travadoNutri = travadoNutri; }
}
