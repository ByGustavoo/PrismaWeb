# Mudanças pendentes no PrismaAPI

Este documento lista **só o que o PrismaAPI ainda precisa implementar** para acompanhar o frontend.
O que já existe no backend saiu daqui.

A lista foi conferida contra o código do PrismaAPI (`D:\Projetos\PrismaAPI`, commit `PRM-14`): enums
em `enums/`, migrações `V1.0__CreateTables.sql` e `V1.1__InsertCategorias.sql`, `SaldoService`,
`LancamentoService`, `PrevisaoService`, `AvisoService` e os DTOs de investimento e previsão. As
convenções gerais (nomes em português, formato de erro `ErrorResponseDTO`, `204` nas exclusões,
mensagens terminadas em `!`) continuam valendo e não são repetidas.

Os tipos de referência estão em [`src/types/financas.ts`](src/types/financas.ts) e as URLs em
[`src/api/rotasApi.ts`](src/api/rotasApi.ts).

---

## Sumário

1. [Categorias e cores](#1-categorias-e-cores)
2. [Contas de reserva](#2-contas-de-reserva)
3. [Lançamentos atualizam o saldo da conta](#3-lançamentos-atualizam-o-saldo-da-conta)
4. [Saldo total: cartão de crédito e parcelas](#4-saldo-total-cartão-de-crédito-e-parcelas)
5. [Compra à vista no cartão](#5-compra-à-vista-no-cartão)
6. [Investimentos com aportes e histórico](#6-investimentos-com-aportes-e-histórico)
7. [Previsão financeira](#7-previsão-financeira)
8. [Avisos](#8-avisos)
9. [Resumo e checklist](#9-resumo-e-checklist)

---

## 1. Categorias e cores

**Hoje:** 11 categorias (`V1.1__InsertCategorias.sql`) e `categorias_token_cor_check` limitando
`token_cor` a 1–6, com tokens repetidos.

**Precisa:** uma migração que amplie o `CHECK` para **1–16**, acrescente seis categorias e reatribua os
tokens, para que duas categorias do mesmo tipo nunca tenham a mesma cor no mesmo gráfico.

| nome | tipo | `token_cor` | Situação | O que entra |
| --- | --- | --- | --- | --- |
| Moradia | `DESPESA` | 1 | existe | Aluguel, condomínio, IPTU, financiamento |
| Contas | `DESPESA` | 2 | **nova** | Energia, água, gás, internet, celular |
| Casa | `DESPESA` | 3 | **nova** | Manutenção, móveis, eletrodomésticos, utilidades |
| Alimentação | `DESPESA` | 4 | existe (era 2) | Mercado, restaurante, delivery |
| Transporte | `DESPESA` | 5 | existe (era 3) | Combustível, aplicativo, manutenção do carro, seguro |
| Saúde | `DESPESA` | 6 | existe (era 4) | Plano, farmácia, consultas, academia |
| Educação | `DESPESA` | 7 | existe (era 6) | Cursos, livros, mensalidade |
| Cuidados pessoais | `DESPESA` | 8 | **nova** | Barbearia, salão, cosméticos |
| Lazer | `DESPESA` | 9 | existe (era 5) | Passeios, viagens, cinema, clube |
| Assinaturas | `DESPESA` | 10 | **nova** | Streaming, aplicativos |
| Compras | `DESPESA` | 11 | **nova** | Roupas, eletrônicos, presentes |
| Investimentos | `DESPESA` | 12 | **nova** | Para quem registra o aporte como saída da conta |
| Outras despesas | `DESPESA` | 13 | existe (era 6) | O que não cabe nas demais |
| Salário | `RECEITA` | 14 | existe (era 2) | |
| Freelance | `RECEITA` | 15 | existe (era 1) | |
| Rendimentos | `RECEITA` | 16 | existe (era 5) | Juros, dividendos, rendimento de reserva |
| Outras receitas | `RECEITA` | 13 | existe (era 4) | |

- `tokenCor` indexa a paleta categórica do frontend (`--palette-1` a `--palette-16`). As duas
  "Outras" dividem o cinza neutro (13) porque nunca aparecem no mesmo gráfico.
- A migração deve usar `UPDATE ... WHERE nome = ? AND tipo = ?` para as existentes e manter o
  `ON CONFLICT (nome, tipo) DO NOTHING` para as novas.
- Lançamentos antigos de energia, água e internet continuam em Moradia; mover para Contas é opcional
  e fica a critério de quem roda a migração.

---

## 2. Contas de reserva

**Hoje:** `TipoConta` tem `CORRENTE`, `SALARIO`, `EMERGENCIA` e `OUTRA`
(`contas_tipo_check` idem). Não há endpoint de evolução.

### 2.1 Novos tipos de conta

Acrescentar `POUPANCA` ("POUPANÇA") e `PREVIDENCIA` ("PREVIDÊNCIA") ao enum e ao
`contas_tipo_check`.

Novo enum **`FinalidadeConta`**: `MOVIMENTACAO`, `RESERVA`. Não é gravado; sai do tipo:

| `TipoConta` | Finalidade |
| --- | --- |
| `CORRENTE`, `SALARIO`, `OUTRA` | `MOVIMENTACAO` |
| `EMERGENCIA`, `POUPANCA`, `PREVIDENCIA` | `RESERVA` |

Novo enum **`TipoMovimentacaoConta`**: `APORTE`, `RESGATE`, `RENDIMENTO`.

### 2.2 `GET /contas/reservas`

**Resposta `200` — `EvolucaoContaDTO[]`**: uma entrada por conta de finalidade `RESERVA`, ativas e
inativas, na mesma ordem de `GET /contas`.

### 2.3 `GET /contas/{id}/evolucao`

**Resposta `200` — `EvolucaoContaDTO`**, para qualquer conta. `404` com `Conta não encontrada!`.

```jsonc
{
  "conta": { "…": "ContaDTO" },
  "finalidade": "RESERVA",
  "dataInicial": "2025-10-01",          // primeiro dia da janela de 12 meses
  "saldoInicial": 9576.70,              // saldo no começo da janela
  "aportes": 7200.00,
  "resgates": 0.00,
  "rendimentos": 1423.30,
  "saldoAtual": 18200.00,
  "rentabilidade": 0.0848,              // fração: rendimentos ÷ (saldoInicial + aportes − resgates)
  "evolucao": [
    { "rotulo": "Out", "mes": "2025-10", "valor": 10176.70, "aportado": 10176.70 }
  ],
  "movimentacoes": [
    { "id": "…", "tipo": "APORTE", "data": "2026-09-07", "descricao": "Aporte na reserva",
      "valor": 600.00, "saldoApos": 18200.00 }
  ]
}
```

`evolucao` usa o mesmo formato de ponto da carteira (`rotulo`, `mes`, `aportado`, `valor`), que o
frontend chama de `PontoEvolucaoDTO`.

**A evolução não tem cadastro próprio.** Ela sai dos lançamentos `PAGO` com data até hoje:

| Lançamento que toca a conta | Vira |
| --- | --- |
| Transferência com a conta como destino | `APORTE` |
| Receita na conta com a categoria Rendimentos | `RENDIMENTO` |
| Qualquer outra receita na conta | `APORTE` |
| Transferência com a conta como origem, ou despesa paga por ela | `RESGATE` |

**Regras**

- **A conta fecha sempre:** `saldoInicial + aportes − resgates + rendimentos = saldoAtual`. A tela
  mostra essa equação, então um centavo de diferença aparece para o usuário.
- `saldoInicial` = saldo de hoje menos o efeito dos lançamentos da janela.
- `evolucao` tem **doze** pontos, do mais antigo ao atual. `valor` é o saldo no fim do mês (hoje, no
  mês corrente); `aportado` é o saldo sem os rendimentos: `saldoInicial` mais aportes menos resgates
  acumulados até ali.
- `movimentacoes` vem da mais recente para a mais antiga, com `valor` sempre positivo (o sentido está
  no `tipo`) e `saldoApos` logo depois de cada uma.
- Registrar aporte ou rendimento numa conta **não tem endpoint próprio**: é `POST /lancamentos`.

---

## 3. Lançamentos atualizam o saldo da conta

**Hoje:** `LancamentoService.salvar`, `atualizar` e `deletar` gravam o lançamento, mas não tocam em
`contas.saldo`.

**Precisa:** como `ContaDTO.saldo` é o saldo de hoje, todo lançamento com `data <= hoje` altera o
saldo das contas envolvidas, na mesma transação:

| Lançamento | Efeito |
| --- | --- |
| Receita em conta | `+valor` na conta |
| Despesa em conta | `−valor` na conta |
| Transferência | `−valor` na origem, `+valor` no destino |
| Qualquer lançamento em cartão | nenhum efeito em conta |

- `POST`: aplica o efeito.
- `PUT`: desfaz o efeito do lançamento antigo e aplica o do novo (a conta, o valor, o tipo ou a data
  podem ter mudado).
- `DELETE`: desfaz o efeito.
- Lançamento com data futura não mexe no saldo ao ser gravado.

Sem isso, um rendimento registrado numa reserva aparece em `/contas/{id}/evolucao`, mas `saldoAtual`
não o inclui, e o `saldoInicial` cai para fechar a equação.

---

## 4. Saldo total: cartão de crédito e parcelas

**Hoje:** `SaldoService.linhaDoSaldo` só soma receitas e despesas cuja `conta` está no total
(`JOIN lancamento.conta`). Despesas no cartão (`id_cartao`) e parcelas de compras parceladas nunca
saem do saldo reconstruído do dashboard, dos relatórios e da previsão.

**Precisa:**

- **Despesa em cartão de crédito pesa no saldo total** na data da compra. Despesa em vale-alimentação
  ou vale-refeição continua sem peso: o dinheiro é do vale.
- **Cada parcela sai do saldo na data de vencimento da fatura em que cai** (`ParcelaDTO.dataVencimento`).
- Receita e despesa em conta fora do total continuam sem peso (já é assim).

O mesmo cálculo abastece `/dashboard/resumo`, `/relatorios/resumo` e `/previsao`.

---

## 5. Compra à vista no cartão

**Hoje:** `SalvarCompraParceladaDTO` tem `@Min(2)` e `compras_parceladas_parcelas_check` exige
`parcelas BETWEEN 2 AND 48`.

**Precisa:** aceitar **1 a 48** parcelas, no DTO e no `CHECK`. Com uma parcela, o cronograma tem uma
linha e a compra entra inteira na fatura de `primeiroMes`.

| Situação | Status | Mensagem |
| --- | --- | --- |
| `parcelas` fora de 1–48 | `400` | `O campo 'parcelas' deve estar entre 1 e 48!` |

---

## 6. Investimentos com aportes e histórico

**Hoje:** `investimentos` guarda `aportado`, `valor_atual` e `data_inicio` como colunas editáveis;
`ClasseAtivo` tem oito valores; a evolução da carteira distribui os aportes linearmente.

**Precisa:** separar **aporte** (dinheiro novo) de **rendimento** (crescimento), com histórico.

### 6.1 Novas classes de ativo

Acrescentar ao `ClasseAtivo` e ao `investimentos_classe_ativo_check`:

- `RDB` ("RDB") — inclui as "caixinhas" e "cofrinhos" de bancos digitais;
- `PREVIDENCIA` ("PREVIDÊNCIA PRIVADA") — PGBL e VGBL.

### 6.2 Tabela de movimentações

Nova tabela `movimentacoes_investimento`:

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | `UUID` | |
| `id_investimento` | `UUID` | FK, `ON DELETE CASCADE` |
| `tipo` | `VARCHAR` | `APORTE` ou `RENDIMENTO` (enum `TipoMovimentacaoInvestimento`) |
| `data` | `DATE` | não pode ser futura |
| `valor` | `NUMERIC(14,2)` | preenchido em `APORTE`, maior que zero |
| `saldo_informado` | `NUMERIC(14,2)` | preenchido em `RENDIMENTO`, maior ou igual a zero |
| `descricao` | `VARCHAR(160)` | opcional |
| `data_criacao` | `TIMESTAMPTZ` | define a ordem entre movimentações da mesma data |

`aportado`, `valor_atual` e `data_inicio` passam a ser **leitura da série** — podem virar colunas
derivadas ou sair da tabela. A migração precisa converter os investimentos existentes: um `APORTE` de
`aportado` em `data_inicio` ("Aplicação inicial") e, se `valor_atual <> aportado`, um `RENDIMENTO` com
`saldo_informado = valor_atual` na data da migração.

**Como a série é lida** (ordem: `data`, depois `data_criacao`):

- `APORTE`: saldo += `valor`; aportado += `valor`.
- `RENDIMENTO`: o valor exibido é `saldo_informado − saldo anterior` (pode ser negativo); saldo =
  `saldo_informado`; aportado não muda.

Exemplo: aplicação inicial de R$ 10.000,00 → saldo informado de R$ 20.000,00 (rendimento de
R$ 10.000,00) → aporte de R$ 2.000,00. Resultado: saldo R$ 22.000,00, aportado R$ 12.000,00.

### 6.3 `InvestimentoDTO`

Ganha **`dataAtualizacao`** (`LocalDate`): a data da última movimentação.

```jsonc
{
  "id": "…",
  "nome": "Previdência privada",
  "classeAtivo": "PREVIDENCIA",
  "instituicao": "Seguradora Atlas",
  "aportado": 18250.00,            // soma dos APORTE
  "valorAtual": 21816.25,          // saldo depois da última movimentação
  "dataInicio": "2023-12-15",      // data da primeira movimentação
  "dataAtualizacao": "2026-09-17", // data da última movimentação
  "observacoes": "PGBL com contribuição mensal."
}
```

> A entidade `Investimento` já tem um `dataAtualizacao` de auditoria (`OffsetDateTime`). O campo do DTO
> é outro: a **data da última movimentação**. Vale renomear um dos dois no mapeamento para não
> confundir.

### 6.4 `POST /investimentos`

Corpo continua `SalvarInvestimentoDTO` (`nome`, `classeAtivo`, `instituicao`, `aportado`,
`valorAtual`, `dataInicio`, `observacoes`), com novo significado: `aportado` é a **aplicação
inicial** e `valorAtual`, o **saldo de hoje**. O servidor grava o cadastro e as movimentações:

- `APORTE` de `aportado` em `dataInicio`, descrição "Aplicação inicial";
- se `valorAtual <> aportado`, `RENDIMENTO` com `valorAtual` na data de hoje, descrição "Saldo
  informado no cadastro".

### 6.5 `PUT /investimentos/{id}` — muda o corpo

Novo corpo **`AtualizarInvestimentoDTO`**: `nome`, `classeAtivo`, `instituicao`, `observacoes`.
**Sem valores**: editar o aportado à mão apagaria a história da série. Resposta `200` —
`InvestimentoDTO`.

### 6.6 `POST /investimentos/{id}/aportes` — novo

Corpo **`SalvarAporteInvestimentoDTO`**: `valor`, `data`, `descricao` (opcional). Resposta `201` —
`InvestimentoDTO` já atualizado.

### 6.7 `POST /investimentos/{id}/saldos` — novo

Corpo **`SalvarSaldoInvestimentoDTO`**: `valorAtual`, `data`, `descricao` (opcional). Grava um
`RENDIMENTO`. Resposta `201` — `InvestimentoDTO` já atualizado.

### 6.8 `GET /investimentos/{id}/extrato` — novo

**Resposta `200` — `ExtratoInvestimentoDTO`**. `404` com `Investimento não encontrado!`.

```jsonc
{
  "posicao": { "…": "PosicaoDTO" },
  "quantidadeAportes": 34,
  "ultimoAporte": "2026-09-15",        // null quando não há aporte
  "movimentacoes": [
    { "id": "…", "tipo": "RENDIMENTO", "data": "2026-09-17", "valor": 88.65,
      "saldoApos": 21816.25, "aportadoApos": 18250.00, "descricao": "Extrato do mês" },
    { "id": "…", "tipo": "APORTE", "data": "2026-09-15", "valor": 250.00,
      "saldoApos": 21727.60, "aportadoApos": 18250.00, "descricao": "Aporte mensal" }
  ],
  "evolucao": [
    { "rotulo": "Out", "mes": "2025-10", "aportado": 15250.00, "valor": 17512.40 }
  ]
}
```

- `movimentacoes` da **mais recente para a mais antiga**, com `saldoApos` e `aportadoApos` calculados
  na ordem da série.
- `evolucao`: um ponto por mês desde o mês da primeira movimentação, com no mínimo dois e no máximo
  doze pontos. Em cada fim de mês (hoje, no corrente): último saldo conhecido mais os aportes
  posteriores a ele.

### 6.9 `DELETE /investimentos/{id}`

Remove o cadastro **e** as movimentações.

### 6.10 `GET /investimentos/carteira`

- `historico` (o frontend chama o item de `PontoEvolucaoDTO`; o formato não muda) passa a sair das
  movimentações, com a mesma regra do extrato, e não mais da distribuição linear por `dataInicio`.
- As `posicoes` carregam o `InvestimentoDTO` com `dataAtualizacao`.

### 6.11 Validações

| Situação | Endpoint | Status | Mensagem |
| --- | --- | --- | --- |
| `aportado` ≤ 0 | `POST /investimentos` | `422` | `Informe o valor da aplicação inicial!` |
| `dataInicio` ausente | `POST /investimentos` | `422` | `Informe a data da aplicação inicial!` |
| `dataInicio` no futuro | `POST /investimentos` | `422` | `A data da aplicação inicial não pode estar no futuro!` |
| `valor` ≤ 0 | `/aportes` | `422` | `Informe o valor do aporte!` |
| `valorAtual` < 0 | `/saldos` | `422` | `Informe o saldo atual do investimento!` |
| `data` ausente | `/aportes` · `/saldos` | `422` | `Informe a data do aporte!` · `Informe a data do saldo!` |
| `data` no futuro | `/aportes` · `/saldos` | `422` | `A data do aporte não pode estar no futuro!` · `A data do saldo não pode estar no futuro!` |
| `data` anterior a `dataAtualizacao` | `/aportes` · `/saldos` | `422` | `A data do aporte não pode ser anterior à última atualização, de dd/MM/yyyy!` · `A data do saldo não pode ser anterior à última atualização, de dd/MM/yyyy!` |
| `descricao` com mais de 160 caracteres | `/aportes` · `/saldos` | `422` | `A descrição pode ter no máximo 160 caracteres!` |
| Id inexistente | todos com `{id}` | `404` | `Investimento não encontrado!` |

A regra da data mínima existe porque um aporte anterior ao último saldo informado seria engolido
por ele.

---

## 7. Previsão financeira

**Hoje:** `PrevisaoDTO` tem `saldoInicial` (saldo de hoje), `meses`, `saldoFinal`, `resultadoMedio` e
`menorSaldo`; `MesPrevisaoDTO` não tem `agendados` nem `aportes`; a projeção começa no mês seguinte
partindo do saldo de hoje.

### 7.1 Bug: recorrentes nos meses da base valem zero

`PrevisaoService.ocorrenciasNoMes` só avança a partir de `proximoVencimento`. Para os três meses
fechados da base, que ficam **antes** do próximo vencimento, o resultado é zero. A média de
recorrentes da base fica zerada, o `variavel` absorve aluguel e plano de saúde, e a projeção os
desconta de novo em cada mês — algo como R$ 4 mil por mês de saída que não existe.

**Correção:** calcular as ocorrências também para trás, recuando pela frequência a partir de
`proximoVencimento` até antes do início do mês pedido (o `Frequencia` precisa de uma
`ocorrenciaAnterior`, simétrica à `proximaOcorrencia`).

### 7.2 Novo formato

```jsonc
{
  "saldoAtual": 39341.35,               // saldo de hoje, contas do total
  "restanteMesAtual": {                 // só o que falta no mês corrente
    "mes": "2026-09", "rotulo": "Set",
    "receita": 745.50, "recorrentes": 219.80, "parcelas": 0.00, "variavel": 1348.83,
    "agendados": 448.62, "despesa": 2017.25, "aportes": 0.00,
    "resultado": -1271.75, "saldoFinal": 38069.60
  },
  "saldoInicial": 38069.60,             // passa a ser o fim do mês corrente
  "meses": [
    {
      "mes": "2026-10", "rotulo": "Out",
      "receita": 12377.78, "recorrentes": 4269.70, "parcelas": 2600.00, "variavel": 3112.68,
      "agendados": 0.00, "despesa": 9982.38, "aportes": 2000.00,
      "resultado": 395.40, "saldoFinal": 38465.00
    }
  ],
  "saldoFinal": 43624.00,
  "resultadoMedio": 925.73,
  "menorSaldo": { "mes": "2026-09", "saldo": 38069.60 },
  "base": {
    "meses": ["2026-06", "2026-07", "2026-08"],
    "receitaMedia": 12377.78,
    "despesaMedia": 7382.38,
    "recorrentesMedia": 4269.70,
    "aportesMedia": 2000.00
  }
}
```

Campos novos: `saldoAtual`, `restanteMesAtual`, `base` (novo record `BaseCalculoPrevisaoDTO`) e, em
`MesPrevisaoDTO`, `agendados` e `aportes`. `saldoInicial` muda de significado.

### 7.3 Regras

- **Mesmo modelo de saldo** das seções 3 e 4.
- **`restanteMesAtual`** cobre de amanhã ao fim do mês: lançamentos agendados ou pendentes
  (`agendados` e `receita`), recorrentes que ainda vencem e não têm lançamento no mês, parcelas com
  vencimento até o último dia e `variavel` proporcional aos dias restantes. `receita` e `aportes` aqui
  são só os já agendados, sem média.
- **Parcelas por data de vencimento:** `parcelas` soma as parcelas cuja `dataVencimento` cai no mês,
  e não mais as do mês da fatura.
- `receita` (meses cheios) = `base.receitaMedia` + receitas agendadas no mês. A média considera só
  receitas em contas do total.
- `recorrentes`: ocorrências no mês exato, de recorrentes ativas pagas por conta do total ou cartão
  de crédito. Recorrente que já tem lançamento com a mesma descrição no mês não é somada de novo.
- `variavel` = `base.despesaMedia − base.recorrentesMedia`, nunca negativo.
- `agendados`: despesas agendadas ou pendentes do mês. Nos meses cheios, ficam de fora as que se
  repetem nos três meses da base (já estão na média), a menos que tenham o nome de uma recorrente.
- `aportes` = `base.aportesMedia` (média das transferências que saem do total) + transferências
  agendadas que saem do total. Não é despesa.
- `despesa` = `recorrentes + parcelas + variavel + agendados`.
- `resultado` = `receita − despesa − aportes`; `saldoFinal` acumula a partir de `saldoInicial`.
- `menorSaldo` considera `restanteMesAtual` e os meses projetados; `resultadoMedio`, só os meses
  projetados.

---

## 8. Avisos

**Hoje:** `TipoAviso` tem `FATURA_VENCENDO`, `CONTA_VENCENDO`, `LANCAMENTO_AGENDADO` e
`LIMITE_CARTAO`. O `AvisoService` usa texto genérico: receita pendente sai como "vence em N dias",
transferência agendada como "Agendado · vence…", e o limite traz `valor` solto.

### 8.1 Novos tipos

Acrescentar ao `TipoAviso`:

- `RECORRENTE_VENCENDO` — despesas recorrentes ativas que vencem em até **7 dias** e ainda não têm
  lançamento com a mesma descrição no mês. `rota`: `/planejamento/recorrentes`.
- `RECEITA_PREVISTA` — receitas pendentes ou agendadas dentro de 15 dias. Severidade sempre `INFO`.

Com isso, `CONTA_VENCENDO` fica só com **despesas** pendentes, e `LANCAMENTO_AGENDADO`, com despesas
agendadas e transferências não concluídas.

### 8.2 Textos

| Tipo | `titulo` | `descricao` |
| --- | --- | --- |
| `FATURA_VENCENDO` | `Fatura do <cartão>` | `Aberta até dd/MM · vence em N dias`, `Fechada · vence amanhã` ou `Sem pagamento registrado · venceu há N dias` |
| `CONTA_VENCENDO` | descrição do lançamento | `<categoria> · vence em N dias` |
| `RECORRENTE_VENCENDO` | descrição da recorrente | `Despesa recorrente · vence em N dias` |
| `LANCAMENTO_AGENDADO` (despesa) | descrição do lançamento | `<categoria> · débito agendado em N dias` |
| `LANCAMENTO_AGENDADO` (transferência) | descrição do lançamento | `Transferência para <conta destino> · em N dias` |
| `RECEITA_PREVISTA` | descrição do lançamento | `<categoria> · a receber em N dias` |
| `LIMITE_CARTAO` | `<cartão> perto do limite` | `N% do limite em uso, com as parcelas futuras · R$ X livres` ou `… · R$ X acima do limite` |

- Prazos: `hoje`, `amanhã`, `em N dias`, `há N dias` (e `vence hoje`, `vence amanhã`, `vence em N
  dias`, `venceu há N dias` onde o texto fala em vencimento).
- **`LIMITE_CARTAO` não traz `valor`**: o valor livre já está na descrição, arredondado e formatado
  em reais.
- Fatura com total zero não gera aviso.

---

## 9. Resumo e checklist

### Endpoints novos

| Método | URL | Resposta |
| --- | --- | --- |
| `GET` | `/contas/reservas` | `EvolucaoContaDTO[]` |
| `GET` | `/contas/{id}/evolucao` | `EvolucaoContaDTO` |
| `GET` | `/investimentos/{id}/extrato` | `ExtratoInvestimentoDTO` |
| `POST` | `/investimentos/{id}/aportes` | `201` · `InvestimentoDTO` |
| `POST` | `/investimentos/{id}/saldos` | `201` · `InvestimentoDTO` |

### Endpoints que mudam

| Método | URL | Mudança |
| --- | --- | --- |
| `GET` | `/categorias` | 17 categorias, `tokenCor` 1–16 |
| `POST` `PUT` `DELETE` | `/lancamentos` | atualizam `contas.saldo` |
| `GET` | `/dashboard/resumo`, `/relatorios/resumo` | saldo com cartão de crédito e parcelas |
| `POST` `PUT` | `/compras-parceladas` | aceitam 1 parcela |
| `GET` | `/investimentos/carteira` | `historico` pelas movimentações; `dataAtualizacao` |
| `POST` | `/investimentos` | cria as movimentações iniciais |
| `PUT` | `/investimentos/{id}` | corpo `AtualizarInvestimentoDTO`, sem valores |
| `DELETE` | `/investimentos/{id}` | remove as movimentações |
| `GET` | `/previsao` | formato novo e correção das recorrentes |
| `GET` | `/avisos` | dois tipos novos e textos por tipo |

### Checklist

- [ ] Migração: `token_cor` 1–16, seis categorias novas, tokens reatribuídos.
- [ ] Migração: `contas_tipo_check` com `POUPANCA` e `PREVIDENCIA`.
- [ ] Migração: `compras_parceladas_parcelas_check` com 1–48.
- [ ] Migração: `investimentos_classe_ativo_check` com `RDB` e `PREVIDENCIA`.
- [ ] Migração: tabela `movimentacoes_investimento` e conversão dos investimentos existentes.
- [ ] Enums: `TipoConta`, `ClasseAtivo`, `TipoAviso`; novos `FinalidadeConta`,
      `TipoMovimentacaoConta`, `TipoMovimentacaoInvestimento`.
- [ ] `LancamentoService`: efeito no saldo das contas em criar, editar e excluir.
- [ ] `SaldoService`: despesa em cartão de crédito e parcelas na data de vencimento.
- [ ] `SalvarCompraParceladaDTO`: `@Min(1)`.
- [ ] Investimentos: DTOs novos, três endpoints novos, `PUT` sem valores, carteira pelas
      movimentações.
- [ ] Contas: evolução e reservas.
- [ ] `PrevisaoService`: ocorrências para trás, resto do mês, `agendados`, `aportes`, `base`.
- [ ] `AvisoService`: tipos novos, textos por tipo, limite sem `valor`.

Fora de escopo, e não deve ser inventado: pagamento ou quitação de fatura, resgate de investimento,
débito automático do aporte numa conta, histórico de cotação por ativo e exportação de relatório.
