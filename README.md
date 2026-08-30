# Sistema de Controle Financeiro Pessoal

Implementação do backend descrito em [spec-sistema-financas-pessoais.md](spec-sistema-financas-pessoais.md).

## Stack escolhida

- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: MongoDB (Mongoose) — *diferente da sugestão original de PostgreSQL da spec*. O modelo relacional foi adaptado para documentos: FKs viraram `ObjectId` com `ref`, `ENUM` viraram union types + validação no schema, e os `GROUP BY/SUM` de relatórios (seção 6) viraram pipelines de `aggregate()`.
- **Autenticação**: JWT próprio (access + refresh token), com `bcryptjs` para hash de senha.
- **Validação**: Zod (`src/modules/**/*.validation.ts`).
- **Jobs**: `node-cron`, dois jobs conforme seção 8 da spec.
- **Frontend**: React + Vite + TypeScript, `react-router-dom` para rotas, `axios` para HTTP (com refresh automático de token em 401) e `recharts` para os gráficos.

## Decisões assumidas (seção 10 da spec)

Como não foram confirmadas, segui com os seguintes padrões — fáceis de revisar, todos isolados em código:

1. **Múltiplas moedas**: não suportado por ora (valores em `Number`, moeda única implícita).
2. **Fatura de cartão de crédito**: `Account` tem campo opcional `closingDay` (dia de fechamento), mas a lógica de "compra após fechamento cai na competência do mês seguinte" ainda **não está implementada** nos endpoints de `entries` — precisa ser adicionada quando o fluxo de cartão for detalhado.
3. **Lançamentos atrasados**: ficam no mês de competência de origem (não há rollover automático). O job diário só atualiza o `status` para `atrasado`, não move o lançamento de mês.
4. **App mobile futuro**: API mantida desacoplada (REST puro, stateless via JWT), sem suposições de frontend específico.
5. **Autenticação**: JWT próprio, sem OAuth.
6. **Baixa parcial** (seção 4.2): fica registrada como diferença no próprio lançamento (`amountPaid` ≠ `amountExpected`); **não** gera lançamento residual automaticamente — revisar se isso for necessário.

## Estrutura

```
/backend
  /src
    /config          -- env e conexão Mongo
    /models          -- schemas Mongoose (User, Account, Category, Entry, Recurrence, Budget)
    /modules
      /auth          -- registro, login, refresh
      /accounts      -- CRUD + saldo por conta
      /categories    -- CRUD
      /entries       -- CRUD + baixar/cancelar/estornar
      /recurrences   -- CRUD + generate-month
      /dashboard     -- os 6 relatórios da seção 6 da spec
    /jobs            -- generateRecurringEntries (mensal), updateOverdueStatus (diário)
    /middlewares     -- auth, validação (Zod), erro central, 404
    /routes           -- agregador /api
    /database/seeds  -- usuário + categorias + conta demo
    /utils
    app.ts
    server.ts
```

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env      # ajuste se necessário

# sobe um MongoDB local via Docker (ou aponte MONGO_URI para um já existente)
docker compose up -d

npm run seed               # cria usuário demo@financas.local / senha demo1234
npm run dev                # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL, aponta para o backend acima
npm run dev                 # http://localhost:5173
```

Login com o usuário demo criado pelo seed (`demo@financas.local` / `demo1234`), ou cadastre um novo pela tela de registro.

## Orçamentos (fase 2/3)

- [x] CRUD de `budgets` (`/api/budgets`)
- [x] `GET /api/budgets/status?month=&year=` — compara `plannedAmount` vs gasto real por categoria e sinaliza `estourado` (regra 6.6)

## Nota técnica: datas em UTC

Todas as datas de calendário (`dueDate`, `paidDate`, `startDate`/`endDate` de recorrência, ranges de mês nos relatórios) são tratadas consistentemente em **UTC** (`src/utils/dateOnly.ts`), porque o Zod (`z.coerce.date()`) interpreta strings ISO como `"2026-08-10"` em UTC. Construir ou ler essas mesmas datas com `new Date(y, m, d)`/`getMonth()` (hora local) causa desalinhamento em qualquer timezone com offset negativo (ex: Brasil, UTC-3) — lançamentos do dia 1 ou perto da virada do mês podem cair no mês errado. Um teste (`recurrences.service.test.ts`) pegou esse bug numa recorrência anual; foi corrigido em `entryStatus.ts`, `recurrences.service.ts`, `dashboard.service.ts` e `jobs/updateOverdueStatus.ts`.

## Testes

```bash
cd backend
npm test
```

Cobrem por enquanto apenas lógica pura (cálculo de status, geração de datas de recorrência) — sem dependência de banco. Testes de integração com Mongo ainda não foram adicionados.

## O que já funciona (Fase 1 + parte da Fase 2 do roadmap)

- [x] Autenticação (register/login/refresh)
- [x] CRUD de contas, categorias e lançamentos
- [x] Baixa manual, cancelamento e estorno de lançamento
- [x] Resumo mensal (6.1)
- [x] Recorrências + geração automática mensal (cron) e manual (`POST /recurrences/generate-month`)
- [x] Atualização automática de status "atrasado" (cron diário)
- [x] Gastos por categoria (6.2), fluxo de caixa (6.3), comparativo mensal (6.5), projeção de saldo (6.4), evolução de patrimônio

## Frontend — o que já tem

- [x] Login/cadastro (JWT, refresh automático em 401)
- [x] Dashboard: cards do resumo mensal, gráfico de gastos por categoria (pizza) e fluxo de caixa (linha, 6 meses)
- [x] Lançamentos: listagem com filtros (mês/ano/status), criação, baixar/cancelar/estornar/excluir
- [x] Contas: CRUD + cálculo de saldo sob demanda
- [x] Categorias: CRUD
- [x] Recorrências: CRUD + geração manual do mês
- [x] Orçamentos: CRUD + visão de status (planejado vs. gasto real, com alerta de estourado)

Fora do escopo desta rodada: comparativo mensal / projeção de saldo / evolução de patrimônio ainda não têm tela própria (endpoints já existem no backend, ver `src/api/dashboard.ts`); estilo é minimalista (CSS puro, sem design system).

## Ainda não implementado

- [ ] Lógica de fechamento de fatura de cartão de crédito
- [ ] Testes de integração (com banco real/em memória) e testes de frontend
- [ ] Telas de comparativo mensal, projeção de saldo e evolução de patrimônio
