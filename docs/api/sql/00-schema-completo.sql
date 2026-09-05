CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE IF NOT EXISTS categorias (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(60)  NOT NULL,
    tipo          VARCHAR(10)  NOT NULL,
    token_cor     SMALLINT     NOT NULL,

    data_criacao     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT categorias_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT categorias_tipo_check
        CHECK (tipo IN ('RECEITA', 'DESPESA')),

    CONSTRAINT categorias_token_cor_check
        CHECK (token_cor BETWEEN 1 AND 6),

    CONSTRAINT categorias_nome_tipo_unico
        UNIQUE (nome, tipo)
);

CREATE INDEX IF NOT EXISTS categorias_tipo_idx ON categorias (tipo);


CREATE TABLE IF NOT EXISTS contas (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(80)    NOT NULL,
    instituicao      VARCHAR(80)    NOT NULL,
    tipo             VARCHAR(16)    NOT NULL,
    saldo            NUMERIC(14,2)  NOT NULL DEFAULT 0,
    situacao         VARCHAR(10)    NOT NULL DEFAULT 'ATIVO',
    incluir_no_total BOOLEAN        NOT NULL DEFAULT TRUE,

    data_criacao        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao    TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT contas_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT contas_instituicao_tamanho_minimo
        CHECK (char_length(trim(instituicao)) >= 2),

    CONSTRAINT contas_tipo_check
        CHECK (tipo IN ('CORRENTE', 'SALARIO', 'EMERGENCIA', 'OUTRA')),

    CONSTRAINT contas_situacao_check
        CHECK (situacao IN ('ATIVO', 'INATIVO')),

    CONSTRAINT contas_nome_instituicao_unico
        UNIQUE (nome, instituicao)
);

CREATE INDEX IF NOT EXISTS contas_total_idx ON contas (situacao, incluir_no_total);


CREATE TABLE IF NOT EXISTS cartoes (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            VARCHAR(80)    NOT NULL,
    instituicao     VARCHAR(80)    NOT NULL,
    tipo            VARCHAR(16)    NOT NULL,
    situacao        VARCHAR(10)    NOT NULL DEFAULT 'ATIVO',

    bandeira        VARCHAR(40),
    ultimos_digitos VARCHAR(4),

    limite_credito  NUMERIC(14,2),
    dia_fechamento  SMALLINT,
    dia_vencimento  SMALLINT,

    id_conta        UUID,

    saldo           NUMERIC(14,2),

    data_criacao       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao   TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT cartoes_conta_fk
        FOREIGN KEY (id_conta) REFERENCES contas (id) ON DELETE RESTRICT,

    CONSTRAINT cartoes_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT cartoes_instituicao_tamanho_minimo
        CHECK (char_length(trim(instituicao)) >= 2),

    CONSTRAINT cartoes_tipo_check
        CHECK (tipo IN ('CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO')),

    CONSTRAINT cartoes_situacao_check
        CHECK (situacao IN ('ATIVO', 'INATIVO')),

    CONSTRAINT cartoes_ultimos_digitos_check
        CHECK (ultimos_digitos IS NULL OR ultimos_digitos ~ '^[0-9]{4}$'),

    CONSTRAINT cartoes_dia_fechamento_check
        CHECK (dia_fechamento IS NULL OR dia_fechamento BETWEEN 1 AND 31),

    CONSTRAINT cartoes_dia_vencimento_check
        CHECK (dia_vencimento IS NULL OR dia_vencimento BETWEEN 1 AND 31),

    CONSTRAINT cartoes_campos_por_tipo_check CHECK (
        CASE tipo
            WHEN 'CREDITO' THEN
                limite_credito IS NOT NULL AND limite_credito > 0
                AND dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL
                AND id_conta IS NULL AND saldo IS NULL
            WHEN 'DEBITO' THEN
                id_conta IS NOT NULL
                AND limite_credito IS NULL AND dia_fechamento IS NULL
                AND dia_vencimento IS NULL AND saldo IS NULL
            ELSE
                saldo IS NOT NULL
                AND limite_credito IS NULL AND dia_fechamento IS NULL
                AND dia_vencimento IS NULL AND id_conta IS NULL
        END
    )
);

CREATE INDEX IF NOT EXISTS cartoes_tipo_situacao_idx ON cartoes (tipo, situacao);
CREATE INDEX IF NOT EXISTS cartoes_conta_idx         ON cartoes (id_conta);


