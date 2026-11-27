package br.com.mymita.domain;

import br.com.mymita.domain.enums.StatusAssinatura;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "assinatura")
public class Assinatura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_assinatura")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_plano", nullable = false)
    private Plano plano;

    @Column(name = "gateway_subscription_id", length = 120)
    private String gatewaySubscriptionId;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio = LocalDate.now();

    @Column(name = "proxima_cobranca", nullable = false)
    private LocalDate proximaCobranca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAssinatura status = StatusAssinatura.ATIVA;

    @Column(name = "dia_entrega_preferencial", length = 20)
    private String diaEntregaPreferencial;

    @Column(name = "janela_horario_preferencial", length = 40)
    private String janelaHorarioPreferencial;

    @Column(name = "forma_pagamento", length = 30)
    private String formaPagamento;

    @Column(name = "pausada_ate")
    private LocalDate pausadaAte;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }
    public Plano getPlano() { return plano; }
    public void setPlano(Plano plano) { this.plano = plano; }
    public String getGatewaySubscriptionId() { return gatewaySubscriptionId; }
    public void setGatewaySubscriptionId(String gatewaySubscriptionId) { this.gatewaySubscriptionId = gatewaySubscriptionId; }
    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getProximaCobranca() { return proximaCobranca; }
    public void setProximaCobranca(LocalDate proximaCobranca) { this.proximaCobranca = proximaCobranca; }
    public StatusAssinatura getStatus() { return status; }
    public void setStatus(StatusAssinatura status) { this.status = status; }
    public String getDiaEntregaPreferencial() { return diaEntregaPreferencial; }
    public void setDiaEntregaPreferencial(String diaEntregaPreferencial) { this.diaEntregaPreferencial = diaEntregaPreferencial; }
    public String getJanelaHorarioPreferencial() { return janelaHorarioPreferencial; }
    public void setJanelaHorarioPreferencial(String janelaHorarioPreferencial) { this.janelaHorarioPreferencial = janelaHorarioPreferencial; }
    public String getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(String formaPagamento) { this.formaPagamento = formaPagamento; }
    public LocalDate getPausadaAte() { return pausadaAte; }
    public void setPausadaAte(LocalDate pausadaAte) { this.pausadaAte = pausadaAte; }
}
