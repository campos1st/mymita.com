package br.com.mymita.domain.enums;

public enum NivelAtividade {
    SEDENTARIO(1.2),
    LEVE(1.375),
    MODERADO(1.55),
    INTENSO(1.725),
    ATLETA(1.9);

    private final double fator;

    NivelAtividade(double fator) {
        this.fator = fator;
    }

    public double getFator() {
        return fator;
    }
}
