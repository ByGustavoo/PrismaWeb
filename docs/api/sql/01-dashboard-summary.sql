-- =============================================================================
-- Prisma · Endpoint 01 de 42 — GET /dashboard/summary
-- Esquema PostgreSQL (13+) das tabelas necessárias para implementá-lo.
--
-- As seis tabelas abaixo são o que o resumo do dashboard precisa ler. Elas não
-- são exclusivas dele: `categorias`, `contas`, `cartoes`, `lancamentos`,
-- `compras_parceladas` e `investimentos` sustentam também os endpoints de
-- lançamentos, contas, cartões, faturas, parcelas e investimentos. O que este
-- arquivo delimita é o mínimo para o endpoint 01 responder corretamente.
--
-- Referência: API_CONTRACT.md (seção Dashboard) e docs/api/01-dashboard-summary.pdf
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Convenções adotadas
--
--   Idioma          Tabela, coluna, constraint e índice em português, sem
--                   acento — o acento fica no texto que uma pessoa lê, não no
--                   identificador que o código referencia.
--
--   Identificador   UUID gerado pelo banco. O contrato trata id como string e o
--                   frontend nunca faz aritmética com ele. O UUID resolve um
--                   problema concreto: `accountId` da API aponta ora para uma
--                   conta, ora para um cartão, e a resposta traz um campo só.
--                   Com UUID os dois espaços de id não colidem, e não é preciso
--                   prefixar nada.
--
--   Chave           `id` na própria tabela; `id_conta`, `id_cartao`,
--                   `id_categoria` nas estrangeiras — o prefixo `id_` antes do
--                   nome da tabela apontada, nunca o sufixo `_id`.
--
--   Dinheiro        NUMERIC(14,2). Nunca FLOAT ou DOUBLE: 0.1 + 0.2 em ponto
--                   flutuante não fecha caixa. Sempre positivo — a direção do
--                   dinheiro vem de `tipo`, nunca do sinal.
--
--   Data            DATE, com o nome começando em `data_`. O contrato trata
--                   data como dia civil, sem hora e sem fuso; TIMESTAMP faria
--                   "03/09" virar "02/09" para quem estivesse a oeste do
--                   servidor.
--
--   Enum            VARCHAR + CHECK, e não CREATE TYPE. Os valores viajam em
--                   MAIÚSCULA, sem acento e com sublinhado no lugar do hífen
--                   (`CARTAO_CREDITO`, `VALE_ALIMENTACAO`): são nomes válidos
--                   de constante de enum em Java, então a mesma string
--                   atravessa banco, backend e tela sem nenhum conversor no
--                   meio. O CHECK, em vez de um tipo nativo, evita que cada
--                   valor novo vire um ALTER TYPE dentro de migração, sem nada
--                   em troca aqui.
--
--   Auditoria       data_criacao/data_atualizacao existem para operação, não
--                   para o contrato: nenhum deles é devolvido pela API.
-- -----------------------------------------------------------------------------


-- =============================================================================
-- 1. categorias
-- Alimenta `spendingByCategory` e a categoria de cada `recentTransactions`.
-- =============================================================================

CREATE TABLE categorias (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(60)  NOT NULL,
    tipo             VARCHAR(10)  NOT NULL,
    token_cor        SMALLINT     NOT NULL,

    data_criacao     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT categorias_tipo_check
        CHECK (tipo IN ('RECEITA', 'DESPESA')),

    -- Índice do token de cor de gráfico (--chart-1 a --chart-6). É atributo da
    -- categoria, e não da posição dela num ranking: se saísse da ordem, a mesma
    -- categoria mudaria de cor entre uma carga e outra.
    CONSTRAINT categorias_token_cor_check
        CHECK (token_cor BETWEEN 1 AND 6),

    -- Receita e despesa não compartilham categoria, então "Outros" pode existir
    -- dos dois lados; o nome só precisa ser único dentro do próprio lado.
    CONSTRAINT categorias_nome_tipo_unico
        UNIQUE (nome, tipo)
);


-- =============================================================================
-- 2. contas
-- Alimenta `currentBalance` e `balanceHistory`.
-- =============================================================================

