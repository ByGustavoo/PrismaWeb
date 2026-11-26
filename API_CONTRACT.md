# Mudanças pendentes no PrismaAPI

Este documento lista **só o que o PrismaAPI ainda precisa implementar** para acompanhar o frontend.
Quando a última pendência for implementada, o arquivo sai do repositório.

Conferido contra o código do PrismaAPI (`D:\Projetos\PrismaAPI`, `main` em `4c5c82c`, e o working
tree de 26 de Novembro de 2026): `LancamentoController`, `LancamentoDocs`, `FaturaController`,
`FaturaDocs` e `FaturaService.listar`. As convenções gerais (nomes em
português, `ErrorResponseDTO`, cache do Redis com a chave montada pelos parâmetros) continuam valendo
e não são repetidas.

O tipo de referência é [`src/types/dto/fatura/FiltroFaturaDTO.ts`](src/types/dto/fatura/FiltroFaturaDTO.ts)
e a chamada está em [`src/services/fatura/fatura.service.ts`](src/services/fatura/fatura.service.ts).

---

## 0. Publicar a paginação de lançamentos antes deste front

Não é implementação nova: está pronta no working tree do PrismaAPI, mas ainda não chegou à `main`.
Lá, `GET /lancamentos` ainda devolve `List<LancamentoDTO>` e não existe `GET /lancamentos/{id}`. A tela
de Lançamentos daqui lê `PaginaLancamentosDTO` (`itens`, `quantidadeTotal`, `quantidadePaginas`,
`resultado`), manda `pagina`, `tamanho`, `ordenacao` e `direcao`, e abre `?editar=<id>` por
`GET /lancamentos/{id}`. Com a API da `main`, a tela quebra.

**A imagem do PrismaAPI com essas mudanças precisa estar publicada antes de este front ir para
produção.** Esta seção sai daqui quando elas estiverem na `main` do PrismaAPI.

---

## 1. Recorte por mês em `GET /faturas`

**Hoje:** `GET /faturas` aceita só `idCartao` e devolve todas as faturas de todos os cartões de
crédito, de todos os meses que têm despesa ou parcela, passados e futuros. A lista cresce um item por
cartão a cada mês de uso.

**Precisa:** dois parâmetros opcionais, `dataInicial` e `dataFinal`, no formato `AAAA-MM`
(`YearMonth`), comparados com o `mes` da fatura (o mês em que ela fecha), os dois inclusivos.
Sem um deles, aquele lado fica aberto, como hoje.

```
GET /faturas?dataInicial=2026-08
GET /faturas?dataInicial=2026-10&dataFinal=2026-12
```

| Parâmetro | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `idCartao` | `UUID` | não | Já existe |
| `dataInicial` | `AAAA-MM` | não | Fatura com `mes >= dataInicial` |
| `dataFinal` | `AAAA-MM` | não | Fatura com `mes <= dataFinal` |

- `dataInicial` depois de `dataFinal` responde `400` com `RequisicaoInvalidaException("O período
  informado é inválido!")`, a mesma validação do `LancamentoService.validar`.
- O filtro vale depois do cálculo (`montarFaturas`), então a regra de situação de cada fatura não muda:
  uma fatura `VENCIDA` continua `VENCIDA` estando dentro ou fora do recorte.
- A ordem continua por `dataVencimento` e nome do cartão.
- O `@Cacheable("faturas")` já separa as respostas, porque o `KeyGenerator` do `RedisConfig` usa os
  parâmetros na chave. Nenhum `@CacheEvict` muda.

**Quem usa no frontend:**

| Tela | Recorte enviado | Por quê |
| --- | --- | --- |
| Cartões | `dataInicial` = mês passado, `dataFinal` = mês que vem | A "Fatura atual" de cada cartão é a `ABERTA` ou `FECHADA` de vencimento mais próximo, e as duas sempre fecham entre o mês passado e o seguinte |
| Faturas | `dataInicial` = primeiro mês da janela de "Faturas anteriores" (os últimos 3 ou 6 meses, contando o atual: em novembro de 2026, "Últimos 3 meses" manda `2026-09`); sem `dataInicial` em "Todas as anteriores"; nunca `dataFinal` | "Já comprometido" soma todas as faturas futuras, sem janela |

Enquanto o backend não implementar, ele ignora os dois parâmetros e devolve tudo, e o frontend
continua cortando em memória: as duas telas funcionam igual, só sem a economia de dados.

---

## Checklist

- [ ] Paginação de lançamentos e `GET /lancamentos/{id}` commitados, mergeados e publicados no PrismaAPI
- [ ] `FaturaDocs.listarFaturas` recebe `dataInicial` e `dataFinal` (`YearMonth`, opcionais) e documenta os dois
- [ ] `FaturaService.listar` filtra pelo `mes` depois de montar as faturas
- [ ] `400` quando `dataInicial` vem depois de `dataFinal`
- [ ] Testes do controller e do service para os dois lados abertos, o recorte fechado e o `400`
- [ ] `collection.json` com os dois parâmetros
