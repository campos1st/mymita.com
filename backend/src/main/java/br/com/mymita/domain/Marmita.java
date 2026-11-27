package br.com.mymita.domain;

import br.com.mymita.domain.enums.CategoriaMarmita;
import br.com.mymita.domain.enums.TipoRefeicao;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "marmita")
public class Marmita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_marmita")
    private Long id;

    @Column(nullable = false, length = 140)
    private String nome;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "imagem_url", nullable = false, length = 500)
    private String imagemUrl;

    @Column(name = "alt_text", nullable = false, length = 255)
    private String altText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaMarmita categoria;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_sugerido", length = 30)
    private TipoRefeicao tipoSugerido = TipoRefeicao.ALMOCO;

    @Column(name = "peso_gramas", nullable = false)
    private Integer pesoGramas = 350;

    @Column(name = "tempo_preparo_min", nullable = false)
    private Integer tempoPreparoMin = 5;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String ingredientes;

    @Column(name = "alergenos_json", nullable = false, columnDefinition = "TEXT")
    private String alergenosJson = "[]";

    @Column(nullable = false)
    private Integer kcal;

    @Column(name = "proteina_g", nullable = false)
    private Integer proteinaG;

    @Column(name = "carbo_g", nullable = false)
    private Integer carboG;

    @Column(name = "gordura_g", nullable = false)
    private Integer gorduraG;

    @Column(name = "fibra_g", nullable = false)
    private Integer fibraG = 5;

    @Column(name = "preco_avulso", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoAvulso;

    @Column(nullable = false)
    private boolean disponivel = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getAltText() { return altText; }
    public void setAltText(String altText) { this.altText = altText; }
    public CategoriaMarmita getCategoria() { return categoria; }
    public void setCategoria(CategoriaMarmita categoria) { this.categoria = categoria; }
    public TipoRefeicao getTipoSugerido() { return tipoSugerido; }
    public void setTipoSugerido(TipoRefeicao tipoSugerido) { this.tipoSugerido = tipoSugerido; }
    public Integer getPesoGramas() { return pesoGramas; }
    public void setPesoGramas(Integer pesoGramas) { this.pesoGramas = pesoGramas; }
    public Integer getTempoPreparoMin() { return tempoPreparoMin; }
    public void setTempoPreparoMin(Integer tempoPreparoMin) { this.tempoPreparoMin = tempoPreparoMin; }
    public String getIngredientes() { return ingredientes; }
    public void setIngredientes(String ingredientes) { this.ingredientes = ingredientes; }
    public String getAlergenosJson() { return alergenosJson; }
    public void setAlergenosJson(String alergenosJson) { this.alergenosJson = alergenosJson; }
    public Integer getKcal() { return kcal; }
    public void setKcal(Integer kcal) { this.kcal = kcal; }
    public Integer getProteinaG() { return proteinaG; }
    public void setProteinaG(Integer proteinaG) { this.proteinaG = proteinaG; }
    public Integer getCarboG() { return carboG; }
    public void setCarboG(Integer carboG) { this.carboG = carboG; }
    public Integer getGorduraG() { return gorduraG; }
    public void setGorduraG(Integer gorduraG) { this.gorduraG = gorduraG; }
    public Integer getFibraG() { return fibraG; }
    public void setFibraG(Integer fibraG) { this.fibraG = fibraG; }
    public BigDecimal getPrecoAvulso() { return precoAvulso; }
    public void setPrecoAvulso(BigDecimal precoAvulso) { this.precoAvulso = precoAvulso; }
    public boolean isDisponivel() { return disponivel; }
    public void setDisponivel(boolean disponivel) { this.disponivel = disponivel; }
}