CREATE TABLE contas (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(80)    NOT NULL,
    instituicao      VARCHAR(80)    NOT NULL,
    tipo             VARCHAR(16)    NOT NULL,
    saldo            NUMERIC(14,2)  NOT NULL DEFAULT 0,
    situacao         VARCHAR(10)    NOT NULL DEFAULT 'ATIVO',

    -- Fora do total ficam as contas que não são dinheiro disponível, como a
    -- corretora. `currentBalance` do dashboard soma apenas as que entram.
    incluir_no_total BOOLEAN        NOT NULL DEFAULT TRUE,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT contas_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT contas_tipo_check
        CHECK (tipo IN ('CORRENTE', 'SALARIO', 'EMERGENCIA', 'OUTRA')),

    -- Conta inativa sai do saldo total e dos seletores, mas continua no
    -- histórico: é a alternativa à exclusão para quem encerrou uma conta.
    CONSTRAINT contas_situacao_check
        CHECK (situacao IN ('ATIVO', 'INATIVO')),

    CONSTRAINT contas_nome_instituicao_unico
        UNIQUE (nome, instituicao)
);

-- Saldo negativo é aceito de propósito: conta no vermelho existe.

CREATE INDEX contas_total_idx
    ON contas (situacao, incluir_no_total);


-- =============================================================================
-- 3. cartoes
-- Alimenta `currentInvoice`.
--
-- Um cadastro só para os quatro tipos. Os campos específicos são anuláveis
-- porque nenhum tipo usa todos: crédito tem limite e datas de fatura, débito
-- aponta para a conta que acessa e os vales carregam saldo próprio.
-- =============================================================================

CREATE TABLE cartoes (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(80)    NOT NULL,
    instituicao      VARCHAR(80)    NOT NULL,
    tipo             VARCHAR(16)    NOT NULL,
    situacao         VARCHAR(10)    NOT NULL DEFAULT 'ATIVO',

    bandeira         VARCHAR(40),
    -- VARCHAR, e nao CHAR(4): CHAR completa com espaco a direita, e um
    -- "123" gravado por engano volta como "123 " para o JPA.
    ultimos_digitos  VARCHAR(4),

    -- Crédito
    limite_credito   NUMERIC(14,2),
    dia_fechamento   SMALLINT,
    dia_vencimento   SMALLINT,

    -- Débito: a conta de onde o dinheiro sai.
    id_conta         UUID,

    -- Vale-alimentação e vale-refeição: saldo carregado no cartão.
    saldo            NUMERIC(14,2),

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT cartoes_conta_fk
        FOREIGN KEY (id_conta) REFERENCES contas (id) ON DELETE RESTRICT,

    CONSTRAINT cartoes_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

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

    -- Cada tipo carrega exatamente os seus campos e nenhum dos outros. É o que
    -- garante que trocar um cartão de crédito para vale-refeição não deixe
    -- limite e datas de fatura para trás — a API devolve NULL, e não zero, para
    -- o que não se aplica, porque a tela leria zero como limite de R$ 0,00.
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
            ELSE -- VALE_ALIMENTACAO, VALE_REFEICAO
                saldo IS NOT NULL
                AND limite_credito IS NULL AND dia_fechamento IS NULL
                AND dia_vencimento IS NULL AND id_conta IS NULL
        END
    )
);

-- O contrato chama esse campo de `limit`, que é palavra reservada em SQL; aqui
-- ele é `limite_credito`. Mapeie a coluna explicitamente na entidade JPA
-- (@Column(name = "limite_credito")) para o campo continuar se chamando `limit`
-- na resposta.

CREATE INDEX cartoes_tipo_situacao_idx ON cartoes (tipo, situacao);
CREATE INDEX cartoes_conta_idx         ON cartoes (id_conta);


-- =============================================================================
-- 4. lancamentos
-- A tabela central do endpoint: `monthIncome`, `monthExpense`, `cashflow`,
-- `dailySpending`, `spendingByCategory`, `recentTransactions` e a reconstrução
-- de `currentBalance` e `balanceHistory` saem toda daqui.
-- =============================================================================