CREATE TABLE IF NOT EXISTS lancamentos (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao        VARCHAR(160)   NOT NULL,
    valor            NUMERIC(14,2)  NOT NULL,
    tipo             VARCHAR(14)    NOT NULL,
    situacao         VARCHAR(10)    NOT NULL,
    forma            VARCHAR(14)    NOT NULL,
    data             DATE           NOT NULL,

    id_categoria     UUID,
    id_conta         UUID,
    id_cartao        UUID,
    id_conta_destino UUID,

    observacoes      TEXT,

    data_criacao        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao    TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT lancamentos_categoria_fk
        FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE RESTRICT,
    CONSTRAINT lancamentos_conta_fk
        FOREIGN KEY (id_conta) REFERENCES contas (id) ON DELETE RESTRICT,
    CONSTRAINT lancamentos_cartao_fk
        FOREIGN KEY (id_cartao) REFERENCES cartoes (id) ON DELETE RESTRICT,
    CONSTRAINT lancamentos_conta_destino_fk
        FOREIGN KEY (id_conta_destino) REFERENCES contas (id) ON DELETE RESTRICT,

    CONSTRAINT lancamentos_descricao_tamanho_minimo
        CHECK (char_length(trim(descricao)) >= 2),

    CONSTRAINT lancamentos_valor_positivo
        CHECK (valor > 0),

    CONSTRAINT lancamentos_tipo_check
        CHECK (tipo IN ('RECEITA', 'DESPESA', 'TRANSFERENCIA')),

    CONSTRAINT lancamentos_situacao_check
        CHECK (situacao IN ('PAGO', 'PENDENTE', 'AGENDADO')),

    CONSTRAINT lancamentos_forma_check
        CHECK (forma IN ('CONTA', 'CARTAO_CREDITO', 'PIX', 'DINHEIRO')),

    CONSTRAINT lancamentos_origem_unica_check
        CHECK (num_nonnulls(id_conta, id_cartao) = 1),

    CONSTRAINT lancamentos_transferencia_check CHECK (
        CASE WHEN tipo = 'TRANSFERENCIA' THEN
            id_categoria IS NULL
            AND id_cartao IS NULL
            AND id_conta IS NOT NULL
            AND id_conta_destino IS NOT NULL
            AND id_conta_destino <> id_conta
        ELSE
            id_categoria IS NOT NULL
            AND id_conta_destino IS NULL
        END
    )
);

CREATE INDEX IF NOT EXISTS lancamentos_data_idx
    ON lancamentos (data DESC);

CREATE INDEX IF NOT EXISTS lancamentos_tipo_data_idx
    ON lancamentos (tipo, data DESC);

CREATE INDEX IF NOT EXISTS lancamentos_categoria_data_idx
    ON lancamentos (id_categoria, data DESC)
    WHERE id_categoria IS NOT NULL;

CREATE INDEX IF NOT EXISTS lancamentos_conta_data_idx
    ON lancamentos (id_conta, data DESC)
    WHERE id_conta IS NOT NULL;

CREATE INDEX IF NOT EXISTS lancamentos_cartao_data_idx
    ON lancamentos (id_cartao, data DESC)
    WHERE id_cartao IS NOT NULL;

CREATE INDEX IF NOT EXISTS lancamentos_conta_destino_data_idx
    ON lancamentos (id_conta_destino, data DESC)
    WHERE id_conta_destino IS NOT NULL;


CREATE TABLE IF NOT EXISTS compras_parceladas (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao     VARCHAR(160)   NOT NULL,
    valor_total   NUMERIC(14,2)  NOT NULL,
    parcelas      SMALLINT       NOT NULL,
    data_compra   DATE           NOT NULL,
    primeiro_mes  DATE           NOT NULL,

    id_cartao     UUID           NOT NULL,
    id_categoria  UUID,
    observacoes   TEXT,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT compras_parceladas_cartao_fk
        FOREIGN KEY (id_cartao) REFERENCES cartoes (id) ON DELETE RESTRICT,
    CONSTRAINT compras_parceladas_categoria_fk
        FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE RESTRICT,

    CONSTRAINT compras_parceladas_descricao_tamanho_minimo
        CHECK (char_length(trim(descricao)) >= 2),

    CONSTRAINT compras_parceladas_valor_total_positivo
        CHECK (valor_total > 0),

    CONSTRAINT compras_parceladas_parcelas_check
        CHECK (parcelas BETWEEN 2 AND 48),

    CONSTRAINT compras_parceladas_primeiro_mes_check
        CHECK (date_trunc('month', primeiro_mes) = primeiro_mes)
);

CREATE INDEX IF NOT EXISTS compras_parceladas_cartao_mes_idx
    ON compras_parceladas (id_cartao, primeiro_mes);

CREATE INDEX IF NOT EXISTS compras_parceladas_categoria_idx
    ON compras_parceladas (id_categoria);


CREATE TABLE IF NOT EXISTS investimentos (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(120)   NOT NULL,
    classe_ativo  VARCHAR(16)    NOT NULL,
    instituicao   VARCHAR(80)    NOT NULL,
    aportado      NUMERIC(14,2)  NOT NULL,
    valor_atual   NUMERIC(14,2)  NOT NULL,
    data_inicio   DATE           NOT NULL,
    observacoes   TEXT,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT investimentos_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT investimentos_instituicao_tamanho_minimo
        CHECK (char_length(trim(instituicao)) >= 2),

    CONSTRAINT investimentos_classe_ativo_check
        CHECK (classe_ativo IN (
            'RENDA_FIXA', 'CDB', 'TESOURO', 'ACOES',
            'ETF', 'FUNDOS', 'CRIPTO', 'OUTROS'
        )),

    CONSTRAINT investimentos_aportado_positivo
        CHECK (aportado > 0),

    CONSTRAINT investimentos_valor_atual_check
        CHECK (valor_atual >= 0),

    CONSTRAINT investimentos_data_inicio_nao_futura
        CHECK (data_inicio <= CURRENT_DATE)
);

