# Contrato da API — Prisma

Este documento descreve **todos** os endpoints que o frontend do Prisma consome. Ele é a
especificação a partir da qual os `@RestController` e os DTOs do backend Java / Spring Boot devem
ser implementados.

O frontend já está inteiro escrito contra este contrato. Enquanto o backend não existe, a camada
de serviços responde com dados mockados; trocando `VITE_USE_MOCKS` para `false`, as mesmas telas
passam a falar com a API real **sem que nenhum componente mude** — desde que as respostas tenham
exatamente o formato descrito aqui.

A fonte de verdade dos tipos é [`src/types/finance.ts`](src/types/finance.ts) e
[`src/types/common.ts`](src/types/common.ts). As URLs vivem em
[`src/api/endpoints.ts`](src/api/endpoints.ts) e em nenhum outro lugar.

---

## Sumário

- [Convenções gerais](#convenções-gerais)
- [Formato de erro](#formato-de-erro)
- [Enums do domínio](#enums-do-domínio)
- [Dashboard](#dashboard)
- [Categorias](#categorias)
- [Lançamentos (receitas, despesas e transferências)](#lançamentos-receitas-despesas-e-transferências)
- [Contas](#contas)
- [Cartões](#cartões)
- [Faturas](#faturas)
- [Compras parceladas](#compras-parceladas)
- [Investimentos](#investimentos)
- [Orçamento](#orçamento)
- [Despesas recorrentes](#despesas-recorrentes)
- [Metas e desejos](#metas-e-desejos)
- [Previsão financeira](#previsão-financeira)
- [Relatórios](#relatórios)
- [Avisos](#avisos)
- [Resumo dos endpoints](#resumo-dos-endpoints)
- [O que o backend precisa calcular](#o-que-o-backend-precisa-calcular)

---

## Convenções gerais

| Assunto | Regra |
| --- | --- |
| Base URL | `VITE_API_URL`, por padrão `http://localhost:8080/api`. Todos os caminhos deste documento são relativos a ela. |
| Formato | JSON em requisição e resposta. O cliente envia `Accept: application/json` sempre e `Content-Type: application/json` quando há corpo. |
| Data | String ISO `YYYY-MM-DD`, sem hora e sem fuso. Representa um dia civil, não um instante — o backend deve usar `LocalDate`, nunca `Instant` ou `ZonedDateTime`. |
| Mês | String `YYYY-MM` (por exemplo `2026-09`). Usado onde a granularidade é o mês: faturas, parcelas, orçamento, previsão e evolução do patrimônio. `YearMonth` no Java. |
| Dinheiro | `number` JSON com duas casas decimais, sempre **positivo**. A direção do dinheiro vem do campo `kind`, nunca do sinal. Use `BigDecimal` com escala 2 no backend e serialize como número, não como string. |
| Percentual | `number` em pontos percentuais: `8.2` significa 8,2%. **Exceção:** `share`, `ratio` e `profitability` são frações de 0 a 1. Cada campo abaixo diz qual dos dois é. |
| Identificador | `string`. O frontend nunca faz aritmética com id, então UUID, id numérico serializado como texto ou slug funcionam igualmente. |
| Ordenação | Sempre definida pelo servidor; o frontend não reordena o que chega da API (ele reordena só o que já está em memória, por escolha do usuário). Cada endpoint diz sua ordem. |
| Campo opcional | Pode ser **omitido** ou vir `null`. O frontend trata os dois igual. Campos não marcados como opcionais são obrigatórios na resposta. |
| Timeout | O cliente aborta em **15 s**. Endpoints de relatório e previsão precisam responder dentro disso. |
| Cancelamento | Toda requisição carrega um `AbortSignal`. Trocar de tela cancela a requisição em voo; o backend pode simplesmente ignorar a desconexão. |
| Autenticação | Ainda não existe. O `httpClient` já tem o ponto único `getAuthToken()`; quando o Spring Security entrar, ele passa a mandar `Authorization: Bearer <token>` em todas as chamadas. Nenhum endpoint deste documento precisa mudar por causa disso. |
| CORS | O dev server roda em `http://localhost:5173`. O backend precisa liberar essa origem para os métodos `GET`, `POST`, `PUT`, `DELETE` e para o header `Authorization`. |
| `204 No Content` | Toda exclusão responde `204` sem corpo. O `httpClient` já trata esse status e não tenta desserializar. |
| Paginação | **Não há.** Toda listagem devolve o array inteiro. O frontend não envia `page` nem `pageSize` e não sabe interpretar um envelope paginado — se um dia a base exigir paginação, ela entra como mudança de contrato, não como detalhe de implementação. |

---

## Formato de erro

Toda resposta de erro deve ter este corpo:

```json
{
  "message": "Já existe uma conta com esse nome nessa instituição.",
  "code": "conflict",
  "errors": { "name": "duplicado" }
}
```

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `message` | sim | Frase em português, pronta para ser exibida ao usuário. **É este texto que aparece no toast da tela** — o frontend não traduz nem reescreve mensagem de erro do servidor. |
| `code` | não | Código estável para tratamento programático. Sem ele, o cliente assume `http_error`. |
| `errors` | não | Detalhamento livre (por exemplo, um mapa campo → problema). Fica disponível em `ApiError.details`; hoje nenhuma tela o consome. |

### Status esperados

| Status | `code` sugerido | Quando |
| --- | --- | --- |
| `400` | `bad_request` | Corpo malformado ou parâmetro impossível de interpretar. |
| `404` | `not_found` | Id inexistente numa rota `/{id}`. |
| `409` | `conflict` | A operação é válida mas conflita com o estado atual (duplicidade, exclusão de registro com histórico). |
| `422` | `validation_error` | Corpo bem formado, mas com valor recusado pela regra de negócio. **É o status usado por toda validação deste contrato.** |
| `500` | `server_error` | Falha inesperada. |

> **Sobre as mensagens.** As frases citadas em cada seção são as que o frontend já exibe hoje, vindas
> da camada mockada. Reproduzi-las no backend mantém a experiência idêntica depois da integração.
> Elas terminam em **ponto final**, e não em exclamação: a exclamação é reservada à validação que o
> próprio formulário faz antes de enviar. Um erro vindo do servidor é uma constatação do que
> aconteceu, e um toast com exclamação soa como grito.

O cliente também produz dois erros locais, que o backend não precisa gerar: `timeout` (status `0`,
após 15 s) e `network_error` (status `0`, quando o servidor não responde).

---

## Enums do domínio

Todos os enums viajam como **string minúscula com hífen**, exatamente como listado. O frontend
indexa objetos por esses valores; um valor fora da lista quebra a tela.

| Enum | Valores | Onde aparece |
| --- | --- | --- |
| `TransactionKind` | `income`, `expense`, `transfer` | Lançamentos |
| `TransactionStatus` | `paid`, `pending`, `scheduled` | Lançamentos |
| `PaymentMethod` | `account`, `credit-card`, `pix`, `cash` | Lançamentos |
| `CategoryKind` | `income`, `expense` | Categorias |
| `AccountType` | `checking`, `salary`, `emergency`, `other` | Contas |
| `AccountStatus` | `active`, `inactive` | Contas |
| `CardType` | `credit`, `debit`, `food-voucher`, `meal-voucher` | Cartões |
| `CardStatus` | `active`, `inactive` | Cartões |
| `InvoiceStatus` | `future`, `open`, `closed`, `paid`, `overdue` | Faturas |
| `InstallmentStatus` | `paid`, `current`, `upcoming` | Parcelas |
| `InvestmentClass` | `fixed-income`, `cdb`, `treasury`, `stocks`, `etf`, `funds`, `crypto`, `other` | Investimentos |
| `BudgetStatus` | `safe`, `warning`, `exceeded` | Orçamento |
| `RecurrenceFrequency` | `weekly`, `biweekly`, `monthly`, `bimonthly`, `quarterly`, `semiannual`, `yearly` | Recorrentes |
| `RecurringStatus` | `active`, `paused` | Recorrentes |
| `GoalStatus` | `tracking`, `purchased`, `cancelled` | Metas |
| `GoalInsight` | `first`, `lowest`, `below-average`, `above-average`, `highest`, `stable` | Metas |
| `AlertKind` | `invoice-due`, `bill-due`, `scheduled`, `card-limit` | Avisos |
| `AlertSeverity` | `critical`, `attention`, `info` | Avisos |
| `Trend` | `up`, `down`, `flat` | Variações |

### Objetos reaproveitados

```jsonc
// Delta — variação contra o período anterior
{ "percentage": 12.4, "trend": "up" }   // percentage em pontos percentuais

// Category
{ "id": "cat-moradia", "name": "Moradia", "kind": "expense", "colorToken": 1 }
```

`colorToken` é um inteiro de **1 a 6** que escolhe a cor da categoria nos gráficos. Ele é atributo
da categoria, não da posição dela num ranking: se saísse da ordem, a mesma categoria mudaria de cor
entre uma carga e outra. Duas categorias podem repetir o token; a cor não é identificador.

---

## Dashboard

### `GET /dashboard/summary`

Resumo consolidado da tela inicial. É o endpoint mais pesado do contrato: ele devolve, de uma vez,
os totais do período, as variações contra o período anterior e as quatro séries dos gráficos.

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `from` | `YYYY-MM` | não | Primeiro mês do recorte. |
| `to` | `YYYY-MM` | não | Último mês do recorte, inclusivo. Igual a `from` num recorte de mês único. |

Sem os dois parâmetros, o servidor responde pelo **mês corrente**.

**Resposta `200` — `DashboardSummary`**

```jsonc
{
  "from": "2026-09",
  "to": "2026-09",
  "currentBalance": 32860.95,
  "balanceDelta": { "percentage": 20.2, "trend": "up" },
  "monthIncome": 10545.50,
  "incomeDelta": { "percentage": -41.4, "trend": "down" },
  "monthExpense": 4717.22,
  "expenseDelta": { "percentage": -53.8, "trend": "down" },
  "investmentsTotal": 114442.25,
  "investmentsDelta": { "percentage": 7.8, "trend": "up" },
  "currentInvoice": {
    "total": 2680.10,
    "cardName": "Nova Platinum",
    "dueDate": "2026-10-08",
    "status": "open"
  },
  "balanceHistory": [{ "label": "Abr", "balance": 21980.44 }],
  "cashflow": [{ "label": "Abr", "income": 13100.00, "expense": 8420.30 }],
  "dailySpending": [{ "date": "2026-04-01", "amount": 0 }],
  "spendingByCategory": [
    { "category": { "id": "cat-moradia", "name": "Moradia", "kind": "expense", "colorToken": 1 },
      "amount": 2898.62, "share": 0.61 }
  ],
  "recentTransactions": []
}
```

**Regras**

- **`from` e `to` na resposta ecoam o recorte efetivamente usado.** O frontend rotula os números
  com o que voltou, não com o que pediu: durante a troca de período os valores na tela ainda são
  os do recorte anterior, e "Saldo no fim de Agosto de 2026" sobre o saldo de setembro seria falso.
- **As variações comparam com a janela de mesmo tamanho imediatamente anterior.** Um recorte de
  três meses compara com os três meses anteriores, não com o mês anterior.
- **`currentBalance` é o saldo no fim do recorte**, não o saldo de hoje. Num mês passado, é o saldo
  reconstruído naquela data: parta dos saldos de hoje e desfaça o que entrou e saiu depois. Nessa
  reconstrução, a transferência só pesa quando cruza a fronteira do total — um aporte para uma
  conta com `includeInTotal: false` reduz o saldo visível, enquanto uma transferência entre duas
  contas que somam no total não muda nada.
- **A janela dos gráficos nem sempre é o período.** Num recorte de **mês único**, `balanceHistory`,
  `cashflow` e `dailySpending` trazem **seis meses**: o mês pedido e os cinco anteriores. Um mês
  sozinho não desenha linha nenhuma. Num recorte de vários meses, a janela é o próprio recorte.
  Já `currentBalance`, `monthIncome`, `monthExpense` e `spendingByCategory` respeitam sempre o
  recorte pedido.
- **`label` é o mês abreviado com inicial maiúscula**: `Jan`, `Fev`, `Mar`… O frontend imprime a
  string como veio.
- **`dailySpending` traz todos os dias da janela dos gráficos**, do primeiro ao último, em ordem
  crescente. Dia sem gasto vem com `amount: 0`, e **não** ausente: o calendário precisa desenhar a
  casa vazia, e uma sequência de dias sem gasto é informação, não buraco na série.
- **Transferência não entra em `monthIncome`, `monthExpense` nem `spendingByCategory`.** O dinheiro
  só troca de conta.
- `spendingByCategory` vem ordenado do maior gasto para o menor; `share` é fração de 0 a 1 sobre o
  total de despesas do período.
- `recentTransactions` são os **seis** lançamentos mais recentes do recorte, do mais novo ao mais
  antigo; no empate de data, por descrição. Mesmo formato de `Transaction`.
- `currentInvoice` descreve a fatura em aberto do cartão de crédito de maior fatura. Sem cartão de
  crédito cadastrado, devolva `total: 0` e `cardName` vazio.

---

## Categorias

### `GET /categories`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `kind` | `CategoryKind` | não | Sem ele, devolve todas. |

**Resposta `200` — `Category[]`**

```json
[{ "id": "cat-moradia", "name": "Moradia", "kind": "expense", "colorToken": 1 }]
```

**Regras**

- Receita e despesa **não compartilham categoria**: cada formulário oferece apenas as do seu lado.
  O filtro por `kind` é o que sustenta isso.
- Ordem alfabética por `name`.
- Categoria é hoje um catálogo fixo do servidor. Não há CRUD de categoria no frontend — se um dia
  houver, ele entra como um domínio novo.

---

## Lançamentos (receitas, despesas e transferências)

As três telas (`/lancamentos/receitas`, `/lancamentos/despesas`, `/lancamentos/transferencias`)
usam **o mesmo endpoint**, mudando apenas o parâmetro `kind`. Não crie rotas separadas por tipo.

### `GET /transactions`

**Query** — todos opcionais; combinam-se com **E** lógico.

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `kind` | `TransactionKind` | Tipo do lançamento. |
| `search` | `string` | Casa com descrição, nome da categoria, nome da conta de origem ou de destino. Comparação **sem diferenciar maiúscula nem acento**: quem digita `saude` espera achar `Saúde`. |
| `from` | `YYYY-MM-DD` | Início do período, inclusivo. |
| `to` | `YYYY-MM-DD` | Fim do período, inclusivo. |
| `categoryId` | `string` | Id da categoria. |
| `accountId` | `string` | Casa com a conta de **origem** ou, em transferências, também com a de **destino**. |
| `status` | `TransactionStatus` | Situação. |

> Hoje a tela envia apenas `kind` e refina busca, período, categoria, conta, situação e ordenação
> em memória, para responder a cada tecla sem uma nova ida ao servidor. Os demais parâmetros
> existem no contrato porque são o que a API vai receber quando a base crescer o bastante para a
> filtragem voltar ao servidor — implemente-os desde já.

**Resposta `200` — `Transaction[]`**, do mais recente para o mais antigo.

```jsonc
{
  "id": "tx-1",
  "description": "Salário",
  "amount": 9800.00,
  "kind": "income",
  "status": "paid",
  "method": "account",
  "date": "2026-09-03",
  "category": { "id": "cat-salario", "name": "Salário", "kind": "income", "colorToken": 2 },
  "accountId": "acc-1",
  "accountName": "Conta corrente",
  "toAccountId": null,      // só em transferências
  "toAccountName": null,    // só em transferências
  "notes": "Crédito mensal da folha."
}
```

### `POST /transactions` · `PUT /transactions/{id}`

**Corpo — `TransactionPayload`**

```jsonc
{
  "description": "Supermercado",
  "amount": 728.90,
  "kind": "expense",
  "status": "paid",
  "method": "credit-card",
  "date": "2026-09-02",
  "categoryId": "cat-alimentacao",  // obrigatório fora de transferência
  "accountId": "card-1",
  "toAccountId": null,              // obrigatório em transferência
  "notes": "Compra do mês"
}
```

**Resposta `201` (POST) / `200` (PUT) — `Transaction`**

**Regras e validações**

- **O cliente manda ids; o servidor resolve os nomes.** `accountName`, `toAccountName` e o objeto
  `category` inteiro são preenchidos pelo backend a partir de `accountId`, `toAccountId` e
  `categoryId`. O frontend nunca envia nome.
- `accountId` pode apontar para uma **conta** ou para um **cartão**. Origem de dinheiro é um
  conceito único no produto (veja `GET /accounts/sources`).
- `amount` é sempre positivo.
- **Transferência tem regras próprias:**
  - `category` **deve** vir `null` na resposta, e `categoryId` é ignorado na entrada;
  - `toAccountId` é obrigatório;
  - a conta de destino precisa ser diferente da origem;
  - ela **não entra** em receita, despesa, resultado do período nem gasto por categoria.
- Validações, todas `422 validation_error`:

  | Situação | Mensagem |
  | --- | --- |
  | `accountId` inexistente | `A conta informada não existe.` |
  | `toAccountId` inexistente (transferência) | `A conta de destino informada não existe.` |
  | Destino igual à origem | `A conta de destino precisa ser diferente da origem.` |
  | `categoryId` inexistente fora de transferência | `A categoria informada não existe.` |

- `PUT` com id inexistente: `404` — `Lançamento não encontrado.`

### `DELETE /transactions/{id}`

**Resposta `204`.** Id inexistente: `404` — `Lançamento não encontrado.`

---

## Contas

### `GET /accounts`

**Resposta `200` — `Account[]`**, contas ativas primeiro. A tela não reordena o que chega.

```json
{
  "id": "acc-1",
  "name": "Conta corrente",
  "institution": "Banco Nova",
  "type": "checking",
  "balance": 12480.35,
  "status": "active",
  "includeInTotal": true
}
```

### `GET /accounts/sources`

Contas e cartões na mesma lista, do jeito que os seletores de lançamento precisam.

**Resposta `200` — `PaymentSource[]`**

```json
[{ "id": "acc-1", "name": "Conta corrente", "group": "account" },
 { "id": "card-1", "name": "Nova Platinum", "group": "card" }]
```

**Regras**

- Só entram registros **ativos**. Uma conta encerrada não deve ser oferecida num lançamento novo.
- **O cartão de débito fica de fora**: ele é apenas o meio de acessar a conta, que já está na lista.
  Incluí-lo criaria duas entradas para o mesmo dinheiro.
- Contas primeiro, cartões depois.
- Note que os ids convivem no mesmo espaço: `POST /transactions` aceita qualquer um deles em
  `accountId`. Se os ids de conta e de cartão puderem colidir no banco, prefixe-os (`acc-`, `card-`)
  como os mocks fazem.

### `POST /accounts` · `PUT /accounts/{id}`

**Corpo — `AccountPayload`**: `name`, `institution`, `type`, `balance`, `status`, `includeInTotal`.
Todos obrigatórios.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `name` com menos de 2 caracteres | `422` | `Informe o nome da conta.` |
| `institution` vazia | `422` | `Informe a instituição da conta.` |
| `balance` não numérico | `422` | `Informe um saldo válido.` |
| Mesmo `name` na mesma `institution` | `409` | `Já existe uma conta com esse nome nessa instituição.` |
| Id inexistente (`PUT`) | `404` | `Conta não encontrada.` |

Saldo negativo é aceito: conta no vermelho existe.

### `DELETE /accounts/{id}`

**Resposta `204`.**

**Regra — excluir não apaga histórico.** Se a conta tiver qualquer lançamento (como origem **ou**
como destino de transferência), responda `409 conflict` com a mensagem, no plural correto:

> `Esta conta tem 42 lançamentos no histórico. Marque-a como inativa para tirá-la do saldo sem apagar o passado.`

Conta inativa sai do saldo total e dos seletores, mas o passado continua legível. É por isso que
`Account` tem `status`.

---

## Cartões

### `GET /cards`

**Resposta `200` — `Card[]`**, crédito primeiro, depois débito e vales. A tela separa os dois grupos por `type`, mas não reordena dentro de cada um.

```jsonc
{
  "id": "card-1",
  "name": "Nova Platinum",
  "institution": "Banco Nova",
  "type": "credit",
  "status": "active",
  "brand": "Mastercard",       // opcional
  "lastDigits": "4417",        // opcional, exatamente 4 dígitos
  "limit": 20000.00,           // crédito
  "used": 10265.26,            // crédito — calculado pelo servidor
  "closingDay": 28,            // crédito, 1 a 31
  "dueDay": 8,                 // crédito, 1 a 31
  "accountId": null,           // débito
  "accountName": null,         // débito — resolvido pelo servidor
  "balance": null              // vales
}
```

**Regras**

- **Um cadastro para os quatro tipos.** Os campos específicos são opcionais porque nenhum tipo usa
  todos: crédito tem limite e datas de fatura, débito aponta para a conta que acessa e os vales
  carregam saldo próprio. Devolva `null`/ausente para o que não se aplica ao tipo — **não** devolva
  zero, que a tela leria como limite de R$ 0,00.
- **`used` é calculado, nunca armazenado.** Ele é a **soma das faturas ainda não pagas, incluindo
  as futuras** — as parcelas já comprometidas contam. É o único número que responde "quanto ainda
  posso gastar" sem esconder doze parcelas assumidas. Guardar o valor à mão faria a barra de limite
  mentir na primeira compra parcelada. O cliente nunca envia este campo.
- `accountName` é resolvido pelo servidor a partir de `accountId`.

### `POST /cards` · `PUT /cards/{id}`

**Corpo — `CardPayload`**: `name`, `institution`, `type`, `status` e, conforme o tipo, `brand`,
`lastDigits`, `limit`, `closingDay`, `dueDay`, `accountId`, `balance`.

**Regra importante:** o formulário envia **apenas os campos do tipo escolhido**. Ao trocar um cartão
de crédito para vale-refeição, `limit`, `closingDay` e `dueDay` deixam de ser enviados — o backend
precisa **limpar** esses campos, e não preservar o valor anterior.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `name` com menos de 2 caracteres | `422` | `Informe o nome do cartão.` |
| `institution` vazia | `422` | `Informe a instituição do cartão.` |
| `lastDigits` presente e diferente de 4 dígitos | `422` | `Os últimos dígitos precisam ser quatro números.` |
| Crédito sem `limit` ou com limite ≤ 0 | `422` | `Informe o limite do cartão.` |
| Crédito com `closingDay` fora de 1–31 | `422` | `Informe um dia de fechamento entre 1 e 31.` |
| Crédito com `dueDay` fora de 1–31 | `422` | `Informe um dia de vencimento entre 1 e 31.` |
| Débito sem `accountId` válido | `422` | `Escolha a conta vinculada ao cartão de débito.` |
| Vale com `balance` não numérico | `422` | `Informe um saldo válido para o cartão.` |
| Id inexistente (`PUT`) | `404` | `Cartão não encontrado.` |

### `DELETE /cards/{id}`

**Resposta `204`.** Mesma regra das contas: cartão com lançamentos **ou** com compra parcelada
responde `409 conflict`:

> `Este cartão tem 18 registros no histórico. Marque-o como inativo para tirá-lo dos lançamentos sem apagar o passado.`

---

## Faturas

Fatura **não é cadastro: é leitura calculada**. Não existe `POST`, `PUT` nem `DELETE` aqui, e o
frontend nunca envia uma fatura.

### `GET /invoices`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `cardId` | `string` | não | Sem ele, devolve as faturas de **todos** os cartões de crédito. |

**Resposta `200` — `Invoice[]`**, por `dueDate` crescente e, no empate, por `cardName`.

```jsonc
{
  "id": "inv-card-1-2026-09",
  "cardId": "card-1",
  "cardName": "Nova Platinum",
  "month": "2026-09",
  "total": 3385.16,
  "status": "open",
  "closingDate": "2026-09-28",
  "dueDate": "2026-10-08",
  "itemCount": 12,
  "previousTotal": 2980.44   // opcional
}
```

### `GET /invoices/{id}`

**Resposta `200` — `InvoiceDetail`**: todos os campos de `Invoice` mais `items`.

```jsonc
{
  "id": "inv-card-1-2026-09",
  "…": "campos de Invoice",
  "items": [
    {
      "id": "tx-12",
      "description": "Supermercado",
      "date": "2026-09-02",
      "amount": 728.90,
      "category": { "id": "cat-alimentacao", "name": "Alimentação", "kind": "expense", "colorToken": 4 },
      "installment": { "number": 3, "total": 12, "purchaseId": "inst-2" }
    }
  ]
}
```

`installment` só aparece quando o item é parcela de uma compra parcelada. `items` vem do mais
recente para o mais antigo. Id inexistente: `404` — `Fatura não encontrada.`

**Como a fatura é montada** — esta é a regra central do domínio:

1. A fatura de um cartão num mês reúne **as despesas lançadas naquele cartão** mais **as parcelas
   das compras parceladas** que caem naquele ciclo.
2. O **ciclo** vai do fechamento do mês anterior (**exclusivo**) até o fechamento deste mês
   (**inclusivo**).
3. O **vencimento** cai no mês seguinte ao fechamento quando `dueDay <= closingDay`; caso
   contrário, no mesmo mês.
4. `status` é derivado da data de hoje:
   - `future` — o ciclo ainda nem começou (a fatura só existe porque há parcelas comprometidas);
   - `open` — o ciclo está em andamento e ainda aceita compras;
   - `closed` — o ciclo fechou e o vencimento ainda não chegou;
   - `overdue` — passou do vencimento;
   - `paid` — quitada.
5. `previousTotal` é o total da fatura anterior **do mesmo cartão**, quando existe. Nem sempre é o
   mês imediatamente anterior: um mês sem nenhuma compra não gera fatura.
6. Um mês sem compras e sem parcelas **não gera fatura** — não devolva fatura de total zero.

> **Fora de escopo hoje:** não há pagamento de fatura nem registro de quitação. O frontend trata a
> fatura vencida como paga. Se o backend passar a controlar quitação, o campo `status` já suporta
> `paid` e nada mais precisa mudar no contrato.

---

## Compras parceladas

### `GET /installments`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `cardId` | `string` | não | Sem ele, devolve as compras de todos os cartões. |

**Resposta `200` — `InstallmentPlan[]`**: as compras em andamento primeiro, da mais recente para a
mais antiga, e as já quitadas ao fim. O servidor devolve a compra **já com o cronograma e os totais
calculados**:

```jsonc
{
  "purchase": {
    "id": "inst-1",
    "description": "Notebook",
    "totalAmount": 6000.00,
    "count": 12,
    "purchaseDate": "2026-03-14",
    "firstMonth": "2026-04",
    "cardId": "card-1",
    "cardName": "Nova Platinum",
    "category": { "id": "cat-outros", "name": "Outros", "kind": "expense", "colorToken": 6 },
    "notes": null
  },
  "installmentAmount": 500.00,
  "paidCount": 6,
  "remainingCount": 6,
  "paidAmount": 3000.00,
  "remainingAmount": 3000.00,
  "current": { "number": 7, "month": "2026-10", "dueDate": "2026-11-08", "amount": 500.00, "status": "current" },
  "schedule": [
    { "number": 1, "month": "2026-04", "dueDate": "2026-05-08", "amount": 500.00, "status": "paid" }
  ]
}
```

### `POST /installments` · `PUT /installments/{id}`

**Corpo — `InstallmentPayload`**: `description`, `totalAmount`, `count`, `purchaseDate`,
`firstMonth`, `cardId`, `categoryId` (opcional), `notes` (opcional).

**Resposta `201` / `200` — `InstallmentPurchase`** (a compra crua, sem o plano calculado).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `description` com menos de 2 caracteres | `422` | `Informe a descrição da compra.` |
| `totalAmount` ≤ 0 | `422` | `Informe o valor total da compra.` |
| `count` fora de 2–48 | `422` | `O parcelamento precisa ter de 2 a 48 parcelas.` |
| `firstMonth` ausente ou fora de `YYYY-MM` | `422` | `Informe o mês da primeira parcela.` |
| `cardId` inexistente | `422` | `O cartão informado não existe.` |
| Cartão que não é de crédito | `422` | `Só cartões de crédito aceitam compras parceladas.` |
| Id inexistente (`PUT`) | `404` | `Compra parcelada não encontrada.` |

### `DELETE /installments/{id}`

**Resposta `204`.**

**Regras do cálculo**

- **As parcelas não são lançamentos.** Elas vivem na compra parcelada e entram nas faturas pelo
  cálculo. Gravar doze cópias de cada compra na tabela de lançamentos deixaria a listagem ilegível
  e o resultado do período errado, já que quem sai da conta é a fatura, não a parcela.
- **A última parcela absorve a sobra.** As primeiras levam o valor arredondado para baixo em duas
  casas; a última recebe a diferença, para a soma fechar **exatamente** com `totalAmount`. Por isso
  `installmentAmount` é o valor típico, e uma parcela do `schedule` pode diferir dele.
- `status` de cada parcela sai da comparação do `dueDate` com hoje: `paid` no passado, `current` na
  vigente, `upcoming` no futuro.
- `current` vem `null` quando a compra já foi quitada.
- Uma compra cadastrada agora precisa aparecer **na fatura, no `used` do cartão e no cronograma**
  sem nenhum ajuste manual.

---

## Investimentos

### `GET /investments`

Lista crua, usada pelo formulário de edição.

**Resposta `200` — `Investment[]`**

```jsonc
{
  "id": "inv-1",
  "name": "Tesouro Selic 2029",
  "assetClass": "treasury",
  "institution": "Meridiano Investimentos",
  "invested": 20000.00,
  "currentValue": 22480.15,
  "startDate": "2024-06-10",
  "notes": null
}
```

### `GET /investments/portfolio`

Carteira consolidada — é o que a tela mostra.

**Resposta `200` — `PortfolioSummary`**

```jsonc
{
  "invested": 106000.00,
  "currentValue": 114442.25,
  "profit": 8442.25,
  "profitability": 0.0796,                                  // fração
  "valueDelta": { "percentage": 1.4, "trend": "up" },
  "allocation": [
    { "assetClass": "treasury", "invested": 20000.00, "currentValue": 22480.15,
      "profit": 2480.15, "share": 0.196, "count": 2 }
  ],
  "history": [
    { "label": "Abr", "month": "2026-04", "invested": 92000.00, "value": 98120.44 }
  ],
  "positions": [
    { "investment": { "…": "Investment" }, "profit": 2480.15, "profitability": 0.124, "share": 0.196 }
  ]
}
```

**Regras**

- `profitability` e `share` são **frações de 0 a 1**; `valueDelta.percentage` é ponto percentual.
- `allocation` traz uma entrada por classe **com posição**, do maior `currentValue` para o menor.
  Classe sem posição não aparece.
- `history` cobre os **doze** meses até o mês corrente, do mais antigo ao mais recente, e o último
  ponto tem de fechar **exatamente** com `currentValue`.
- **`startDate` não é enfeite.** Sem uma série real de aportes, a curva de `invested` distribui os
  aportes linearmente entre a data do primeiro aporte da carteira e hoje. É a suposição mais honesta
  disponível, e a única que faz a curva chegar em hoje valendo o que o cadastro diz.
- `positions` vem do maior `currentValue` para o menor.

### `POST /investments` · `PUT /investments/{id}` · `DELETE /investments/{id}`

**Corpo — `InvestmentPayload`**: `name`, `assetClass`, `institution`, `invested`, `currentValue`,
`startDate`, `notes` (opcional).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `name` com menos de 2 caracteres | `422` | `Informe o nome do investimento.` |
| `institution` vazia | `422` | `Informe a instituição onde o dinheiro está aplicado.` |
| `invested` ≤ 0 | `422` | `Informe quanto já foi aportado.` |
| `currentValue` < 0 | `422` | `Informe quanto a posição vale hoje.` |
| `startDate` ausente | `422` | `Informe a data do primeiro aporte.` |
| `startDate` no futuro | `422` | `A data do primeiro aporte não pode estar no futuro.` |
| Id inexistente | `404` | `Investimento não encontrado.` |

`currentValue` menor que `invested` é aceito: posição no prejuízo existe.

> **Fora de escopo hoje:** não há histórico de cotação por ativo. A evolução do patrimônio é
> reconstruída a partir do valor atual e da idade da posição. Se o backend passar a guardar a série
> real, `history` continua com o mesmo formato — muda só a qualidade do dado.

---

## Orçamento

### `GET /budgets/overview`

O frontend **não lista orçamentos crus**: ele lê os limites de dentro deste consolidado. Não é
preciso expor um `GET /budgets`.

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `month` | `YYYY-MM` | não | Sem ele, o mês corrente. |

**Resposta `200` — `BudgetOverview`**

```jsonc
{
  "month": "2026-09",
  "planned": 7300.00,
  "spent": 4268.60,
  "remaining": 3031.40,
  "ratio": 0.585,
  "daysLeft": 26,
  "daysElapsed": 4,
  "daysInMonth": 30,
  "items": [
    {
      "budget": { "id": "bud-1",
                  "category": { "id": "cat-alimentacao", "name": "Alimentação", "kind": "expense", "colorToken": 4 },
                  "limit": 1400.00 },
      "spent": 1419.70,
      "remaining": -19.70,
      "ratio": 1.014,
      "projected": 0,
      "status": "exceeded"
    }
  ],
  "unplanned": [
    { "category": { "id": "cat-outros", "name": "Outros", "kind": "expense", "colorToken": 6 },
      "amount": 398.90, "share": 0.09 }
  ]
}
```

**Regras**

- **O orçamento é recorrente e não tem mês.** Um limite guarda categoria e valor, e vale de um mês
  para o outro até ser alterado. **Não** crie uma linha por mês: isso obrigaria a redigitar o mesmo
  número doze vezes por ano e deixaria todo mês seguinte começando sem orçamento. O consumo, esse
  sim, é apurado por mês.
- `ratio` é fração e **passa de 1 no estouro** — não o limite a 1.
- `remaining` fica **negativo** quando estourou.
- `status` sai do `ratio`: `safe` abaixo de 0,8, `warning` de 0,8 (inclusive) a 1, `exceeded` de 1
  (inclusive) em diante. A faixa de atenção começa em 80% porque é o ponto em que ainda dá para
  mudar de ideia — avisar em 95% é avisar quando o mês já acabou.
- **`projected` tem piso.** Ele é onde o gasto chega no fim do mês mantido o ritmo atual, mas só é
  calculado a partir do **décimo dia** (`daysElapsed >= 10`). Antes disso, devolva `0` e a tela não
  projeta nada. Extrapolar linearmente o dia 4 multiplica por sete um aluguel que acontece uma vez
  no mês, e "no ritmo atual, R$ 21.700 de moradia" não é um aviso, é um erro de leitura.
- **`unplanned` não é detalhe.** São as categorias com gasto no mês e sem limite definido. Sem elas,
  a soma dos limites seria lida como o gasto total do mês, e não é.
- `items` vem do maior `ratio` para o menor: a tela abre no que exige decisão, não na ordem em que
  os limites foram cadastrados.
- Num mês passado, `daysLeft` é `0` e `daysElapsed` é `daysInMonth`.

### `POST /budgets` · `PUT /budgets/{id}` · `DELETE /budgets/{id}`

**Corpo — `BudgetPayload`**: `categoryId`, `limit`.

**Resposta `201` / `200` — `Budget`** (`id`, `category` resolvida, `limit`).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `categoryId` inexistente | `422` | `Escolha a categoria do orçamento.` |
| Categoria de receita | `422` | `Só categorias de despesa aceitam orçamento.` |
| `limit` ≤ 0 | `422` | `Informe um limite maior que zero.` |
| Categoria já orçada | `409` | `Já existe um orçamento para Alimentação. Edite o limite existente em vez de criar outro.` |
| Id inexistente | `404` | `Orçamento não encontrado.` |

**Uma categoria tem no máximo um limite.** O formulário já nem oferece as categorias orçadas, mas a
regra precisa existir no servidor.

---

## Despesas recorrentes

### `GET /recurring-expenses`

Devolve a lista **já consolidada** — note que a resposta é um objeto, não um array.

**Resposta `200` — `RecurringSummary`**

```jsonc
{
  "items": [
    {
      "id": "rec-1",
      "description": "Aluguel",
      "amount": 2450.00,
      "category": { "id": "cat-moradia", "name": "Moradia", "kind": "expense", "colorToken": 1 },
      "frequency": "monthly",
      "nextDueDate": "2026-09-05",
      "accountId": "acc-1",
      "accountName": "Conta corrente",
      "status": "active",
      "notes": null
    }
  ],
  "monthlyCost": 4602.80,
  "yearlyCost": 55233.60,
  "dueSoon": []
}
```

**Regras**

- **A recorrência é normalizada para o mês** em `monthlyCost`: a anual entra dividida por doze, a
  semestral por seis, a semanal multiplicada por **4,3452** — a média real de semanas num mês. Sem
  isso, somar assinatura mensal com seguro anual daria um número que não corresponde a mês nenhum.
- `monthlyCost` e `yearlyCost` contam **apenas as ativas**. Pausada continua no cadastro, sai do
  custo e volta com um clique.
- `dueSoon` traz as ativas que vencem nos próximos **7 dias**, da mais próxima em diante.
- `items` vem ordenado pelo `nextDueDate` crescente, com as pausadas ao fim.

### `POST /recurring-expenses` · `PUT /recurring-expenses/{id}` · `DELETE /recurring-expenses/{id}`

**Corpo — `RecurringPayload`**: `description`, `amount`, `categoryId` (opcional), `frequency`,
`nextDueDate`, `accountId`, `status`, `notes` (opcional).

**Resposta `201` / `200` — `RecurringExpense`.** `accountName` e `category` são resolvidos pelo
servidor; `accountId` pode ser conta **ou** cartão.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `description` com menos de 2 caracteres | `422` | `Informe a descrição da despesa.` |
| `amount` ≤ 0 | `422` | `Informe um valor maior que zero.` |
| `nextDueDate` ausente | `422` | `Informe a data do próximo vencimento.` |
| `accountId` inexistente | `422` | `Escolha a conta ou o cartão que paga esta despesa.` |
| `categoryId` que não seja de despesa | `422` | `Escolha uma categoria de despesa.` |
| Id inexistente | `404` | `Despesa recorrente não encontrada.` |

**Pausar é o `PUT` com `status: "paused"`** — não há endpoint próprio. A tela envia o mesmo payload
com o status trocado.

---

## Metas e desejos

O domínio tem uma regra que vale mais do que todas as outras: **registrar um preço novo nunca
sobrescreve o anterior**. Sem a série completa, a tela perde menor preço, média, variação e gráfico
— sobra o último número digitado, que qualquer campo de texto já daria. É por isso que a edição não
carrega preço e o registro tem rota própria.

### `GET /goals`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `status` | `GoalStatus` | não | Situação. |
| `search` | `string` | não | Casa com nome e observação, **ignorando acento e caixa**. |

> Como em lançamentos, a tela hoje filtra e ordena em memória; os parâmetros existem porque são o
> que a API receberá quando a lista crescer.

**Resposta `200` — `GoalsSummary`**

```jsonc
{
  "items": [
    {
      "goal": {
        "id": "goal-1",
        "name": "Notebook Dell Inspiron 15",
        "url": "https://dell.com/…",
        "imageUrl": null,
        "status": "tracking",
        "notes": null,
        "createdAt": "2026-05-02",
        "history": [
          { "id": "gp-1", "date": "2026-05-02", "price": 4299.00, "note": null },
          { "id": "gp-2", "date": "2026-08-31", "price": 4499.00, "note": "Sem cupom" }
        ]
      },
      "analysis": {
        "initialPrice": 4299.00,
        "currentPrice": 4499.00,
        "lowestPrice": 4180.00,
        "highestPrice": 4620.00,
        "averagePrice": 4380.50,
        "change": 200.00,
        "changePercentage": 4.65,
        "trend": "up",
        "savings": 121.00,
        "lastUpdate": "2026-08-31",
        "entryCount": 5,
        "insight": "above-average"
      }
    }
  ],
  "trackingCount": 5,
  "purchasedCount": 1,
  "currentTotal": 14045.90,
  "initialTotal": 13886.90,
  "totalChange": 159.00,
  "totalSavings": 841.00
}
```

**Regras**

- `history` vem em **ordem cronológica crescente** e **nunca vazio**: o cadastro grava o primeiro
  preço junto.
- `analysis` é conta de servidor:
  - `initialPrice` é o preço do **primeiro** registro; é a referência de toda a variação;
  - `change` = `currentPrice − initialPrice`; `changePercentage` é ponto percentual sobre o inicial;
  - `savings` = `highestPrice − currentPrice`, **nunca negativo**;
  - `trend` é `flat` quando a variação fica dentro de **0,5%** do preço inicial;
  - `entryCount` é o tamanho do histórico.
- **`insight` é a leitura do momento**, e o texto de cada caso vive no frontend — a API devolve só o
  código. A regra de escolha, na ordem:
  1. `first` quando `entryCount < 2`. **Uma meta com um registro só não tem variação**: afirmar
     estabilidade sobre uma única observação seria falso.
  2. `stable` quando a faixa inteira (`highestPrice − lowestPrice`) é menor que um centavo.
  3. Calcule a posição do preço atual dentro da faixa,
     `(currentPrice − lowestPrice) / (highestPrice − lowestPrice)`: até **0,05** é `lowest`, a
     partir de **0,95** é `highest`.
  4. Fora dos extremos, compare com `averagePrice`: `below-average` ou `above-average`.

  A média sozinha não bastaria: numa série que desceu de 900 para 750 e voltou a 780, "abaixo da
  média" é verdade e ainda assim esconde que o fundo foi bem mais baixo. Por isso a posição na faixa
  vem antes.
- **Os totais olham só as metas em acompanhamento.** Somar no custo da lista o que já foi comprado
  ou cancelado daria um número que não corresponde a decisão nenhuma. `purchasedCount` conta as
  compradas apenas para o rótulo auxiliar.
- `items` vem ordenado pelo `lastUpdate` decrescente: a tela abre no que acabou de mudar.

### `POST /goals`

**Corpo — `GoalPayload`**: `name`, `url` (opcional), `imageUrl` (opcional), `price`, `date`,
`status`, `notes` (opcional).

O cadastro **leva o primeiro preço junto** porque uma meta sem registro não teria preço atual para
mostrar: cadastrar é, ao mesmo tempo, a primeira consulta. `createdAt` recebe a `date` enviada.

**Resposta `201` — `Goal`.**

### `PUT /goals/{id}`

**Corpo — `GoalUpdatePayload`**: `name`, `url` (opcional), `imageUrl` (opcional), `status`,
`notes` (opcional).

**A edição não mexe em preço.** Corrigir o valor por aqui apagaria um ponto do histórico; preço novo
é sempre um registro novo. `createdAt` e `history` são preservados.

**Resposta `200` — `Goal`.**

### `POST /goals/{id}/prices`

Acrescenta um preço ao histórico. **Nunca substitui o anterior.**

**Corpo — `GoalPricePayload`**: `price`, `date`, `note` (opcional).

**Resposta `201` — `Goal`** com a série já atualizada. O frontend recarrega a lista a partir disso;
devolver só o registro criado não bastaria, porque a tela precisa da análise recalculada.

### `DELETE /goals/{id}`

**Resposta `204`.** Apaga a meta **e todo o histórico dela** — é a única operação destrutiva do
domínio, e a tela já pede confirmação.

### Validações de metas

| Situação | Status | Mensagem |
| --- | --- | --- |
| `name` com menos de 2 caracteres | `422` | `Informe o nome do produto.` |
| `url` que não comece com `http://` ou `https://` | `422` | `Informe um link do produto começando com http:// ou https://.` |
| `imageUrl` que não comece com `http://` ou `https://` | `422` | `Informe um link da imagem começando com http:// ou https://.` |
| `price` ≤ 0 ou não numérico | `422` | `Informe um preço maior que zero.` |
| `date` ausente | `422` | `Informe a data do registro.` |
| `date` no futuro | `422` | `A data do registro não pode estar no futuro.` |
| `date` anterior ao `createdAt` da meta | `422` | `A data do registro não pode ser anterior ao primeiro preço.` |
| Mesmo preço na mesma data | `409` | `Já existe um registro com esse preço nesta data.` |
| Id inexistente | `404` | `Meta não encontrada.` |

Duas justificativas que valem o registro: um preço consultado no futuro não foi consultado — a série
perderia o sentido de "o que eu vi, e quando"; e um registro anterior ao primeiro trocaria
silenciosamente o preço inicial, que é a referência de toda a variação mostrada na tela.

> **Não há scraping nem atualização automática de preço.** Todo valor é digitado por quem consultou.
> O `url` só serve para a tela abrir a página do produto numa aba nova — o backend nunca deve
> acessá-lo.

---

## Previsão financeira

### `GET /forecast`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `months` | `number` | não | Horizonte projetado. Padrão **6**. |

**Resposta `200` — `ForecastSummary`**

```jsonc
{
  "startingBalance": 32860.95,
  "months": [
    {
      "month": "2026-10",
      "label": "Out",
      "income": 13825.81,
      "recurring": 4209.80,
      "installments": 1710.00,
      "variable": 6695.24,
      "expense": 12615.04,
      "net": 1210.77,
      "endingBalance": 34071.72
    }
  ],
  "endingBalance": 39917.57,
  "averageNet": 1176.10,
  "lowest": { "month": "2026-10", "balance": 34071.72 }
}
```

**Regras**

- **A projeção começa no mês que vem.** Metade do mês corrente já aconteceu: somar realizado com
  previsto na mesma linha produziria um número que não é nem um nem outro, e o dashboard já responde
  pelo mês em curso. O saldo de partida, esse sim, é o de hoje.
- `income` é a média de receita dos **três meses fechados** anteriores.
- `recurring` usa a ocorrência **no mês exato**, não a média mensal: o seguro anual do carro entra
  inteiro no mês em que vence, e não como um doze avos em cada mês.
- `installments` soma as parcelas que caem nas faturas do mês.
- **`variable` é um resto, não uma média solta**: é a média de despesa dos três meses fechados
  **menos** as recorrentes e as parcelas médias do mesmo período. Sem esse desconto, aluguel e
  parcelas apareceriam duas vezes — uma na sua linha, outra dentro da média — e a projeção ficaria
  pessimista o bastante para não servir para nada.
- `expense` = `recurring + installments + variable`; `net` = `income − expense`.
- `endingBalance` de cada mês acumula sobre o anterior, partindo de `startingBalance`.
- `lowest` aponta o mês de menor `endingBalance` — é o que a tela existe para antecipar.
- `label` é o mês abreviado com inicial maiúscula.

---

## Relatórios

### `GET /reports/summary`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `from` | `YYYY-MM-DD` | sim | Início do recorte, inclusivo. |
| `to` | `YYYY-MM-DD` | sim | Fim do recorte, inclusivo. |

**Relatório se pede por dia, não por mês**: "últimos 7 dias" e "de 12/03 a 04/05" não cabem numa
chave `YYYY-MM`. Todo atalho da tela termina hoje.

**Resposta `200` — `ReportSummary`**

```jsonc
{
  "from": "2026-09-01",
  "to": "2026-09-04",
  "income": 9800.00,
  "expense": 4268.60,
  "net": 5531.40,
  "incomeDelta": { "percentage": 206.3, "trend": "up" },
  "expenseDelta": { "percentage": 314.3, "trend": "up" },
  "transactionCount": 7,
  "expenseByCategory": [],
  "incomeByCategory": [],
  "cashflow": [{ "label": "01/09", "income": 0, "expense": 690.80 }],
  "expenseBySource": [
    { "id": "acc-1", "name": "Conta corrente", "group": "account", "amount": 2450.00, "share": 0.57 }
  ],
  "balanceHistory": [{ "label": "01/09", "balance": 27329.55 }],
  "netWorth": [
    { "month": "2026-04", "label": "Abr", "accounts": 21980.44, "investments": 98120.44, "total": 120100.88 }
  ]
}
```

**Regras**

- **As variações comparam com o intervalo de mesma duração imediatamente anterior.**
- `transactionCount` conta receitas e despesas; **transferência fica de fora**.
- **O agrupamento de `cashflow` e `balanceHistory` segue a duração do recorte:**

  | Duração | Balde | `label` |
  | --- | --- | --- |
  | até 10 dias | por dia | `01/09` |
  | 11 a 45 dias | por semana (rótulo é o primeiro dia) | `08/09` |
  | acima de 45 dias | por mês | `Set` |

  Uma semana em baldes semanais viraria uma barra sozinha; um ano em baldes diários, trezentas e
  sessenta.
- `balanceHistory` traz o saldo no **último dia de cada balde**.
- **`expenseBySource` é o gasto por origem do dinheiro** — conta ou cartão. Transferência fica de
  fora: ela sai de uma conta e entra em outra, então contaria como gasto de uma conta que não
  gastou. `share` é fração do total de despesas do recorte, e a lista vem do maior para o menor.
- **`netWorth` separa o patrimônio em conta e investimento.** Somados dão o total, mas a divisão é a
  informação: um total estável pode esconder dinheiro migrando de um lado para o outro. A série
  cobre no mínimo **seis** meses, mesmo num recorte curto — um mês sozinho não mostra evolução de
  patrimônio nenhuma.
- Recorte sem nenhum lançamento devolve `200` com `transactionCount: 0` e as listas vazias; a tela
  já tem estado próprio para isso. **Não responda `404`.**

> **Fora de escopo hoje:** exportação de relatório em PDF ou CSV.

---

## Avisos

### `GET /alerts`

**Resposta `200` — `Alert[]`**

```jsonc
{
  "id": "alert-invoice-card-1",
  "kind": "invoice-due",
  "severity": "attention",
  "title": "Fatura Nova Platinum",
  "description": "Fatura vence em 4 dias",
  "date": "2026-09-08",
  "amount": 3385.16,
  "to": "/faturas"
}
```

**Regras**

- **Os avisos são derivados, não cadastrados.** Eles saem dos mesmos dados que abastecem as telas:
  - `invoice-due` — faturas a vencer;
  - `bill-due` — lançamentos pendentes dentro de 15 dias;
  - `scheduled` — lançamentos agendados dentro de 15 dias;
  - `card-limit` — cartões acima de **70%** do limite comprometido.
- `severity` gradua a urgência: `critical` para o que vence hoje ou já venceu — e, no caso do
  limite, para o cartão acima de **90%** —, `attention` para o que está próximo, `info` para o resto.
  O ponto no sino do header conta apenas o que **não** é `info`.
- `to` é uma rota do frontend (`/faturas`, `/lancamentos`, `/cartoes`). O backend precisa conhecer
  esses caminhos ou deixar o campo ausente — sem ele, o aviso vira uma linha não clicável, e a tela
  continua funcionando.
- Ordem: por severidade (`critical`, `attention`, `info`) e, dentro de cada nível, por data
  crescente.

---

## Resumo dos endpoints

| # | Método | URL | Resposta | Domínio |
| --- | --- | --- | --- | --- |
| 1 | `GET` | `/dashboard/summary?from&to` | `DashboardSummary` | Dashboard |
| 2 | `GET` | `/categories?kind` | `Category[]` | Categorias |
| 3 | `GET` | `/transactions?kind&search&from&to&categoryId&accountId&status` | `Transaction[]` | Lançamentos |
| 4 | `POST` | `/transactions` | `Transaction` | Lançamentos |
| 5 | `PUT` | `/transactions/{id}` | `Transaction` | Lançamentos |
| 6 | `DELETE` | `/transactions/{id}` | `204` | Lançamentos |
| 7 | `GET` | `/accounts` | `Account[]` | Contas |
| 8 | `GET` | `/accounts/sources` | `PaymentSource[]` | Contas |
| 9 | `POST` | `/accounts` | `Account` | Contas |
| 10 | `PUT` | `/accounts/{id}` | `Account` | Contas |
| 11 | `DELETE` | `/accounts/{id}` | `204` | Contas |
| 12 | `GET` | `/cards` | `Card[]` | Cartões |
| 13 | `POST` | `/cards` | `Card` | Cartões |
| 14 | `PUT` | `/cards/{id}` | `Card` | Cartões |
| 15 | `DELETE` | `/cards/{id}` | `204` | Cartões |
| 16 | `GET` | `/invoices?cardId` | `Invoice[]` | Faturas |
| 17 | `GET` | `/invoices/{id}` | `InvoiceDetail` | Faturas |
| 18 | `GET` | `/installments?cardId` | `InstallmentPlan[]` | Parcelas |
| 19 | `POST` | `/installments` | `InstallmentPurchase` | Parcelas |
| 20 | `PUT` | `/installments/{id}` | `InstallmentPurchase` | Parcelas |
| 21 | `DELETE` | `/installments/{id}` | `204` | Parcelas |
| 22 | `GET` | `/investments` | `Investment[]` | Investimentos |
| 23 | `GET` | `/investments/portfolio` | `PortfolioSummary` | Investimentos |
| 24 | `POST` | `/investments` | `Investment` | Investimentos |
| 25 | `PUT` | `/investments/{id}` | `Investment` | Investimentos |
| 26 | `DELETE` | `/investments/{id}` | `204` | Investimentos |
| 27 | `GET` | `/budgets/overview?month` | `BudgetOverview` | Orçamento |
| 28 | `POST` | `/budgets` | `Budget` | Orçamento |
| 29 | `PUT` | `/budgets/{id}` | `Budget` | Orçamento |
| 30 | `DELETE` | `/budgets/{id}` | `204` | Orçamento |
| 31 | `GET` | `/recurring-expenses` | `RecurringSummary` | Recorrentes |
| 32 | `POST` | `/recurring-expenses` | `RecurringExpense` | Recorrentes |
| 33 | `PUT` | `/recurring-expenses/{id}` | `RecurringExpense` | Recorrentes |
| 34 | `DELETE` | `/recurring-expenses/{id}` | `204` | Recorrentes |
| 35 | `GET` | `/goals?status&search` | `GoalsSummary` | Metas |
| 36 | `POST` | `/goals` | `Goal` | Metas |
| 37 | `PUT` | `/goals/{id}` | `Goal` | Metas |
| 38 | `POST` | `/goals/{id}/prices` | `Goal` | Metas |
| 39 | `DELETE` | `/goals/{id}` | `204` | Metas |
| 40 | `GET` | `/forecast?months` | `ForecastSummary` | Previsão |
| 41 | `GET` | `/reports/summary?from&to` | `ReportSummary` | Relatórios |
| 42 | `GET` | `/alerts` | `Alert[]` | Avisos |

---

## O que o backend precisa calcular

Nem tudo aqui é CRUD. Estes são os pontos em que o servidor **calcula** e o frontend apenas
apresenta — é onde mora o trabalho real da implementação, e é o que separa este contrato de uma
API gerada automaticamente a partir das tabelas.

| Cálculo | Endpoint | Por quê |
| --- | --- | --- |
| Fatura a partir de despesas e parcelas | `/invoices` | Fatura não é cadastro. O ciclo vai do fechamento anterior (exclusivo) ao deste mês (inclusivo). |
| `used` do cartão | `/cards` | Soma das faturas não pagas, **incluindo as futuras**. Guardar o valor faria a barra de limite mentir na primeira compra parcelada. |
| Cronograma de parcelas | `/installments` | A última parcela absorve o arredondamento, para fechar exatamente com o total. |
| Saldo reconstruído numa data passada | `/dashboard/summary`, `/reports/summary` | Parte dos saldos de hoje e desfaz o que entrou e saiu depois. |
| Variação contra a janela anterior | `/dashboard/summary`, `/reports/summary`, `/investments/portfolio` | Sempre a janela de **mesmo tamanho** imediatamente anterior. |
| Distribuição, rentabilidade e evolução da carteira | `/investments/portfolio` | A curva de aportes se apoia em `startDate`. |
| Consumo e projeção de ritmo do orçamento | `/budgets/overview` | Projeção só a partir do décimo dia do mês. |
| Custo mensal equivalente das recorrentes | `/recurring-expenses` | A anual entra dividida por doze; a semanal, multiplicada por 4,3452. |
| Análise e insight de uma meta | `/goals` | Posição na faixa antes da média; `first` quando há um registro só. |
| Projeção de saldo | `/forecast` | O gasto variável é um resto: média menos recorrentes menos parcelas. |
| Agrupamento em baldes | `/reports/summary` | Dia, semana ou mês conforme a duração do recorte. |
| Derivação dos avisos | `/alerts` | Faturas a vencer, lançamentos próximos e cartões acima de 70% do limite. |

Três coisas que o contrato deliberadamente **não** pede, e que não devem ser inventadas: pagamento
ou quitação de fatura, histórico de cotação por ativo, e exportação de relatório em PDF ou CSV.