CREATE TABLE lancamentos (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao        VARCHAR(160)   NOT NULL,

    -- Sempre positivo; a direção vem de `tipo`.
    valor            NUMERIC(14,2)  NOT NULL,

    tipo             VARCHAR(14)    NOT NULL,
    situacao         VARCHAR(10)    NOT NULL,
    forma            VARCHAR(14)    NOT NULL,
    data             DATE           NOT NULL,

    -- Transferência não tem categoria: o dinheiro só troca de conta.
    id_categoria     UUID,

    -- Origem do dinheiro. A API expõe um campo só (`accountId`), mas no banco
    -- são duas colunas com chave estrangeira de verdade, e não um par
    -- (tipo, id) sem integridade referencial. A resposta emite
    -- COALESCE(id_conta, id_cartao) — seguro porque os dois são UUID.
    id_conta         UUID,
    id_cartao        UUID,

    -- Destino, só em transferência. É sempre uma conta: o formulário não
    -- oferece cartão nem na origem nem no destino de uma transferência, porque
    -- cartão não é conta própria.
    id_conta_destino UUID,

    observacoes      TEXT,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

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

    -- Exatamente uma origem: ou conta, ou cartão, nunca as duas nem nenhuma.
    CONSTRAINT lancamentos_origem_unica_check
        CHECK (num_nonnulls(id_conta, id_cartao) = 1),

    -- As três regras que separam transferência de receita e despesa.
    CONSTRAINT lancamentos_transferencia_check CHECK (
        CASE WHEN tipo = 'TRANSFERENCIA' THEN
            -- Transferência sai de uma conta, vai para outra e não tem categoria.
            id_categoria IS NULL
            AND id_cartao IS NULL
            AND id_conta IS NOT NULL
            AND id_conta_destino IS NOT NULL
            AND id_conta_destino <> id_conta
        ELSE
            -- Receita e despesa exigem categoria e não têm destino.
            id_categoria IS NOT NULL
            AND id_conta_destino IS NULL
        END
    )
);

-- Índices desenhados a partir das consultas que o endpoint realmente faz.
-- Todas recortam por data, então ela lidera cada um deles.

-- Recorte do período e a janela de seis meses dos gráficos.
CREATE INDEX lancamentos_data_idx
    ON lancamentos (data DESC);

-- monthIncome, monthExpense, cashflow e dailySpending somam por tipo no período.
CREATE INDEX lancamentos_tipo_data_idx
    ON lancamentos (tipo, data DESC);

-- spendingByCategory agrupa despesas por categoria dentro do recorte.
CREATE INDEX lancamentos_categoria_data_idx
    ON lancamentos (id_categoria, data DESC)
    WHERE id_categoria IS NOT NULL;

-- Reconstrução do saldo passado e montagem da fatura de um cartão.
CREATE INDEX lancamentos_conta_data_idx
    ON lancamentos (id_conta, data DESC)
    WHERE id_conta IS NOT NULL;

CREATE INDEX lancamentos_cartao_data_idx
    ON lancamentos (id_cartao, data DESC)
    WHERE id_cartao IS NOT NULL;

-- A transferência que cruza a fronteira do saldo total pesa na reconstrução.
CREATE INDEX lancamentos_conta_destino_data_idx
    ON lancamentos (id_conta_destino, data DESC)
    WHERE id_conta_destino IS NOT NULL;


-- =============================================================================
-- 5. compras_parceladas
-- Necessária para `currentInvoice`: a fatura de um ciclo reúne as despesas
-- lançadas no cartão MAIS as parcelas das compras parceladas. Sem esta tabela o
-- valor da fatura no dashboard nasce errado.
--
-- As parcelas não são linhas desta tabela nem de `lancamentos`: elas são
-- calculadas a partir de `parcelas`, `primeiro_mes` e `valor_total`. Gravar doze
-- cópias de cada compra em `lancamentos` deixaria a listagem de lançamentos
-- ilegível e o resultado do período errado, já que quem sai da conta é a fatura,
-- não a parcela.
-- =============================================================================