CREATE INDEX IF NOT EXISTS investimentos_classe_ativo_idx ON investimentos (classe_ativo);
CREATE INDEX IF NOT EXISTS investimentos_data_inicio_idx  ON investimentos (data_inicio);


CREATE TABLE IF NOT EXISTS orcamentos (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    id_categoria  UUID           NOT NULL,
    limite_mensal NUMERIC(14,2)  NOT NULL,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT orcamentos_categoria_fk
        FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE RESTRICT,

    CONSTRAINT orcamentos_limite_mensal_positivo
        CHECK (limite_mensal > 0),

    CONSTRAINT orcamentos_categoria_unico
        UNIQUE (id_categoria)
);


CREATE TABLE IF NOT EXISTS despesas_recorrentes (
    id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao          VARCHAR(160)   NOT NULL,
    valor              NUMERIC(14,2)  NOT NULL,
    frequencia         VARCHAR(12)    NOT NULL,
    proximo_vencimento DATE           NOT NULL,
    situacao           VARCHAR(10)    NOT NULL DEFAULT 'ATIVO',

    id_categoria       UUID,
    id_conta           UUID,
    id_cartao          UUID,

    observacoes        TEXT,

    data_criacao          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao      TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT despesas_recorrentes_categoria_fk
        FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE RESTRICT,
    CONSTRAINT despesas_recorrentes_conta_fk
        FOREIGN KEY (id_conta) REFERENCES contas (id) ON DELETE RESTRICT,
    CONSTRAINT despesas_recorrentes_cartao_fk
        FOREIGN KEY (id_cartao) REFERENCES cartoes (id) ON DELETE RESTRICT,

    CONSTRAINT despesas_recorrentes_descricao_tamanho_minimo
        CHECK (char_length(trim(descricao)) >= 2),

    CONSTRAINT despesas_recorrentes_valor_positivo
        CHECK (valor > 0),

    CONSTRAINT despesas_recorrentes_frequencia_check
        CHECK (frequencia IN (
            'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL',
            'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'
        )),

    CONSTRAINT despesas_recorrentes_situacao_check
        CHECK (situacao IN ('ATIVO', 'PAUSADO')),

    CONSTRAINT despesas_recorrentes_origem_unica_check
        CHECK (num_nonnulls(id_conta, id_cartao) = 1)
);

CREATE INDEX IF NOT EXISTS despesas_recorrentes_situacao_vencimento_idx
    ON despesas_recorrentes (situacao, proximo_vencimento);

CREATE INDEX IF NOT EXISTS despesas_recorrentes_categoria_idx
    ON despesas_recorrentes (id_categoria);

CREATE INDEX IF NOT EXISTS despesas_recorrentes_conta_idx
    ON despesas_recorrentes (id_conta);

CREATE INDEX IF NOT EXISTS despesas_recorrentes_cartao_idx
    ON despesas_recorrentes (id_cartao);


CREATE TABLE IF NOT EXISTS metas (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(120)  NOT NULL,
    url           VARCHAR(2048),
    url_imagem    VARCHAR(2048),
    situacao      VARCHAR(12)   NOT NULL DEFAULT 'ACOMPANHANDO',
    observacoes   TEXT,

    data_criacao     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT metas_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT metas_situacao_check
        CHECK (situacao IN ('ACOMPANHANDO', 'COMPRADA', 'CANCELADA')),

    CONSTRAINT metas_url_check
        CHECK (url IS NULL OR url ~* '^https?://'),

    CONSTRAINT metas_url_imagem_check
        CHECK (url_imagem IS NULL OR url_imagem ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS metas_situacao_idx ON metas (situacao);


CREATE TABLE IF NOT EXISTS metas_precos (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    id_meta    UUID           NOT NULL,
    data       DATE           NOT NULL,
    preco      NUMERIC(14,2)  NOT NULL,
    observacao TEXT,

    data_criacao  TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT metas_precos_meta_fk
        FOREIGN KEY (id_meta) REFERENCES metas (id) ON DELETE CASCADE,

    CONSTRAINT metas_precos_preco_positivo
        CHECK (preco > 0),

    CONSTRAINT metas_precos_data_nao_futura
        CHECK (data <= CURRENT_DATE),

    CONSTRAINT metas_precos_sem_duplicata
        UNIQUE (id_meta, data, preco)
);

CREATE INDEX IF NOT EXISTS metas_precos_meta_data_idx
    ON metas_precos (id_meta, data);
