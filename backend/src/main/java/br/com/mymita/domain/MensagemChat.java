package br.com.mymita.domain;

import br.com.mymita.domain.enums.RemetenteChat;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagem_chat")
public class MensagemChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensagem")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "remetente_tipo", nullable = false, length = 20)
    private RemetenteChat remetenteTipo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marmita_sugerida_id")
    private Marmita marmitaSugerida;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }
    public RemetenteChat getRemetenteTipo() { return remetenteTipo; }
    public void setRemetenteTipo(RemetenteChat remetenteTipo) { this.remetenteTipo = remetenteTipo; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    public Marmita getMarmitaSugerida() { return marmitaSugerida; }
    public void setMarmitaSugerida(Marmita marmitaSugerida) { this.marmitaSugerida = marmitaSugerida; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