CREATE TABLE compras_parceladas (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao        VARCHAR(160)   NOT NULL,

    -- Valor total da compra, não o da parcela.
    valor_total      NUMERIC(14,2)  NOT NULL,
    parcelas         SMALLINT       NOT NULL,

    data_compra      DATE           NOT NULL,

    -- Mês da primeira parcela. DATE fixado no dia 1 em vez de texto 'YYYY-MM':
    -- assim a comparação e a aritmética de meses continuam sendo do banco.
    primeiro_mes     DATE           NOT NULL,

    id_cartao        UUID           NOT NULL,
    id_categoria     UUID,
    observacoes      TEXT,

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

-- "Só cartões de crédito aceitam compras parceladas" é regra de negócio e vive
-- no caso de uso, não aqui. Quem quiser a garantia também no banco pode usar a
-- chave estrangeira composta abaixo, que custa uma coluna redundante:
--
--   ALTER TABLE cartoes ADD CONSTRAINT cartoes_id_tipo_unico UNIQUE (id, tipo);
--   ALTER TABLE compras_parceladas ADD COLUMN tipo_cartao VARCHAR(16) NOT NULL
--       DEFAULT 'CREDITO' CHECK (tipo_cartao = 'CREDITO');
--   ALTER TABLE compras_parceladas ADD CONSTRAINT compras_parceladas_credito_fk
--       FOREIGN KEY (id_cartao, tipo_cartao) REFERENCES cartoes (id, tipo);

CREATE INDEX compras_parceladas_cartao_mes_idx
    ON compras_parceladas (id_cartao, primeiro_mes);


-- =============================================================================
-- 6. investimentos
-- Alimenta `investmentsTotal` (soma de valor_atual) e `investmentsDelta`
-- (rentabilidade acumulada: (valor_atual - aportado) / aportado).
-- =============================================================================

CREATE TABLE investimentos (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(120)   NOT NULL,
    classe_ativo     VARCHAR(16)    NOT NULL,
    instituicao      VARCHAR(80)    NOT NULL,

    -- Total aportado até hoje.
    aportado         NUMERIC(14,2)  NOT NULL,

    -- Quanto a posição vale agora.
    valor_atual      NUMERIC(14,2)  NOT NULL,

    -- Data do primeiro aporte. Não é usada pelo endpoint 01, mas é ela que dá
    -- idade à posição na curva de evolução do endpoint 23.
    data_inicio      DATE           NOT NULL,

    observacoes      TEXT,

    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT investimentos_nome_tamanho_minimo
        CHECK (char_length(trim(nome)) >= 2),

    CONSTRAINT investimentos_classe_ativo_check
        CHECK (classe_ativo IN (
            'RENDA_FIXA', 'CDB', 'TESOURO', 'ACOES',
            'ETF', 'FUNDOS', 'CRIPTO', 'OUTROS'
        )),

    CONSTRAINT investimentos_aportado_positivo
        CHECK (aportado > 0),

    -- Menor que o aportado é aceito: posição no prejuízo existe.
    CONSTRAINT investimentos_valor_atual_check
        CHECK (valor_atual >= 0),

    CONSTRAINT investimentos_data_inicio_nao_futura
        CHECK (data_inicio <= CURRENT_DATE)
);

CREATE INDEX investimentos_classe_ativo_idx ON investimentos (classe_ativo);


-- =============================================================================
-- O que este endpoint NÃO precisa
--
--   faturas           Fatura não é cadastro: ela é derivada. O ciclo vai do
--                     fechamento anterior (exclusivo) ao deste mês (inclusivo),
--                     reunindo despesas do cartão e parcelas. Materializá-la
--                     numa tabela criaria uma segunda verdade que precisa ser
--                     reprocessada a cada compra lançada com data retroativa.
--
--   cartoes.utilizado Pela mesma razão. Ele é a soma das faturas ainda não
--                     pagas, incluindo as futuras — as parcelas já assumidas
--                     contam. Guardar o valor à mão faria a barra de limite
--                     mentir na primeira compra parcelada.
--
--   parcelas          Elas saem do cálculo sobre `compras_parceladas`. As
--                     primeiras levam o valor arredondado para baixo e a última
--                     absorve a sobra, para a soma fechar exatamente com
--                     `valor_total`.
--
--   orcamentos,       Nenhuma delas é lida pelo dashboard. Entram nos endpoints
--   despesas_         27 a 39.
--   recorrentes,
--   metas
-- =============================================================================


-- =============================================================================
-- Ainda não modelado: usuário
--
-- O contrato não tem autenticação, então nenhuma tabela acima tem dono. Quando
-- o Spring Security entrar, cada uma das seis ganha `id_usuario UUID NOT NULL`
-- com chave estrangeira para `usuarios`, e todo índice composto passa a começar
-- por ela. Vale saber o preço agora: acrescentar a coluna depois exige backfill
-- em base já povoada e a revisão de cada consulta do dashboard, porque hoje elas
-- somam a base inteira.
-- =============================================================================
