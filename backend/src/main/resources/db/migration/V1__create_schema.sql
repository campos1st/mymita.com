-- MyMita — Schema Relacional Completo (PostgreSQL / H2 PostgreSQL Mode)

CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(30) NOT NULL,
    crn VARCHAR(30),
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
    data_consentimento_lgpd TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE perfil_nutricional (
    id_perfil BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_nutricionista BIGINT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    peso_kg NUMERIC(5,2),
    altura_cm INTEGER,
    idade INTEGER,
    sexo VARCHAR(20),
    nivel_atividade VARCHAR(30),
    objetivo VARCHAR(30),
    restricoes_json TEXT NOT NULL DEFAULT '[]',
    alergias_json TEXT NOT NULL DEFAULT '[]',
    tmb_kcal INTEGER,
    get_kcal INTEGER,
    meta_kcal INTEGER,
    meta_proteina_g INTEGER,
    meta_carbo_g INTEGER,
    meta_gordura_g INTEGER,
    meta_agua_litros NUMERIC(4,2) DEFAULT 2.50,
    metas_definidas_nutri BOOLEAN NOT NULL DEFAULT FALSE,
    observacoes_clinicas TEXT,
    onboarding_concluido BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evolucao_biometrica (
    id_evolucao BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    data_registro DATE NOT NULL,
    peso_kg NUMERIC(5,2) NOT NULL,
    percentual_gordura NUMERIC(4,1),
    agua_litros NUMERIC(4,2),
    notas_paciente TEXT,
    feedback_nutri TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE endereco (
    id_endereco BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    apelido VARCHAR(60),
    logradouro VARCHAR(180) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(120),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE faixa_cep_cobertura (
    id_faixa BIGSERIAL PRIMARY KEY,
    cep_inicio VARCHAR(8) NOT NULL,
    cep_fim VARCHAR(8) NOT NULL,
    regiao VARCHAR(120) NOT NULL,
    taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE plano (
    id_plano BIGSERIAL PRIMARY KEY,
    nome_plano VARCHAR(120) NOT NULL,
    descricao TEXT,
    frequencia VARCHAR(20) NOT NULL,
    qtd_marmitas INTEGER NOT NULL,
    inclui_consulta_nutri BOOLEAN NOT NULL DEFAULT FALSE,
    preco NUMERIC(10,2) NOT NULL,
    destaque BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE assinatura (
    id_assinatura BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_plano BIGINT NOT NULL REFERENCES plano(id_plano),
    gateway_subscription_id VARCHAR(120),
    data_inicio DATE NOT NULL,
    proxima_cobranca DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    dia_entrega_preferencial VARCHAR(20),
    janela_horario_preferencial VARCHAR(40),
    forma_pagamento VARCHAR(30),
    pausada_ate DATE
);

CREATE TABLE marmita (
    id_marmita BIGSERIAL PRIMARY KEY,
    nome VARCHAR(140) NOT NULL,
    descricao TEXT NOT NULL,
    imagem_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    tipo_sugerido VARCHAR(30) DEFAULT 'ALMOCO',
    peso_gramas INTEGER NOT NULL DEFAULT 350,
    tempo_preparo_min INTEGER NOT NULL DEFAULT 5,
    ingredientes TEXT NOT NULL,
    alergenos_json TEXT NOT NULL DEFAULT '[]',
    kcal INTEGER NOT NULL,
    proteina_g INTEGER NOT NULL,
    carbo_g INTEGER NOT NULL,
    gordura_g INTEGER NOT NULL,
    fibra_g INTEGER NOT NULL DEFAULT 5,
    preco_avulso NUMERIC(10,2) NOT NULL,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cardapio_planejado (
    id_cardapio BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    semana_referencia DATE NOT NULL,
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'GERADO_IA',
    orientacoes_nutri TEXT,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cardapio_item (
    id_item BIGSERIAL PRIMARY KEY,
    id_cardapio BIGINT NOT NULL REFERENCES cardapio_planejado(id_cardapio) ON DELETE CASCADE,
    id_marmita BIGINT NOT NULL REFERENCES marmita(id_marmita),
    dia_semana VARCHAR(10) NOT NULL,
    tipo_refeicao VARCHAR(25) NOT NULL,
    horario_sugerido VARCHAR(10) NOT NULL DEFAULT '12:30',
    consumido BOOLEAN NOT NULL DEFAULT FALSE,
    travado_nutri BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE pedido (
    id_pedido BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_assinatura BIGINT REFERENCES assinatura(id_assinatura) ON DELETE SET NULL,
    id_endereco BIGINT NOT NULL REFERENCES endereco(id_endereco),
    data_entrega DATE NOT NULL,
    janela_horario VARCHAR(40) NOT NULL,
    status_entrega VARCHAR(30) NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    gateway_payment_id VARCHAR(120),
    valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(10,2) NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedido_item (
    id_pedido_item BIGSERIAL PRIMARY KEY,
    id_pedido BIGINT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    id_marmita BIGINT NOT NULL REFERENCES marmita(id_marmita),
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL
);

CREATE TABLE mensagem_chat (
    id_mensagem BIGSERIAL PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    remetente_tipo VARCHAR(20) NOT NULL,
    conteudo TEXT NOT NULL,
    marmita_sugerida_id BIGINT REFERENCES marmita(id_marmita) ON DELETE SET NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perfil_nutricionista ON perfil_nutricional(id_nutricionista);
CREATE INDEX idx_evolucao_cliente ON evolucao_biometrica(id_cliente, data_registro);
CREATE INDEX idx_pedido_cliente ON pedido(id_cliente, data_entrega);
CREATE INDEX idx_pedido_status ON pedido(status_entrega, data_entrega);
CREATE INDEX idx_chat_cliente ON mensagem_chat(id_cliente, timestamp);
