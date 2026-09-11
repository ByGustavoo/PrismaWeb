# Contrato da API — Prisma

Este documento descreve **todos** os endpoints que o frontend do Prisma consome e que o backend
(`PrismaAPI`, Java / Spring Boot) expõe. Ele é a especificação dos `@RestController` e dos DTOs do
backend e dos tipos do frontend ao mesmo tempo.

Com `VITE_USE_MOCKS=true`, a camada de serviços responde com dados mockados; trocando para
`false`, as mesmas telas passam a falar com o PrismaAPI **sem que nenhum componente mude** — desde
que as respostas tenham exatamente o formato descrito aqui.

A fonte de verdade dos tipos é [`src/types/financas.ts`](src/types/financas.ts) e
[`src/types/comum.ts`](src/types/comum.ts). As URLs vivem em
[`src/api/rotasApi.ts`](src/api/rotasApi.ts) e em nenhum outro lugar.

---

## Sumário

- [Convenções gerais](#convenções-gerais)
- [Formato de erro](#formato-de-erro)
- [Enums do domínio](#enums-do-domínio)
- [Diferenças no PrismaAPI](#diferenças-no-prismaapi)
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
| Base URL | `VITE_API_URL`, por padrão `http://localhost:9017/PrismaAPI/v1` (perfil `dev` do PrismaAPI; em `prod`, porta `9027`). Todos os caminhos deste documento são relativos a ela. |
| Nomes | Todo campo de JSON e todo parâmetro de query é escrito em **português**, em camelCase sem acento (`saldoAtual`, `idCartao`, `dataVencimento`), e o caminho de todo endpoint também, em kebab-case (`/contas/origens`, `/despesas-recorrentes`, `/metas/{id}/precos`). Início e fim de um recorte se chamam sempre `dataInicial` e `dataFinal`. Os tipos de `src/types` têm o mesmo nome dos DTOs e enums do PrismaAPI (`ContaDTO`, `SalvarContaDTO`, `TipoConta`). |
| Formato | JSON em requisição e resposta. O cliente envia `Accept: application/json` sempre e `Content-Type: application/json` quando há corpo. |
| Data | String ISO `YYYY-MM-DD`, sem hora e sem fuso. Representa um dia civil, não um instante — o backend deve usar `LocalDate`, nunca `Instant` ou `ZonedDateTime`. |
| Mês | String `YYYY-MM` (por exemplo `2026-09`). Usado onde a granularidade é o mês: faturas, parcelas, orçamento, previsão e evolução do patrimônio. `YearMonth` no Java. |
| Dinheiro | `number` JSON com duas casas decimais, sempre **positivo**. A direção do dinheiro vem do campo `tipo`, nunca do sinal. Use `BigDecimal` com escala 2 no backend e serialize como número, não como string. |
| Limites de entrada | Todo valor em dinheiro recebido cabe em `NUMERIC(14,2)`: até 12 dígitos inteiros e 2 casas decimais. Fora disso, o valor é recusado com a mensagem que a seção do endpoint dá ao campo — nunca arredondar em silêncio nem deixar o banco responder `500`. Texto é gravado sem espaços nas bordas, e o mínimo e o máximo de caracteres valem sobre o texto já aparado; o máximo de cada campo é o tamanho da coluna e aparece na tabela de validações de cada seção. Observação é a exceção: a coluna é `TEXT`, e o limite de **500 caracteres** é regra de produto, validada na aplicação. |
| Percentual | `number` em pontos percentuais: `8.2` significa 8,2%. **Exceção:** `participacao`, `consumo` e `rentabilidade` são frações de 0 a 1. Cada campo abaixo diz qual dos dois é. |
| Identificador | `string`. O frontend nunca faz aritmética com id, então UUID, id numérico serializado como texto ou slug funcionam igualmente. O PrismaAPI usa UUID. |
| Ordenação | Sempre definida pelo servidor; o frontend não reordena o que chega da API (ele reordena só o que já está em memória, por escolha do usuário). Cada endpoint diz sua ordem. |
| Campo opcional | Pode ser **omitido** ou vir `null`. O frontend trata os dois igual. Campos não marcados como opcionais são obrigatórios na resposta. |
| Timeout | O cliente aborta em **15 s**. Endpoints de relatório e previsão precisam responder dentro disso. |
| Cancelamento | Toda requisição carrega um `AbortSignal`. Trocar de tela cancela a requisição em voo; o backend pode simplesmente ignorar a desconexão. |
| Autenticação | Ainda não existe. O `clienteHttp` já tem o ponto único `obterTokenAutenticacao()`; quando o Spring Security entrar, ele passa a mandar `Authorization: Bearer <token>` em todas as chamadas. Nenhum endpoint deste documento precisa mudar por causa disso. |
| CORS | O dev server roda em `http://localhost:5173`. No perfil `dev`, o backend libera qualquer porta de `localhost` e de `127.0.0.1` (propriedade `prismaapi.cors.origens-permitidas`), para que um segundo Vite ou o acesso por IP não esbarrem num `403` no preflight; fora do `dev`, só a origem configurada. Métodos `GET`, `POST`, `PUT`, `DELETE`; headers `Authorization`, `Content-Type` e `Accept`. |
| `204 No Content` | Toda exclusão responde `204` sem corpo. O `clienteHttp` já trata esse status e não tenta desserializar. |
| Paginação | **Não há.** Toda listagem devolve o array inteiro. O frontend não envia `page` nem `pageSize` e não sabe interpretar um envelope paginado — se um dia a base exigir paginação, ela entra como mudança de contrato, não como detalhe de implementação. |

---

## Formato de erro

Toda resposta de erro tem o corpo do `ErrorResponseDTO`, próximo do RFC 7807:

```json
{
  "status": 409,
  "title": "Conta Duplicada!",
  "instance": "/PrismaAPI/v1/contas",
  "type": "/PrismaAPI/problems/conta-duplicada",
  "detail": "Já existe uma conta com esse nome nessa instituição!",
  "timestamp": "10/09/2026 - 21:30:00"
}
```

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `status` | sim | O mesmo status HTTP da resposta. |
| `title` | sim | Nome curto do tipo de falha. |
| `instance` | sim | Caminho da requisição que falhou. |
| `type` | sim | Caminho estável por tipo de falha, no formato `/PrismaAPI/problems/<slug>`. É o que o cliente guarda em `ErroApi.codigo`. |
| `detail` | sim | Frase em português, pronta para ser exibida ao usuário. **É este texto que aparece no toast da tela** — o frontend não traduz nem reescreve mensagem de erro do servidor. Nas falhas técnicas — corpo ilegível, parâmetro em formato inválido, conflito de integridade no banco, erro inesperado — é uma frase fixa; o texto da exceção vai só para o log do servidor e **nunca** para a resposta, que não pode expor SQL, nome de classe nem assinatura de método. |
| `errors` | não | Só aparece na validação de campo (`validation-error`): uma lista de `{ "campo": "nome", "mensagem": "O campo 'nome' é obrigatório!" }`, com **uma mensagem por campo**. Quando um campo quebra mais de uma regra — vazio e curto demais ao mesmo tempo —, vale a de ausência. O `clienteHttp` usa essas mensagens no lugar de `detail`, para que o toast diga qual campo foi recusado, e a lista fica em `ErroApi.detalhes`. |
| `timestamp` | sim | Data e hora da falha, em `dd/MM/yyyy - HH:mm:ss`. |

O tipo `ErrorResponseDTO` mora em [`src/types/comum.ts`](src/types/comum.ts), e o `interpretarErro` de
`src/api/clienteHttp.ts` monta o `ErroApi` com as mensagens de `errors` (ou `detail`, ou `title`), `type` e `errors`.

### Status esperados

| Status | `type` de exemplo | Quando |
| --- | --- | --- |
| `400` | `/PrismaAPI/problems/validation-error` | Campo recusado pela validação estrutural, corpo malformado ou parâmetro impossível de interpretar. Também `unreadable-message`, `invalid-parameters` e `invalid-request`. |
| `404` | `/PrismaAPI/problems/conta-nao-encontrada` | Id inexistente numa rota `/{id}`. Um id que nem chega a ser UUID responde `400` com `invalid-parameters`. |
| `409` | `/PrismaAPI/problems/conta-duplicada` | A operação é válida mas conflita com o estado atual (duplicidade, exclusão de registro com histórico). |
| `422` | `/PrismaAPI/problems/origem-inexistente` | Corpo bem formado, mas com valor recusado pela regra de negócio: referência inexistente, destino igual à origem, categoria do tipo errado, forma de pagamento incompatível com a origem, lançamento futuro marcado como concluído. |
| `500` | `/PrismaAPI/problems/internal-server-error` | Falha inesperada. |

> **Sobre as mensagens.** As frases citadas em cada seção são as mesmas nos mocks do frontend e no
> `detail` do PrismaAPI, e toda mensagem de erro termina em **exclamação**. Numa mensagem com mais de
> uma frase, só a última termina em `!`.

O cliente também produz dois erros locais, que o backend não precisa gerar: `timeout` (status `0`,
após 15 s) e `network_error` (status `0`, quando o servidor não responde).

---

## Enums do domínio

Todos os enums viajam como **string maiúscula sem acento**, com sublinhado no lugar do hífen — a
mesma grafia gravada no banco. O frontend indexa objetos por esses valores; um valor fora da lista
quebra a tela.

| Enum | Valores | Onde aparece |
| --- | --- | --- |
| `TipoLancamento` | `RECEITA`, `DESPESA`, `TRANSFERENCIA` | Lançamentos |
| `SituacaoLancamento` | `PAGO`, `PENDENTE`, `AGENDADO` | Lançamentos |
| `FormaLancamento` | `CONTA`, `CARTAO_CREDITO`, `PIX`, `DINHEIRO` | Lançamentos |
| `TipoCategoria` | `RECEITA`, `DESPESA` | Categorias |
| `TipoConta` | `CORRENTE`, `SALARIO`, `EMERGENCIA`, `OUTRA` | Contas |
| `Situacao` | `ATIVO`, `INATIVO` | Contas e cartões |
| `GrupoOrigem` | `CONTA`, `CARTAO` | Origens de dinheiro e relatórios |
| `TipoCartao` | `CREDITO`, `DEBITO`, `VALE_ALIMENTACAO`, `VALE_REFEICAO` | Cartões |
| `SituacaoFatura` | `FUTURA`, `ABERTA`, `FECHADA`, `PAGA`, `VENCIDA` | Faturas |
| `SituacaoParcela` | `PAGA`, `ATUAL`, `FUTURA` | Parcelas |
| `ClasseAtivo` | `RENDA_FIXA`, `CDB`, `TESOURO`, `ACOES`, `ETF`, `FUNDOS`, `CRIPTO`, `OUTROS` | Investimentos |
| `SituacaoOrcamento` | `SEGURO`, `ALERTA`, `ESTOURADO` | Orçamento |
| `Frequencia` | `SEMANAL`, `QUINZENAL`, `MENSAL`, `BIMESTRAL`, `TRIMESTRAL`, `SEMESTRAL`, `ANUAL` | Recorrentes |
| `SituacaoDespesaRecorrente` | `ATIVO`, `PAUSADO` | Recorrentes |
| `SituacaoMeta` | `ACOMPANHANDO`, `COMPRADA`, `CANCELADA` | Metas |
| `LeituraMeta` | `PRIMEIRO`, `MENOR`, `ABAIXO_DA_MEDIA`, `ACIMA_DA_MEDIA`, `MAIOR`, `ESTAVEL` | Metas |
| `TipoAviso` | `FATURA_VENCENDO`, `CONTA_VENCENDO`, `LANCAMENTO_AGENDADO`, `LIMITE_CARTAO` | Avisos |
| `SeveridadeAviso` | `CRITICO`, `ATENCAO`, `INFO` | Avisos |
| `Tendencia` | `ALTA`, `BAIXA`, `ESTAVEL` | Variações |

### Objetos reaproveitados

```jsonc
// VariacaoDTO — variação contra o período anterior
{ "percentual": 12.4, "tendencia": "ALTA" }   // percentual em pontos percentuais

// CategoriaDTO
{ "id": "cat-moradia", "nome": "Moradia", "tipo": "DESPESA", "tokenCor": 1 }
```

`tokenCor` é um inteiro de **1 a 6** que escolhe a cor da categoria nos gráficos. Ele é atributo
da categoria, não da posição dela num ranking: se saísse da ordem, a mesma categoria mudaria de cor
entre uma carga e outra. Duas categorias podem repetir o token; a cor não é identificador.

---

## Diferenças no PrismaAPI

Endereço, formato de erro e nomes de campo e de parâmetro valem igualmente para o PrismaAPI e para
a camada mockada do frontend. Os pontos abaixo são os únicos em que o backend se comporta de outro
jeito que os mocks.

### Status de validação

| Situação | Mocks do frontend | PrismaAPI |
| --- | --- | --- |
| Campo obrigatório, tamanho mínimo e máximo, faixa numérica, casas decimais, formato (`http://`, quatro dígitos, `YYYY-MM`) e data no futuro | `422` com a frase da seção | `400`, com `detail` `A requisição contém dados inválidos!` e uma mensagem por campo em `errors` |
| Campo exigido pelo tipo do cartão: limite, dias de fechamento e vencimento, saldo do vale | `422` | `400`, com a frase da seção em `detail` |
| Valor que nem chega a ser lido: texto em campo numérico, enum desconhecido, data fora do formato ou inexistente (`2026-02-30` é recusada, nunca corrigida para o último dia do mês) | `422` | `400` |

Os `404`, os `409` e os `422` de regra de negócio (referência inexistente, destino igual à origem,
categoria do tipo errado, forma incompatível com a origem, data anterior ao primeiro preço) são
iguais nos dois lados. Os formulários
validam cada campo antes de enviar, então o `400` do servidor é a segunda barreira, não o caminho
normal de feedback.

### Parâmetros

- `GET /previsao` aceita `meses` de **1 a 24**; fora disso, `400`.
- `GET /relatorios/resumo` responde `400` sem `dataInicial` e `dataFinal`. Nos demais endpoints, um
  parâmetro ausente — ou enviado com outro nome — simplesmente não filtra.

### Regras que o PrismaAPI aplica de outro jeito

- **Lançamentos — transferência:** a origem precisa ser uma conta. Um cartão como origem de
  transferência responde `422` com `A transferência precisa sair de uma conta!`.

---

## Dashboard

### `GET /dashboard/resumo`

Resumo consolidado da tela inicial. É o endpoint mais pesado do contrato: ele devolve, de uma vez,
os totais do período, as variações contra o período anterior e as quatro séries dos gráficos.

> Documento detalhado deste endpoint: `docs/api/pdf/01-dashboard-resumo.pdf`, com as regras de
> cálculo e a origem de cada campo no esquema. Em caso de divergência, ele é a fonte.

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `dataInicial` | `YYYY-MM` | não | Primeiro mês do recorte. |
| `dataFinal` | `YYYY-MM` | não | Último mês do recorte, inclusivo. Igual a `dataInicial` num recorte de mês único. |

Sem os dois parâmetros, o servidor responde pelo **mês corrente**. Os dois andam juntos: enviar só
um, ou um `dataInicial` posterior ao `dataFinal`, é `400`.

**Resposta `200` — `DashboardDTO`**

```jsonc
{
  "dataInicial": "2026-09",
  "dataFinal": "2026-09",
  "saldoAtual": 32860.95,
  "variacaoSaldo": { "percentual": 20.2, "tendencia": "ALTA" },
  "receitasMes": 10545.50,
  "variacaoReceitas": { "percentual": -41.4, "tendencia": "BAIXA" },
  "despesasMes": 4717.22,
  "variacaoDespesas": { "percentual": -53.8, "tendencia": "BAIXA" },
  "totalInvestido": 114442.25,
  "variacaoInvestimentos": { "percentual": 7.8, "tendencia": "ALTA" },
  "faturaAtual": {
    "total": 2680.10,
    "nomeCartao": "Nova Platinum",
    "dataVencimento": "2026-10-08",
    "situacao": "ABERTA"
  },
  "historicoSaldo": [{ "rotulo": "Abr", "saldo": 21980.44 }],
  "fluxoCaixa": [{ "rotulo": "Abr", "receitas": 13100.00, "despesas": 8420.30 }],
  "gastoDiario": [{ "data": "2026-04-01", "valor": 0 }],
  "gastoPorCategoria": [
    { "categoria": { "id": "cat-moradia", "nome": "Moradia", "tipo": "DESPESA", "tokenCor": 1 },
      "valor": 2898.62, "participacao": 0.61 }
  ],
  "lancamentosRecentes": []
}
```

**Regras**

- **`dataInicial` e `dataFinal` na resposta ecoam o recorte efetivamente usado.** O frontend rotula
  os números com o que voltou, não com o que pediu: durante a troca de período os valores na tela
  ainda são os do recorte anterior, e "Saldo no fim de Agosto de 2026" sobre o saldo de setembro
  seria falso.
- **As variações comparam com a janela de mesmo tamanho imediatamente anterior.** Um recorte de
  três meses compara com os três meses anteriores, não com o mês anterior. Sem base de comparação
  não há variação: `percentual: 0` e `tendencia: "ESTAVEL"`, nunca uma divisão por zero. `ESTAVEL`
  também responde por toda variação dentro de ±0,05%.
- **A situação do lançamento não filtra nada.** `PAGO`, `PENDENTE` e `AGENDADO` entram igualmente
  em `receitasMes`, `despesasMes`, `saldoAtual` e em todas as séries. O dashboard responde "quanto
  este período movimenta", não "quanto já foi liquidado".
- **`saldoAtual` é o saldo no fim do recorte**, não o saldo de hoje. Num mês passado, é o saldo
  reconstruído naquela data: parta dos saldos de hoje e desfaça o que entrou e saiu depois. Nessa
  reconstrução, a transferência só pesa quando cruza a fronteira do total — um aporte para uma
  conta com `incluirNoTotal: false` reduz o saldo visível, enquanto uma transferência entre duas
  contas que somam no total não muda nada. No mês corrente o corte é **hoje**, não o dia 31; num
  mês futuro, some o que está agendado até lá.
- **A janela dos gráficos nem sempre é o período.** Num recorte de **mês único**, `historicoSaldo`,
  `fluxoCaixa` e `gastoDiario` trazem **seis meses**: o mês pedido e os cinco anteriores. Um mês
  sozinho não desenha linha nenhuma. Num recorte de vários meses, a janela é o próprio recorte.
  Já `saldoAtual`, `receitasMes`, `despesasMes` e `gastoPorCategoria` respeitam sempre o recorte
  pedido.
- **`rotulo` é o mês abreviado em pt-BR, com inicial maiúscula e sem ponto**: `Jan`, `Fev`, `Set`…
  O frontend imprime a string como veio.
- **`gastoDiario` traz todos os dias da janela dos gráficos**, do primeiro ao último, em ordem
  crescente — inclusive os dias do mês corrente que ainda não chegaram, zerados. Dia sem gasto vem
  com `valor: 0`, e **não** ausente: o calendário precisa desenhar a casa vazia, e uma sequência de
  dias sem gasto é informação, não buraco na série.
- **Transferência não entra em `receitasMes`, `despesasMes` nem `gastoPorCategoria`.** O dinheiro
  só troca de conta.
- `gastoPorCategoria` vem ordenado do maior gasto para o menor; `participacao` é fração de 0 a 1
  sobre o total de despesas do período.
- `lancamentosRecentes` são os **seis** lançamentos mais recentes do recorte, por data decrescente;
  no empate, por descrição crescente na collation de `pt-BR`. Mesmo formato de `LancamentoDTO`.
- `faturaAtual` é a fatura do mês de `dataFinal`, não a maior de todo o recorte: entre as daquele
  mês, prefira as de situação `ABERTA` e escolha a de maior valor; não havendo nenhuma aberta, a de
  maior valor entre as do mês. Cartão inativo também conta, desde que tenha movimento no mês.
  **Sem nenhum cartão movimentado no mês, `faturaAtual` vem `null`**, e a tela escreve "Sem compras
  no cartão de crédito". A versão anterior devolvia `nomeCartao: "Nenhum cartão"` com um vencimento
  inventado, e o bloco anunciava um prazo que não existia.
- Um recorte válido **sem nenhum lançamento não é erro**: responda `200` com os totais zerados e as
  séries preenchidas com zeros.

---

## Categorias

### `GET /categorias`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `tipo` | `TipoCategoria` | não | Sem ele, devolve todas. |

**Resposta `200` — `CategoriaDTO[]`**

```json
[{ "id": "cat-moradia", "nome": "Moradia", "tipo": "DESPESA", "tokenCor": 1 }]
```

**Regras**

- Receita e despesa **não compartilham categoria**: cada formulário oferece apenas as do seu lado.
  O filtro por `tipo` é o que sustenta isso.
- Ordem alfabética por `nome`.
- Categoria é hoje um catálogo fixo do servidor, criado pela migração `V1.1__InsertCategorias.sql`
  do PrismaAPI com as mesmas onze categorias dos mocks. Sem ele não se cadastra receita, despesa nem
  orçamento. Não há CRUD de categoria no frontend — se um dia houver, ele entra como um domínio novo.

---

## Lançamentos (receitas, despesas e transferências)

As três telas (`/lancamentos/receitas`, `/lancamentos/despesas`, `/lancamentos/transferencias`)
usam **o mesmo endpoint**, mudando apenas o parâmetro `tipo`. Não crie rotas separadas por tipo.

### `GET /lancamentos`

**Query** — todos opcionais; combinam-se com **E** lógico.

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `tipo` | `TipoLancamento` | Tipo do lançamento. |
| `busca` | `string` | Casa com descrição, nome da categoria, nome da conta de origem ou de destino. Comparação **sem diferenciar maiúscula nem acento**: quem digita `saude` espera achar `Saúde`. |
| `dataInicial` | `YYYY-MM-DD` | Início do período, inclusivo. |
| `dataFinal` | `YYYY-MM-DD` | Fim do período, inclusivo. |
| `idCategoria` | `string` | Id da categoria. |
| `idOrigem` | `string` | Casa com a conta de **origem** ou, em transferências, também com a de **destino**. |
| `situacao` | `SituacaoLancamento` | Situação. |

> Hoje a tela envia apenas `tipo` e refina busca, período, categoria, conta, situação e ordenação
> em memória, para responder a cada tecla sem uma nova ida ao servidor. Os demais parâmetros
> existem no contrato porque são o que a API vai receber quando a base crescer o bastante para a
> filtragem voltar ao servidor.

**Resposta `200` — `LancamentoDTO[]`**, do mais recente para o mais antigo.

```jsonc
{
  "id": "tx-1",
  "descricao": "Salário",
  "valor": 9800.00,
  "tipo": "RECEITA",
  "situacao": "PAGO",
  "forma": "CONTA",
  "data": "2026-09-03",
  "categoria": { "id": "cat-salario", "nome": "Salário", "tipo": "RECEITA", "tokenCor": 2 },
  "idOrigem": "acc-1",
  "nomeOrigem": "Conta corrente",
  "idContaDestino": null,     // só em transferências
  "nomeContaDestino": null,   // só em transferências
  "observacoes": "Crédito mensal da folha."
}
```

### `POST /lancamentos` · `PUT /lancamentos/{id}`

**Corpo — `SalvarLancamentoDTO`**

```jsonc
{
  "descricao": "Supermercado",
  "valor": 728.90,
  "tipo": "DESPESA",
  "situacao": "PAGO",
  "forma": "CARTAO_CREDITO",
  "data": "2026-09-02",
  "idCategoria": "cat-alimentacao",  // obrigatório fora de transferência
  "idOrigem": "card-1",
  "idContaDestino": null,            // obrigatório em transferência
  "observacoes": "Compra do mês"
}
```

**Resposta `201` (POST) / `200` (PUT) — `LancamentoDTO`**

**Regras e validações**

- **O cliente manda ids; o servidor resolve os nomes.** `nomeOrigem`, `nomeContaDestino` e o objeto
  `categoria` inteiro são preenchidos pelo backend a partir de `idOrigem`, `idContaDestino` e
  `idCategoria`. O frontend nunca envia nome.
- `idOrigem` pode apontar para uma **conta** ou para um **cartão**. Origem de dinheiro é um
  conceito único no produto (veja `GET /contas/origens`), e no banco são duas chaves
  estrangeiras (`id_conta` e `id_cartao`) reunidas num campo só pelo `COALESCE`.
- `valor` é sempre positivo; a direção do dinheiro vem de `tipo`, nunca do sinal.
- **O cartão de débito não é origem.** Ele fica fora de `GET /contas/origens` porque é só o meio de
  acessar a conta, e lançar nele responde `422`.
- **A forma de pagamento acompanha a origem.** Origem em cartão (crédito ou vale) exige
  `forma: "CARTAO_CREDITO"`; origem em conta aceita `CONTA`, `PIX` ou `DINHEIRO`, nunca `CARTAO_CREDITO`.
  O formulário esconde o campo quando a origem é um cartão e já envia a forma certa.
- **Data futura não pode estar concluída.** `situacao: "PAGO"` com `data` depois de hoje responde
  `422`: o que ainda não aconteceu é `AGENDADO` ou `PENDENTE`. O formulário troca a situação para
  agendado quando a data escolhida passa de hoje.
- **A categoria precisa ser do lado do lançamento:** despesa só com categoria de despesa, receita só
  com categoria de receita.
- **Transferência tem regras próprias:**
  - `categoria` vem **sempre presente e `null`** na resposta, nunca omitido, e `idCategoria` é
    ignorado na entrada;
  - a origem precisa ser uma conta;
  - `idContaDestino` é obrigatório;
  - a conta de destino precisa ser diferente da origem;
  - ela **não entra** em receita, despesa, resultado do período nem gasto por categoria.
- Validações:

  | Situação | Status | Mensagem |
  | --- | --- | --- |
  | `descricao` com menos de 2 caracteres | `422` | `Informe a descrição do lançamento!` |
  | `descricao` com mais de 160 caracteres | `422` | `A descrição do lançamento pode ter no máximo 160 caracteres!` |
  | `valor` ≤ 0 | `422` | `Informe um valor maior que zero!` |
  | `data` ausente | `422` | `Informe a data do lançamento!` |
  | `observacoes` com mais de 500 caracteres | `422` | `A observação pode ter no máximo 500 caracteres!` |
  | `idOrigem` inexistente | `422` | `A conta informada não existe!` |
  | `idContaDestino` inexistente (transferência) | `422` | `A conta de destino informada não existe!` |
  | Destino igual à origem | `422` | `A conta de destino precisa ser diferente da origem!` |
  | `idCategoria` inexistente fora de transferência | `422` | `A categoria informada não existe!` |
  | Despesa com categoria de receita | `422` | `Escolha uma categoria de despesa!` |
  | Receita com categoria de despesa | `422` | `Escolha uma categoria de receita!` |
  | Origem em cartão de débito | `422` | `O cartão de débito não é origem de lançamento: escolha a conta que ele movimenta!` |
  | Transferência saindo de um cartão | `422` | `A transferência precisa sair de uma conta!` |
  | Cartão com `forma` diferente de `CARTAO_CREDITO` | `422` | `Um lançamento no cartão precisa ter a forma de pagamento cartão!` |
  | Conta com `forma: "CARTAO_CREDITO"` | `422` | `Um lançamento na conta não pode ter a forma de pagamento cartão de crédito!` |
  | `situacao: "PAGO"` com `data` futura | `422` | `Um lançamento com data futura não pode estar concluído: marque como agendado ou pendente!` |

- `PUT` com id inexistente: `404` — `Lançamento não encontrado!`

### `DELETE /lancamentos/{id}`

**Resposta `204`.** Id inexistente: `404` — `Lançamento não encontrado!`

---

## Contas

### `GET /contas`

**Resposta `200` — `ContaDTO[]`**, contas ativas primeiro. A tela não reordena o que chega.

```json
{
  "id": "acc-1",
  "nome": "Conta corrente",
  "instituicao": "Banco Nova",
  "tipo": "CORRENTE",
  "saldo": 12480.35,
  "situacao": "ATIVO",
  "incluirNoTotal": true
}
```

### `GET /contas/origens`

Contas e cartões na mesma lista, do jeito que os seletores de lançamento precisam.

**Resposta `200` — `OrigemDTO[]`**

```json
[{ "id": "acc-1", "nome": "Conta corrente", "grupo": "CONTA" },
 { "id": "card-1", "nome": "Nova Platinum", "grupo": "CARTAO" }]
```

**Regras**

- Só entram registros **ativos**. Uma conta encerrada não deve ser oferecida num lançamento novo.
- **O cartão de débito fica de fora**: ele é apenas o meio de acessar a conta, que já está na lista.
  Incluí-lo criaria duas entradas para o mesmo dinheiro.
- Contas primeiro, cartões depois.
- Note que os ids convivem no mesmo espaço: `POST /lancamentos` aceita qualquer um deles em
  `idOrigem`. Se os ids de conta e de cartão puderem colidir no banco, prefixe-os (`acc-`, `card-`)
  como os mocks fazem.

### `POST /contas` · `PUT /contas/{id}`

**Corpo — `SalvarContaDTO`**: `nome`, `instituicao`, `tipo`, `saldo`, `situacao`, `incluirNoTotal`.
Todos obrigatórios.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `nome` com menos de 2 caracteres | `422` | `Informe o nome da conta!` |
| `nome` com mais de 80 caracteres | `422` | `O nome da conta pode ter no máximo 80 caracteres!` |
| `instituicao` com menos de 2 caracteres | `422` | `Informe a instituição da conta!` |
| `instituicao` com mais de 80 caracteres | `422` | `O nome da instituição pode ter no máximo 80 caracteres!` |
| `saldo` não numérico | `422` | `Informe um saldo válido!` |
| Mesmo `nome` na mesma `instituicao` | `409` | `Já existe uma conta com esse nome nessa instituição!` |
| Id inexistente (`PUT`) | `404` | `Conta não encontrada!` |

Saldo negativo é aceito: conta no vermelho existe. Conta gravada como `INATIVO` volta sempre com
`incluirNoTotal: false`, independentemente do valor enviado.

### `DELETE /contas/{id}`

**Resposta `204`.**

**Regra — excluir não apaga histórico.** Se a conta tiver qualquer lançamento (como origem **ou**
como destino de transferência) ou despesa recorrente paga por ela, responda `409` somando os dois,
no plural correto:

> `Esta conta tem 42 registros no histórico. Marque-a como inativa para tirá-la do saldo sem apagar o passado!`

Conta vinculada a cartão de débito também é recusada com `409`, e a frase acompanha a quantidade:

> `Esta conta está vinculada a um cartão de débito. Troque a conta desse cartão ou exclua-o antes de excluir a conta!`

> `Esta conta está vinculada a 2 cartões de débito. Troque a conta desses cartões ou exclua-os antes de excluir a conta!`

Conta inativa sai do saldo total e dos seletores, mas o passado continua legível. É por isso que
`ContaDTO` tem `situacao`.

---

## Cartões

### `GET /cartoes`

**Resposta `200` — `CartaoDTO[]`**, crédito primeiro, depois débito e vales. A tela separa os dois grupos
por `tipo`, mas não reordena dentro de cada um.

```jsonc
{
  "id": "card-1",
  "nome": "Nova Platinum",
  "instituicao": "Banco Nova",
  "tipo": "CREDITO",
  "situacao": "ATIVO",
  "bandeira": "Mastercard",          // opcional
  "ultimosDigitos": "4417",          // opcional, exatamente 4 dígitos
  "limiteCredito": 20000.00,         // crédito
  "limiteComprometido": 10265.26,    // crédito — calculado pelo servidor
  "diaFechamento": 28,               // crédito, 1 a 31
  "diaVencimento": 8,                // crédito, 1 a 31
  "idConta": null,                   // débito
  "nomeConta": null,                 // débito — resolvido pelo servidor
  "saldo": null                      // vales
}
```

**Regras**

- **Um cadastro para os quatro tipos.** Os campos específicos são opcionais porque nenhum tipo usa
  todos: crédito tem limite e datas de fatura, débito aponta para a conta que acessa e os vales
  carregam saldo próprio. Devolva `null`/ausente para o que não se aplica ao tipo — **não** devolva
  zero, que a tela leria como limite de R$ 0,00.
- **`limiteComprometido` é calculado, nunca armazenado.** Ele é a **soma das faturas ainda não
  pagas, incluindo as futuras** — as parcelas já comprometidas contam. É o único número que responde
  "quanto ainda posso gastar" sem esconder doze parcelas assumidas. Guardar o valor à mão faria a
  barra de limite mentir na primeira compra parcelada. O cliente nunca envia este campo.
- `nomeConta` é resolvido pelo servidor a partir de `idConta`.

### `POST /cartoes` · `PUT /cartoes/{id}`

**Corpo — `SalvarCartaoDTO`**: `nome`, `instituicao`, `tipo`, `situacao` e, conforme o tipo,
`bandeira`, `ultimosDigitos`, `limiteCredito`, `diaFechamento`, `diaVencimento`, `idConta`, `saldo`.

**Regra importante:** o formulário envia **apenas os campos do tipo escolhido**. Ao trocar um cartão
de crédito para vale-refeição, `limiteCredito`, `diaFechamento` e `diaVencimento` deixam de ser
enviados — o backend precisa **limpar** esses campos, e não preservar o valor anterior.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `nome` com menos de 2 caracteres | `422` | `Informe o nome do cartão!` |
| `nome` com mais de 80 caracteres | `422` | `O nome do cartão pode ter no máximo 80 caracteres!` |
| `instituicao` com menos de 2 caracteres | `422` | `Informe a instituição do cartão!` |
| `instituicao` com mais de 80 caracteres | `422` | `O nome da instituição pode ter no máximo 80 caracteres!` |
| `bandeira` com mais de 40 caracteres | `422` | `A bandeira pode ter no máximo 40 caracteres!` |
| `ultimosDigitos` presente e diferente de 4 dígitos | `422` | `Os últimos dígitos precisam ser quatro números!` |
| Crédito sem `limiteCredito` ou com limite ≤ 0 | `422` | `Informe o limite do cartão!` |
| Crédito com `diaFechamento` fora de 1–31 | `422` | `Informe um dia de fechamento entre 1 e 31!` |
| Crédito com `diaVencimento` fora de 1–31 | `422` | `Informe um dia de vencimento entre 1 e 31!` |
| Débito sem `idConta` válido | `422` | `Escolha a conta vinculada ao cartão de débito!` |
| Vale com `saldo` não numérico | `422` | `Informe um saldo válido para o cartão!` |
| Id inexistente (`PUT`) | `404` | `Cartão não encontrado!` |

### `DELETE /cartoes/{id}`

**Resposta `204`.** Mesma regra das contas: cartão com lançamentos, compras parceladas ou despesas
recorrentes pagas por ele responde `409`, somando os três:

> `Este cartão tem 18 registros no histórico. Marque-o como inativo para tirá-lo dos lançamentos sem apagar o passado!`

---

## Faturas

Fatura **não é cadastro: é leitura calculada**. Não existe `POST`, `PUT` nem `DELETE` aqui, e o
frontend nunca envia uma fatura.

### `GET /faturas`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `idCartao` | `string` | não | Sem ele, devolve as faturas de **todos** os cartões de crédito. |

**Resposta `200` — `FaturaCartaoDTO[]`**, por `dataVencimento` crescente e, no empate, por `nomeCartao`.

```jsonc
{
  "id": "inv-card-1-2026-09",
  "idCartao": "card-1",
  "nomeCartao": "Nova Platinum",
  "mes": "2026-09",
  "total": 3385.16,
  "situacao": "ABERTA",
  "dataFechamento": "2026-09-28",
  "dataVencimento": "2026-10-08",
  "quantidadeItens": 12,
  "totalAnterior": 2980.44   // opcional
}
```

### `GET /faturas/{id}`

**Resposta `200` — `DetalheFaturaDTO`**: todos os campos de `FaturaCartaoDTO` mais `itens`.

```jsonc
{
  "id": "inv-card-1-2026-09",
  "…": "campos de FaturaCartaoDTO",
  "itens": [
    {
      "id": "tx-12",
      "descricao": "Supermercado",
      "data": "2026-09-02",
      "valor": 728.90,
      "categoria": { "id": "cat-alimentacao", "nome": "Alimentação", "tipo": "DESPESA", "tokenCor": 4 },
      "parcela": { "numero": 3, "total": 12, "idCompra": "inst-2" }
    }
  ]
}
```

`parcela` só aparece quando o item é parcela de uma compra parcelada. `itens` vem do mais recente
para o mais antigo. Id inexistente: `404` — `Fatura não encontrada!`

**Como a fatura é montada** — esta é a regra central do domínio:

1. A fatura de um cartão num mês reúne **as despesas lançadas naquele cartão** mais **as parcelas
   das compras parceladas** que caem naquele ciclo.
2. O **ciclo** vai do fechamento do mês anterior (**exclusivo**) até o fechamento deste mês
   (**inclusivo**).
3. O **vencimento** cai no mês seguinte ao fechamento quando `diaVencimento <= diaFechamento`; caso
   contrário, no mesmo mês.
4. `situacao` é derivada da data de hoje:
   - `FUTURA` — o ciclo ainda nem começou (a fatura só existe porque há parcelas comprometidas);
   - `ABERTA` — o ciclo está em andamento e ainda aceita compras;
   - `FECHADA` — o ciclo fechou e o vencimento ainda não chegou;
   - `VENCIDA` — passou do vencimento;
   - `PAGA` — quitada.
5. `totalAnterior` é o total da fatura anterior **do mesmo cartão**, quando existe. Nem sempre é o
   mês imediatamente anterior: um mês sem nenhuma compra não gera fatura.
6. Um mês sem compras e sem parcelas **não gera fatura** — não devolva fatura de total zero.

> **Fora de escopo hoje:** não há pagamento de fatura nem registro de quitação. O frontend trata a
> fatura vencida como paga no limite comprometido, mas ela ainda gera aviso nos 15 dias
> seguintes ao vencimento (veja [Avisos](#avisos)). Se o backend passar a controlar quitação, o campo `situacao` já suporta
> `PAGA` e nada mais precisa mudar no contrato.

---

## Compras parceladas

### `GET /compras-parceladas`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `idCartao` | `string` | não | Sem ele, devolve as compras de todos os cartões. |

**Resposta `200` — `PlanoCompraParceladaDTO[]`**: as compras em andamento primeiro, da mais recente para a
mais antiga, e as já quitadas ao fim. O servidor devolve a compra **já com o cronograma e os totais
calculados**:

```jsonc
{
  "compra": {
    "id": "inst-1",
    "descricao": "Notebook",
    "valorTotal": 6000.00,
    "parcelas": 12,
    "dataCompra": "2026-03-14",
    "primeiroMes": "2026-04",
    "idCartao": "card-1",
    "nomeCartao": "Nova Platinum",
    "categoria": { "id": "cat-outros", "nome": "Outros", "tipo": "DESPESA", "tokenCor": 6 },
    "observacoes": null
  },
  "valorParcela": 500.00,
  "parcelasPagas": 6,
  "parcelasRestantes": 6,
  "valorPago": 3000.00,
  "valorRestante": 3000.00,
  "parcelaAtual": { "numero": 7, "mes": "2026-10", "dataVencimento": "2026-11-08", "valor": 500.00, "situacao": "ATUAL" },
  "cronograma": [
    { "numero": 1, "mes": "2026-04", "dataVencimento": "2026-05-08", "valor": 500.00, "situacao": "PAGA" }
  ]
}
```

### `POST /compras-parceladas` · `PUT /compras-parceladas/{id}`

**Corpo — `SalvarCompraParceladaDTO`**: `descricao`, `valorTotal`, `parcelas`, `dataCompra`,
`primeiroMes`, `idCartao`, `idCategoria` (opcional), `observacoes` (opcional).

**Resposta `201` / `200` — `CompraParceladaDTO`** (a compra crua, sem o plano calculado).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `descricao` com menos de 2 caracteres | `422` | `Informe a descrição da compra!` |
| `descricao` com mais de 160 caracteres | `422` | `A descrição da compra pode ter no máximo 160 caracteres!` |
| `observacoes` com mais de 500 caracteres | `422` | `A observação pode ter no máximo 500 caracteres!` |
| `valorTotal` ≤ 0 | `422` | `Informe o valor total da compra!` |
| `parcelas` fora de 2–48 | `422` | `O parcelamento precisa ter de 2 a 48 parcelas!` |
| `primeiroMes` ausente ou fora de `YYYY-MM` | `422` | `Informe o mês da primeira parcela!` |
| `idCartao` inexistente | `422` | `O cartão informado não existe!` |
| Cartão que não é de crédito | `422` | `Só cartões de crédito aceitam compras parceladas!` |
| `primeiroMes` anterior ao mês de `dataCompra` | `422` | `A primeira parcela não pode cair antes do mês da compra!` |
| `idCategoria` de receita | `422` | `Escolha uma categoria de despesa!` |
| Id inexistente (`PUT`) | `404` | `Compra parcelada não encontrada!` |

### `DELETE /compras-parceladas/{id}`

**Resposta `204`.**

**Regras do cálculo**

- **As parcelas não são lançamentos.** Elas vivem na compra parcelada e entram nas faturas pelo
  cálculo. Gravar doze cópias de cada compra na tabela de lançamentos deixaria a listagem ilegível
  e o resultado do período errado, já que quem sai da conta é a fatura, não a parcela.
- **A última parcela absorve a sobra.** As primeiras levam o valor arredondado para baixo em duas
  casas; a última recebe a diferença, para a soma fechar **exatamente** com `valorTotal`. Por isso
  `valorParcela` é o valor típico, e uma parcela do `cronograma` pode diferir dele.
- `situacao` de cada parcela sai da comparação da `dataVencimento` com hoje: `PAGA` no passado,
  `ATUAL` na vigente, `FUTURA` no futuro.
- `parcelaAtual` vem `null` quando a compra já foi quitada.
- Uma compra cadastrada agora precisa aparecer **na fatura, no `limiteComprometido` do cartão e no
  cronograma** sem nenhum ajuste manual.

---

## Investimentos

### `GET /investimentos/carteira`

Carteira consolidada — é o que a tela mostra, e as `posicoes` também alimentam o formulário de
edição. Não há endpoint que liste os investimentos crus.

**Resposta `200` — `CarteiraDTO`**

```jsonc
{
  "aportado": 106000.00,
  "valorAtual": 114442.25,
  "rendimento": 8442.25,
  "rentabilidade": 0.0796,                                          // fração
  "variacaoValorAtual": { "percentual": 1.4, "tendencia": "ALTA" },
  "alocacao": [
    { "classeAtivo": "TESOURO", "aportado": 20000.00, "valorAtual": 22480.15,
      "rendimento": 2480.15, "participacao": 0.196, "quantidade": 2 }
  ],
  "historico": [
    { "rotulo": "Abr", "mes": "2026-04", "aportado": 92000.00, "valor": 98120.44 }
  ],
  "posicoes": [
    { "investimento": { "…": "InvestimentoDTO" }, "rendimento": 2480.15, "rentabilidade": 0.124, "participacao": 0.196 }
  ]
}
```

**`InvestimentoDTO`** — o `investimento` de cada posição, e também a resposta de `POST` e `PUT`:

```jsonc
{
  "id": "inv-1",
  "nome": "Tesouro Selic 2029",
  "classeAtivo": "TESOURO",
  "instituicao": "Meridiano Investimentos",
  "aportado": 20000.00,
  "valorAtual": 22480.15,
  "dataInicio": "2024-06-10",
  "observacoes": null
}
```

**Regras**

- `rentabilidade` e `participacao` são **frações de 0 a 1**; `variacaoValorAtual.percentual` é ponto
  percentual.
- `alocacao` traz uma entrada por classe **com posição**, do maior `valorAtual` para o menor.
  Classe sem posição não aparece.
- `historico` cobre os **doze** meses até o mês corrente, do mais antigo ao mais recente, e o último
  ponto tem de fechar **exatamente** com `valorAtual`.
- **`dataInicio` não é enfeite.** Sem uma série real de aportes, a curva de `aportado` distribui os
  aportes linearmente entre a data do primeiro aporte e hoje. É a suposição mais honesta disponível,
  e a única que faz a curva chegar em hoje valendo o que o cadastro diz.
- `posicoes` vem do maior `valorAtual` para o menor.

### `POST /investimentos` · `PUT /investimentos/{id}` · `DELETE /investimentos/{id}`

**Corpo — `SalvarInvestimentoDTO`**: `nome`, `classeAtivo`, `instituicao`, `aportado`, `valorAtual`,
`dataInicio`, `observacoes` (opcional).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `nome` com menos de 2 caracteres | `422` | `Informe o nome do investimento!` |
| `nome` com mais de 120 caracteres | `422` | `O nome do investimento pode ter no máximo 120 caracteres!` |
| `instituicao` com menos de 2 caracteres | `422` | `Informe a instituição onde o dinheiro está aplicado!` |
| `instituicao` com mais de 80 caracteres | `422` | `O nome da instituição pode ter no máximo 80 caracteres!` |
| `aportado` ≤ 0 | `422` | `Informe quanto já foi aportado!` |
| `valorAtual` < 0 | `422` | `Informe quanto a posição vale hoje!` |
| `observacoes` com mais de 500 caracteres | `422` | `A observação pode ter no máximo 500 caracteres!` |
| `dataInicio` ausente | `422` | `Informe a data do primeiro aporte!` |
| `dataInicio` no futuro | `422` | `A data do primeiro aporte não pode estar no futuro!` |
| Id inexistente | `404` | `Investimento não encontrado!` |

`valorAtual` menor que `aportado` é aceito: posição no prejuízo existe.

> **Fora de escopo hoje:** não há histórico de cotação por ativo. A evolução do patrimônio é
> reconstruída a partir do valor atual e da idade da posição. Se o backend passar a guardar a série
> real, `historico` continua com o mesmo formato — muda só a qualidade do dado.

---

## Orçamento

### `GET /orcamentos/visao-geral`

O frontend **não lista orçamentos crus**: ele lê os limites de dentro deste consolidado. Não é
preciso expor um `GET /orcamentos`.

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `mes` | `YYYY-MM` | não | Sem ele, o mês corrente. |

**Resposta `200` — `VisaoGeralOrcamentoDTO`**

```jsonc
{
  "mes": "2026-09",
  "planejado": 7300.00,
  "gasto": 4268.60,
  "restante": 3031.40,
  "consumo": 0.585,
  "diasRestantes": 26,
  "diasDecorridos": 4,
  "diasNoMes": 30,
  "itens": [
    {
      "orcamento": { "id": "bud-1",
                     "categoria": { "id": "cat-alimentacao", "nome": "Alimentação", "tipo": "DESPESA", "tokenCor": 4 },
                     "limiteMensal": 1400.00 },
      "gasto": 1419.70,
      "restante": -19.70,
      "consumo": 1.014,
      "projecao": 0,
      "situacao": "ESTOURADO"
    }
  ],
  "foraDoOrcamento": [
    { "categoria": { "id": "cat-outros", "nome": "Outros", "tipo": "DESPESA", "tokenCor": 6 },
      "valor": 398.90, "participacao": 0.09 }
  ]
}
```

**Regras**

- **O orçamento é recorrente e não tem mês.** Um limite guarda categoria e valor, e vale de um mês
  para o outro até ser alterado. **Não** crie uma linha por mês: isso obrigaria a redigitar o mesmo
  número doze vezes por ano e deixaria todo mês seguinte começando sem orçamento. O consumo, esse
  sim, é apurado por mês.
- `consumo` é fração e **passa de 1 no estouro** — não o limite a 1.
- `restante` fica **negativo** quando estourou.
- `situacao` sai do `consumo`: `SEGURO` abaixo de 0,8, `ALERTA` de 0,8 (inclusive) a 1, `ESTOURADO`
  de 1 (inclusive) em diante. A faixa de atenção começa em 80% porque é o ponto em que ainda dá para
  mudar de ideia — avisar em 95% é avisar quando o mês já acabou.
- **`projecao` tem piso.** Ela é onde o gasto chega no fim do mês mantido o ritmo atual, mas só é
  calculada a partir do **décimo dia** (`diasDecorridos >= 10`). Antes disso, devolva `0` e a tela
  não projeta nada. Extrapolar linearmente o dia 4 multiplica por sete um aluguel que acontece uma
  vez no mês, e "no ritmo atual, R$ 21.700 de moradia" não é um aviso, é um erro de leitura.
- **`foraDoOrcamento` não é detalhe.** São as categorias com gasto no mês e sem limite definido. Sem
  elas, a soma dos limites seria lida como o gasto total do mês, e não é.
- `itens` vem do maior `consumo` para o menor: a tela abre no que exige decisão, não na ordem em que
  os limites foram cadastrados.
- Num mês passado, `diasRestantes` é `0` e `diasDecorridos` é `diasNoMes`.

### `POST /orcamentos` · `PUT /orcamentos/{id}` · `DELETE /orcamentos/{id}`

**Corpo — `SalvarOrcamentoDTO`**: `idCategoria`, `limiteMensal`.

**Resposta `201` / `200` — `OrcamentoDTO`** (`id`, `categoria` resolvida, `limiteMensal`).

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `idCategoria` inexistente | `422` | `Escolha a categoria do orçamento!` |
| Categoria de receita | `422` | `Só categorias de despesa aceitam orçamento!` |
| `limiteMensal` ≤ 0 | `422` | `Informe um limite maior que zero!` |
| Categoria já orçada | `409` | `Já existe um orçamento para Alimentação. Edite o limite existente em vez de criar outro!` |
| Id inexistente | `404` | `Orçamento não encontrado!` |

**Uma categoria tem no máximo um limite.** O formulário já nem oferece as categorias orçadas, mas a
regra precisa existir no servidor.

---

## Despesas recorrentes

### `GET /despesas-recorrentes`

Devolve a lista **já consolidada** — note que a resposta é um objeto, não um array.

**Resposta `200` — `ResumoDespesasRecorrentesDTO`**

```jsonc
{
  "itens": [
    {
      "id": "rec-1",
      "descricao": "Aluguel",
      "valor": 2450.00,
      "categoria": { "id": "cat-moradia", "nome": "Moradia", "tipo": "DESPESA", "tokenCor": 1 },
      "frequencia": "MENSAL",
      "proximoVencimento": "2026-09-05",
      "idOrigem": "acc-1",
      "nomeOrigem": "Conta corrente",
      "situacao": "ATIVO",
      "observacoes": null
    }
  ],
  "custoMensal": 4602.80,
  "custoAnual": 55233.60,
  "vencendoEmBreve": []
}
```

**Regras**

- **A recorrência é normalizada para o mês** em `custoMensal`: a anual entra dividida por doze, a
  semestral por seis, a semanal multiplicada por **4,3452** — a média real de semanas num mês. Sem
  isso, somar assinatura mensal com seguro anual daria um número que não corresponde a mês nenhum.
- `custoMensal` e `custoAnual` contam **apenas as ativas**. Pausada continua no cadastro, sai do
  custo e volta com um clique.
- `vencendoEmBreve` traz as ativas que vencem nos próximos **7 dias**, da mais próxima em diante.
- **`proximoVencimento` na resposta nunca fica no passado.** O cadastro guarda a data informada, e a
  leitura avança pela frequência até a primeira ocorrência de hoje em diante: um aluguel mensal
  cadastrado com vencimento em 10/08 aparece com 10/09 depois que agosto passa. Como não há registro
  de pagamento, sem esse avanço toda recorrente virava "venceu há N dias" um mês depois do cadastro.
- `itens` vem ordenado pelo `proximoVencimento` crescente, com as pausadas ao fim.

### `POST /despesas-recorrentes` · `PUT /despesas-recorrentes/{id}` · `DELETE /despesas-recorrentes/{id}`

**Corpo — `SalvarDespesaRecorrenteDTO`**: `descricao`, `valor`, `idCategoria` (opcional), `frequencia`,
`proximoVencimento`, `idOrigem`, `situacao`, `observacoes` (opcional).

**Resposta `201` / `200` — `DespesaRecorrenteDTO`.** `nomeOrigem` e `categoria` são resolvidos pelo
servidor; `idOrigem` pode ser conta **ou** cartão.

**Validações**

| Situação | Status | Mensagem |
| --- | --- | --- |
| `descricao` com menos de 2 caracteres | `422` | `Informe a descrição da despesa!` |
| `descricao` com mais de 160 caracteres | `422` | `A descrição da despesa pode ter no máximo 160 caracteres!` |
| `observacoes` com mais de 500 caracteres | `422` | `A observação pode ter no máximo 500 caracteres!` |
| `valor` ≤ 0 | `422` | `Informe um valor maior que zero!` |
| `proximoVencimento` ausente | `422` | `Informe a data do próximo vencimento!` |
| `idOrigem` inexistente | `422` | `Escolha a conta ou o cartão que paga esta despesa!` |
| `idCategoria` que não seja de despesa | `422` | `Escolha uma categoria de despesa!` |
| Id inexistente | `404` | `Despesa recorrente não encontrada!` |

**Pausar é o `PUT` com `situacao: "PAUSADO"`** — não há endpoint próprio. A tela envia o mesmo
payload com a situação trocada.

---

## Metas e desejos

O domínio tem uma regra que vale mais do que todas as outras: **registrar um preço novo nunca
sobrescreve o anterior**. Sem a série completa, a tela perde menor preço, média, variação e gráfico
— sobra o último número digitado, que qualquer campo de texto já daria. É por isso que a edição não
carrega preço e o registro tem rota própria.

### `GET /metas`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `situacao` | `SituacaoMeta` | não | Situação. |
| `busca` | `string` | não | Casa com nome e observação, **ignorando acento e caixa**. |

> Como em lançamentos, a tela hoje filtra e ordena em memória; os parâmetros existem porque são o
> que a API receberá quando a lista crescer.

**Resposta `200` — `ResumoMetasDTO`**

```jsonc
{
  "itens": [
    {
      "meta": {
        "id": "goal-1",
        "nome": "Notebook Dell Inspiron 15",
        "url": "https://dell.com/…",
        "urlImagem": null,
        "situacao": "ACOMPANHANDO",
        "observacoes": null,
        "dataCriacao": "2026-05-02",
        "historico": [
          { "id": "gp-1", "data": "2026-05-02", "preco": 4299.00, "observacao": null },
          { "id": "gp-2", "data": "2026-08-31", "preco": 4499.00, "observacao": "Sem cupom" }
        ]
      },
      "analise": {
        "precoInicial": 4299.00,
        "precoAtual": 4499.00,
        "menorPreco": 4180.00,
        "maiorPreco": 4620.00,
        "precoMedio": 4380.50,
        "variacao": 200.00,
        "variacaoPercentual": 4.65,
        "tendencia": "ALTA",
        "economia": 121.00,
        "ultimaAtualizacao": "2026-08-31",
        "quantidadeRegistros": 5,
        "leitura": "ACIMA_DA_MEDIA"
      }
    }
  ],
  "quantidadeAcompanhando": 5,
  "quantidadeCompradas": 1,
  "totalAtual": 14045.90,
  "totalInicial": 13886.90,
  "variacaoTotal": 159.00,
  "economiaTotal": 841.00
}
```

**Regras**

- `historico` vem em **ordem cronológica crescente** e **nunca vazio**: o cadastro grava o primeiro
  preço junto.
- `analise` é conta de servidor:
  - `precoInicial` é o preço do **primeiro** registro; é a referência de toda a variação;
  - `variacao` = `precoAtual − precoInicial`; `variacaoPercentual` é ponto percentual sobre o
    inicial;
  - `economia` = `maiorPreco − precoAtual`, **nunca negativa**;
  - `tendencia` é `ESTAVEL` quando a variação fica dentro de **0,5%** do preço inicial;
  - `quantidadeRegistros` é o tamanho do histórico.
- **`leitura` é a leitura do momento**, e o texto de cada caso vive no frontend — a API devolve só o
  código. A regra de escolha, na ordem:
  1. `PRIMEIRO` quando `quantidadeRegistros < 2`. **Uma meta com um registro só não tem variação**:
     afirmar estabilidade sobre uma única observação seria falso.
  2. `ESTAVEL` quando a faixa inteira (`maiorPreco − menorPreco`) é menor que um centavo.
  3. Calcule a posição do preço atual dentro da faixa,
     `(precoAtual − menorPreco) / (maiorPreco − menorPreco)`: até **0,05** é `MENOR`, a partir de
     **0,95** é `MAIOR`.
  4. Fora dos extremos, compare com `precoMedio`: `ABAIXO_DA_MEDIA` ou `ACIMA_DA_MEDIA`.

  A média sozinha não bastaria: numa série que desceu de 900 para 750 e voltou a 780, "abaixo da
  média" é verdade e ainda assim esconde que o fundo foi bem mais baixo. Por isso a posição na faixa
  vem antes.
- **Os totais olham só as metas em acompanhamento.** Somar no custo da lista o que já foi comprado
  ou cancelado daria um número que não corresponde a decisão nenhuma. `quantidadeCompradas` conta as
  compradas apenas para o rótulo auxiliar.
- `itens` vem ordenado pela `ultimaAtualizacao` decrescente: a tela abre no que acabou de mudar.

### `POST /metas`

**Corpo — `SalvarMetaDTO`**: `nome`, `url` (opcional), `urlImagem` (opcional), `preco`, `data`,
`situacao`, `observacoes` (opcional).

O cadastro **leva o primeiro preço junto** porque uma meta sem registro não teria preço atual para
mostrar: cadastrar é, ao mesmo tempo, a primeira consulta. `dataCriacao` recebe a `data` enviada.

**Resposta `201` — `MetaDTO`.**

### `PUT /metas/{id}`

**Corpo — `AtualizarMetaDTO`**: `nome`, `url` (opcional), `urlImagem` (opcional), `situacao`,
`observacoes` (opcional).

**A edição não mexe em preço.** Corrigir o valor por aqui apagaria um ponto do histórico; preço novo
é sempre um registro novo. `dataCriacao` e `historico` são preservados.

**Resposta `200` — `MetaDTO`.**

### `POST /metas/{id}/precos`

Acrescenta um preço ao histórico. **Nunca substitui o anterior.**

**Corpo — `SalvarMetaPrecoDTO`**: `preco`, `data`, `observacao` (opcional).

**Resposta `201` — `MetaDTO`** com a série já atualizada. O frontend recarrega a lista a partir disso;
devolver só o registro criado não bastaria, porque a tela precisa da análise recalculada.

### `DELETE /metas/{id}`

**Resposta `204`.** Apaga a meta **e todo o histórico dela** — é a única operação destrutiva do
domínio, e a tela já pede confirmação.

### Validações de metas

| Situação | Status | Mensagem |
| --- | --- | --- |
| `nome` com menos de 2 caracteres | `422` | `Informe o nome do produto!` |
| `nome` com mais de 120 caracteres | `422` | `O nome do produto pode ter no máximo 120 caracteres!` |
| `url` que não comece com `http://` ou `https://` | `422` | `Informe um link do produto começando com http:// ou https://!` |
| `url` com mais de 2048 caracteres | `422` | `O link do produto pode ter no máximo 2048 caracteres!` |
| `urlImagem` que não comece com `http://` ou `https://` | `422` | `Informe um link da imagem começando com http:// ou https://!` |
| `urlImagem` com mais de 2048 caracteres | `422` | `O link da imagem pode ter no máximo 2048 caracteres!` |
| `observacoes` (meta) ou `observacao` (registro de preço) com mais de 500 caracteres | `422` | `A observação pode ter no máximo 500 caracteres!` |
| `preco` ≤ 0 ou não numérico | `422` | `Informe um preço maior que zero!` |
| `data` ausente | `422` | `Informe a data do registro!` |
| `data` no futuro | `422` | `A data do registro não pode estar no futuro!` |
| `data` anterior à `dataCriacao` da meta | `422` | `A data do registro não pode ser anterior ao primeiro preço!` |
| Mesmo preço na mesma data | `409` | `Já existe um registro com esse preço nesta data!` |
| Id inexistente | `404` | `Meta não encontrada!` |

Duas justificativas que valem o registro: um preço consultado no futuro não foi consultado — a série
perderia o sentido de "o que eu vi, e quando"; e um registro anterior ao primeiro trocaria
silenciosamente o preço inicial, que é a referência de toda a variação mostrada na tela.

> **Não há scraping nem atualização automática de preço.** Todo valor é digitado por quem consultou.
> O `url` só serve para a tela abrir a página do produto numa aba nova — o backend nunca deve
> acessá-lo.

---

## Previsão financeira

### `GET /previsao`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `meses` | `number` | não | Horizonte projetado. Padrão **6**. |

**Resposta `200` — `PrevisaoDTO`**

```jsonc
{
  "saldoInicial": 32860.95,
  "meses": [
    {
      "mes": "2026-10",
      "rotulo": "Out",
      "receita": 13825.81,
      "recorrentes": 4209.80,
      "parcelas": 1710.00,
      "variavel": 6695.24,
      "despesa": 12615.04,
      "resultado": 1210.77,
      "saldoFinal": 34071.72
    }
  ],
  "saldoFinal": 39917.57,
  "resultadoMedio": 1176.10,
  "menorSaldo": { "mes": "2026-10", "saldo": 34071.72 }
}
```

**Regras**

- **A projeção começa no mês que vem.** Metade do mês corrente já aconteceu: somar realizado com
  previsto na mesma linha produziria um número que não é nem um nem outro, e o dashboard já responde
  pelo mês em curso. O saldo de partida, esse sim, é o de hoje.
- `receita` é a média de receita dos **três meses fechados** anteriores.
- `recorrentes` usa a ocorrência **no mês exato**, não a média mensal: o seguro anual do carro entra
  inteiro no mês em que vence, e não como um doze avos em cada mês.
- `parcelas` soma as parcelas que caem nas faturas do mês.
- **`variavel` é um resto, não uma média solta**: é a média de despesa dos três meses fechados
  **menos** a média das recorrentes do mesmo período, nunca negativa. Sem esse desconto, o aluguel
  apareceria duas vezes — uma na sua linha, outra dentro da média — e a projeção ficaria pessimista
  o bastante para não servir para nada. As parcelas **não** são descontadas: como não são
  lançamentos, nunca entram na média de despesa, e descontá-las tiraria o mesmo dinheiro duas vezes.
- `despesa` = `recorrentes + parcelas + variavel`; `resultado` = `receita − despesa`.
- `saldoFinal` de cada mês acumula sobre o anterior, partindo de `saldoInicial`.
- `menorSaldo` aponta o mês de menor `saldoFinal` — é o que a tela existe para antecipar.
- `rotulo` é o mês abreviado com inicial maiúscula.

---

## Relatórios

### `GET /relatorios/resumo`

**Query**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `dataInicial` | `YYYY-MM-DD` | sim | Início do recorte, inclusivo. |
| `dataFinal` | `YYYY-MM-DD` | sim | Fim do recorte, inclusivo. |

**Relatório se pede por dia, não por mês**: "últimos 7 dias" e "de 12/03 a 04/05" não cabem numa
chave `YYYY-MM`. Todo atalho da tela termina hoje.

**Resposta `200` — `RelatorioDTO`**

```jsonc
{
  "dataInicial": "2026-09-01",
  "dataFinal": "2026-09-04",
  "receitas": 9800.00,
  "despesas": 4268.60,
  "resultado": 5531.40,
  "variacaoReceitas": { "percentual": 206.3, "tendencia": "ALTA" },
  "variacaoDespesas": { "percentual": 314.3, "tendencia": "ALTA" },
  "quantidadeLancamentos": 7,
  "despesasPorCategoria": [],
  "receitasPorCategoria": [],
  "fluxoCaixa": [{ "rotulo": "01/09", "receitas": 0, "despesas": 690.80 }],
  "despesasPorOrigem": [
    { "id": "acc-1", "nome": "Conta corrente", "grupo": "CONTA", "valor": 2450.00, "participacao": 0.57 }
  ],
  "historicoSaldo": [{ "rotulo": "01/09", "saldo": 27329.55 }],
  "patrimonio": [
    { "mes": "2026-04", "rotulo": "Abr", "contas": 21980.44, "investimentos": 98120.44, "total": 120100.88 }
  ]
}
```

**Regras**

- **As variações comparam com o intervalo de mesma duração imediatamente anterior.**
- `quantidadeLancamentos` conta receitas e despesas; **transferência fica de fora**.
- **O agrupamento de `fluxoCaixa` e `historicoSaldo` segue a duração do recorte:**

  | Duração | Balde | `rotulo` |
  | --- | --- | --- |
  | até 10 dias | por dia | `01/09` |
  | 11 a 45 dias | por semana (rótulo é o primeiro dia) | `08/09` |
  | acima de 45 dias | por mês | `Set` |

  Uma semana em baldes semanais viraria uma barra sozinha; um ano em baldes diários, trezentas e
  sessenta.
- `historicoSaldo` traz o saldo no **último dia de cada balde**.
- **`despesasPorOrigem` é o gasto por origem do dinheiro** — conta ou cartão. Transferência fica de
  fora: ela sai de uma conta e entra em outra, então contaria como gasto de uma conta que não
  gastou. `participacao` é fração do total de despesas do recorte, e a lista vem do maior para o
  menor.
- **`patrimonio` separa o patrimônio em conta e investimento.** Somados dão o total, mas a divisão é
  a informação: um total estável pode esconder dinheiro migrando de um lado para o outro. A série
  cobre no mínimo **seis** meses, mesmo num recorte curto — um mês sozinho não mostra evolução de
  patrimônio nenhuma.
- Recorte sem nenhum lançamento devolve `200` com `quantidadeLancamentos: 0` e as listas vazias; a
  tela já tem estado próprio para isso. **Não responda `404`.**

> **Fora de escopo hoje:** exportação de relatório em PDF ou CSV.

---

## Avisos

### `GET /avisos`

**Resposta `200` — `AvisoDTO[]`**

```jsonc
{
  "id": "alert-invoice-card-1",
  "tipo": "FATURA_VENCENDO",
  "severidade": "ATENCAO",
  "titulo": "Fatura Nova Platinum",
  "descricao": "Fatura vence em 4 dias",
  "data": "2026-09-08",
  "valor": 3385.16,
  "rota": "/faturas"
}
```

**Regras**

- **Os avisos são derivados, não cadastrados.** Eles saem dos mesmos dados que abastecem as telas:
  - `FATURA_VENCENDO` — faturas ainda não pagas que vencem dentro de 15 dias ou venceram há até
    15 dias, inclusive as de situação `VENCIDA`. Fatura vencida há mais tempo não gera aviso;
  - `CONTA_VENCENDO` — lançamentos pendentes dentro de 15 dias, inclusive os atrasados;
  - `LANCAMENTO_AGENDADO` — lançamentos agendados dentro de 15 dias;
  - `LIMITE_CARTAO` — cartões com **70%** ou mais do limite comprometido.
- `severidade` gradua a urgência: `CRITICO` para o que vence em até **2 dias** ou já venceu — e, no
  caso do limite, para o cartão a partir de **90%** —, `ATENCAO` para o que vence em até **7 dias**
  e para o cartão entre 70% e 90%, `INFO` para o resto. Lançamento agendado é sempre `INFO`.
  O ponto no sino do header conta apenas o que **não** é `INFO`.
- `rota` é uma rota do frontend (`/faturas`, `/lancamentos`, `/cartoes`). O backend precisa conhecer
  esses caminhos ou deixar o campo ausente — sem ele, o aviso vira uma linha não clicável, e a tela
  continua funcionando.
- Ordem: por severidade (`CRITICO`, `ATENCAO`, `INFO`) e, dentro de cada nível, por data
  crescente.

---

## Resumo dos endpoints

| # | Método | URL | Resposta | Domínio |
| --- | --- | --- | --- | --- |
| 1 | `GET` | `/dashboard/resumo?dataInicial&dataFinal` | `DashboardDTO` | Dashboard |
| 2 | `GET` | `/categorias?tipo` | `CategoriaDTO[]` | Categorias |
| 3 | `GET` | `/lancamentos?tipo&busca&dataInicial&dataFinal&idCategoria&idOrigem&situacao` | `LancamentoDTO[]` | Lançamentos |
| 4 | `POST` | `/lancamentos` | `LancamentoDTO` | Lançamentos |
| 5 | `PUT` | `/lancamentos/{id}` | `LancamentoDTO` | Lançamentos |
| 6 | `DELETE` | `/lancamentos/{id}` | `204` | Lançamentos |
| 7 | `GET` | `/contas` | `ContaDTO[]` | Contas |
| 8 | `GET` | `/contas/origens` | `OrigemDTO[]` | Contas |
| 9 | `POST` | `/contas` | `ContaDTO` | Contas |
| 10 | `PUT` | `/contas/{id}` | `ContaDTO` | Contas |
| 11 | `DELETE` | `/contas/{id}` | `204` | Contas |
| 12 | `GET` | `/cartoes` | `CartaoDTO[]` | Cartões |
| 13 | `POST` | `/cartoes` | `CartaoDTO` | Cartões |
| 14 | `PUT` | `/cartoes/{id}` | `CartaoDTO` | Cartões |
| 15 | `DELETE` | `/cartoes/{id}` | `204` | Cartões |
| 16 | `GET` | `/faturas?idCartao` | `FaturaCartaoDTO[]` | Faturas |
| 17 | `GET` | `/faturas/{id}` | `DetalheFaturaDTO` | Faturas |
| 18 | `GET` | `/compras-parceladas?idCartao` | `PlanoCompraParceladaDTO[]` | Parcelas |
| 19 | `POST` | `/compras-parceladas` | `CompraParceladaDTO` | Parcelas |
| 20 | `PUT` | `/compras-parceladas/{id}` | `CompraParceladaDTO` | Parcelas |
| 21 | `DELETE` | `/compras-parceladas/{id}` | `204` | Parcelas |
| 22 | `GET` | `/investimentos/carteira` | `CarteiraDTO` | Investimentos |
| 23 | `POST` | `/investimentos` | `InvestimentoDTO` | Investimentos |
| 24 | `PUT` | `/investimentos/{id}` | `InvestimentoDTO` | Investimentos |
| 25 | `DELETE` | `/investimentos/{id}` | `204` | Investimentos |
| 26 | `GET` | `/orcamentos/visao-geral?mes` | `VisaoGeralOrcamentoDTO` | Orçamento |
| 27 | `POST` | `/orcamentos` | `OrcamentoDTO` | Orçamento |
| 28 | `PUT` | `/orcamentos/{id}` | `OrcamentoDTO` | Orçamento |
| 29 | `DELETE` | `/orcamentos/{id}` | `204` | Orçamento |
| 30 | `GET` | `/despesas-recorrentes` | `ResumoDespesasRecorrentesDTO` | Recorrentes |
| 31 | `POST` | `/despesas-recorrentes` | `DespesaRecorrenteDTO` | Recorrentes |
| 32 | `PUT` | `/despesas-recorrentes/{id}` | `DespesaRecorrenteDTO` | Recorrentes |
| 33 | `DELETE` | `/despesas-recorrentes/{id}` | `204` | Recorrentes |
| 34 | `GET` | `/metas?situacao&busca` | `ResumoMetasDTO` | Metas |
| 35 | `POST` | `/metas` | `MetaDTO` | Metas |
| 36 | `PUT` | `/metas/{id}` | `MetaDTO` | Metas |
| 37 | `POST` | `/metas/{id}/precos` | `MetaDTO` | Metas |
| 38 | `DELETE` | `/metas/{id}` | `204` | Metas |
| 39 | `GET` | `/previsao?meses` | `PrevisaoDTO` | Previsão |
| 40 | `GET` | `/relatorios/resumo?dataInicial&dataFinal` | `RelatorioDTO` | Relatórios |
| 41 | `GET` | `/avisos` | `AvisoDTO[]` | Avisos |

---

## O que o backend precisa calcular

Nem tudo aqui é CRUD. Estes são os pontos em que o servidor **calcula** e o frontend apenas
apresenta — é onde mora o trabalho real da implementação, e é o que separa este contrato de uma
API gerada automaticamente a partir das tabelas.

| Cálculo | Endpoint | Por quê |
| --- | --- | --- |
| Fatura a partir de despesas e parcelas | `/faturas` | Fatura não é cadastro. O ciclo vai do fechamento anterior (exclusivo) ao deste mês (inclusivo). |
| `limiteComprometido` do cartão | `/cartoes` | Soma das faturas não pagas, **incluindo as futuras**. Guardar o valor faria a barra de limite mentir na primeira compra parcelada. |
| Cronograma de parcelas | `/compras-parceladas` | A última parcela absorve o arredondamento, para fechar exatamente com o total. |
| Saldo reconstruído numa data passada | `/dashboard/resumo`, `/relatorios/resumo` | Parte dos saldos de hoje e desfaz o que entrou e saiu depois. |
| Variação contra a janela anterior | `/dashboard/resumo`, `/relatorios/resumo`, `/investimentos/carteira` | Sempre a janela de **mesmo tamanho** imediatamente anterior. |
| Distribuição, rentabilidade e evolução da carteira | `/investimentos/carteira` | A curva de aportes se apoia em `dataInicio`. |
| Consumo e projeção de ritmo do orçamento | `/orcamentos/visao-geral` | Projeção só a partir do décimo dia do mês. |
| Custo mensal equivalente das recorrentes | `/despesas-recorrentes` | A anual entra dividida por doze; a semanal, multiplicada por 4,3452. |
| Análise e leitura de uma meta | `/metas` | Posição na faixa antes da média; `PRIMEIRO` quando há um registro só. |
| Projeção de saldo | `/previsao` | O gasto variável é um resto: média de despesa menos recorrentes. As parcelas não são lançamentos e não entram no desconto. |
| Agrupamento em baldes | `/relatorios/resumo` | Dia, semana ou mês conforme a duração do recorte. |
| Derivação dos avisos | `/avisos` | Faturas a vencer ou vencidas há até 15 dias, lançamentos próximos e cartões com 70% ou mais do limite. |

Três coisas que o contrato deliberadamente **não** pede, e que não devem ser inventadas: pagamento
ou quitação de fatura, histórico de cotação por ativo, e exportação de relatório em PDF ou CSV.
