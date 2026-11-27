package br.com.mymita.domain.enums;

public enum TipoRefeicao {
    CAFE_MANHA("Café da manhã", "07:00"),
    LANCHE_MANHA("Lanche da manhã", "10:00"),
    ALMOCO("Almoço", "12:30"),
    LANCHE_TARDE("Lanche da tarde", "16:00"),
    JANTAR("Jantar", "19:30");

    private final String label;
    private final String horarioPadrao;

    TipoRefeicao(String label, String horarioPadrao) {
        this.label = label;
        this.horarioPadrao = horarioPadrao;
    }

    public String getLabel() {
        return label;
    }

    public String getHorarioPadrao() {
        return horarioPadrao;
    }
}
