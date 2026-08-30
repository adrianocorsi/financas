# Sistema de Controle Financeiro Pessoal (Mensal) — Especificação Técnica

## 1. Visão Geral

Sistema web para controle financeiro pessoal organizado por **competência mensal**, permitindo:
- Cadastro de lançamentos (receitas e despesas)
- Baixa de lançamentos (confirmação de pagamento/recebimento)
- Cálculos automáticos e visualizações (saldo, projeções, categorias)
- API REST para consumo pelo frontend (e futuros integradores: app mobile, planilhas, etc.)

**Stack sugerida** (ajuste conforme sua preferência):
- Backend: Node.js (Express/Fastify) ou Python (FastAPI)
- Banco de dados: PostgreSQL
- Frontend: React ou Vue + biblioteca de gráficos (Recharts, Chart.js)
- Autenticação: JWT

---

## 2. Conceitos-Chave

| Conceito | Definição |
|---|---|
| **Lançamento** | Um registro de receita ou despesa, previsto ou já ocorrido |
| **Baixa** | Ato de marcar um lançamento como efetivamente pago/recebido, com data e valor real |
| **Competência** | Mês/ano ao qual o lançamento pertence (independe da data de pagamento) |
| **Recorrência** | Lançamento que se repete automaticamente todo mês (ex: aluguel, salário) |
| **Categoria** | Classificação do lançamento (ex: Alimentação, Transporte, Salário) |
| **Conta** | Origem/destino do dinheiro (ex: Conta Corrente, Carteira, Cartão de Crédito) |

---

## 3. Modelagem de Dados

### 3.1 `users`
```
id              UUID (PK)
name            VARCHAR
email           VARCHAR (unique)
password_hash   VARCHAR
created_at      TIMESTAMP
```

### 3.2 `accounts` (contas/carteiras)
```
id              UUID (PK)
user_id         UUID (FK -> users)
name            VARCHAR         -- "Conta Corrente", "Nubank", "Carteira"
type            ENUM(corrente, poupanca, cartao_credito, dinheiro, investimento)
initial_balance NUMERIC(12,2)
created_at      TIMESTAMP
```

### 3.3 `categories`
```
id              UUID (PK)
user_id         UUID (FK -> users)
name            VARCHAR
type            ENUM(receita, despesa)
color           VARCHAR         -- para uso no frontend
icon            VARCHAR (opcional)
parent_id       UUID (FK -> categories, opcional) -- subcategorias
```

### 3.4 `entries` (lançamentos)
```
id                  UUID (PK)
user_id             UUID (FK -> users)
account_id          UUID (FK -> accounts)
category_id         UUID (FK -> categories)
description         VARCHAR
type                ENUM(receita, despesa)
amount_expected     NUMERIC(12,2)   -- valor previsto
amount_paid         NUMERIC(12,2)   -- valor efetivamente baixado (null até a baixa)
due_date            DATE            -- data de vencimento prevista
paid_date           DATE            -- data em que foi baixado (null se pendente)
competence_month    INT             -- 1-12
competence_year     INT
status              ENUM(pendente, pago, atrasado, cancelado)
is_recurring        BOOLEAN
recurrence_id       UUID (FK -> recurrences, nullable)
installment_current INT (nullable)  -- ex: parcela 2
installment_total   INT (nullable)  -- ex: de 12
notes               TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### 3.5 `recurrences` (regras de recorrência)
```
id              UUID (PK)
user_id         UUID (FK -> users)
description     VARCHAR
category_id     UUID (FK -> categories)
account_id      UUID (FK -> accounts)
type            ENUM(receita, despesa)
amount          NUMERIC(12,2)
day_of_month    INT             -- dia de vencimento (ex: 5, 10, 30)
frequency       ENUM(mensal, quinzenal, anual)
start_date      DATE
end_date        DATE (nullable) -- null = indeterminado
active          BOOLEAN
```

> Um "job" mensal (cron) gera automaticamente os `entries` do mês a partir das `recurrences` ativas.

### 3.6 `budgets` (orçamento por categoria/mês — opcional, fase 2)
```
id              UUID (PK)
user_id         UUID (FK -> users)
category_id     UUID (FK -> categories)
month           INT
year            INT
planned_amount  NUMERIC(12,2)
```

---

## 4. Regras de Negócio Importantes

1. **Status calculado automaticamente:**
   - `pendente`: sem `paid_date`, `due_date` >= hoje
   - `atrasado`: sem `paid_date`, `due_date` < hoje
   - `pago`: possui `paid_date`
   - `cancelado`: definido manualmente

2. **Baixa parcial**: permitir `amount_paid` diferente de `amount_expected` (ex: pagou só uma parte da fatura) — decidir se isso gera um novo lançamento residual ou fica registrado como diferença.

3. **Saldo por conta**: `initial_balance + soma(receitas pagas) - soma(despesas pagas)`, filtrado por conta e período.

4. **Fechamento do mês**: ao virar o mês, lançamentos não pagos do mês anterior podem ser:
   - Marcados como atrasados (ficam no mês de origem), ou
   - Transferidos para o mês atual (rollover) — deixar configurável.

5. **Cartão de crédito**: despesas no cartão pertencem à competência da fatura, não à data da compra (regra de "fechamento de fatura" — considerar campo `closing_day` na conta).

---

## 5. Endpoints da API (REST)

### Autenticação
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
```

### Contas
```
GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/accounts/:id/balance          -- saldo atual da conta
```

### Categorias
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Lançamentos (entries)
```
GET    /api/entries?month=8&year=2026&status=pendente&category_id=...
POST   /api/entries
GET    /api/entries/:id
PUT    /api/entries/:id
DELETE /api/entries/:id
PATCH  /api/entries/:id/baixar            -- efetiva a baixa (paid_date, amount_paid)
PATCH  /api/entries/:id/cancelar
PATCH  /api/entries/:id/estornar          -- desfaz uma baixa
```

**Exemplo — baixar lançamento:**
```json
PATCH /api/entries/:id/baixar
{
  "paid_date": "2026-08-15",
  "amount_paid": 350.00,
  "account_id": "uuid-da-conta"
}
```

### Recorrências
```
GET    /api/recurrences
POST   /api/recurrences
PUT    /api/recurrences/:id
DELETE /api/recurrences/:id
POST   /api/recurrences/generate-month    -- força geração manual dos lançamentos do mês
```

### Dashboard / Relatórios (cálculos e visualizações)
```
GET /api/dashboard/resumo-mensal?month=8&year=2026
GET /api/dashboard/fluxo-caixa?month_start=1&month_end=12&year=2026
GET /api/dashboard/gastos-por-categoria?month=8&year=2026
GET /api/dashboard/comparativo-mensal?year=2026
GET /api/dashboard/projecao-saldo?months_ahead=3
GET /api/dashboard/evolucao-patrimonio?year=2026
```

---

## 6. Cálculos Necessários (detalhados)

### 6.1 Resumo mensal
```
total_receitas_previstas  = Σ amount_expected WHERE type=receita AND competencia=mês
total_receitas_realizadas = Σ amount_paid WHERE type=receita AND paid_date IN mês
total_despesas_previstas  = Σ amount_expected WHERE type=despesa AND competencia=mês
total_despesas_realizadas = Σ amount_paid WHERE type=despesa AND paid_date IN mês

saldo_previsto   = total_receitas_previstas - total_despesas_previstas
saldo_realizado  = total_receitas_realizadas - total_despesas_realizadas
percentual_gasto = total_despesas_realizadas / total_receitas_realizadas * 100
```

### 6.2 Gastos por categoria (para gráfico pizza/donut)
```
GROUP BY category_id
  SUM(amount_paid) as total
  COUNT(*) as quantidade_lancamentos
  AVG(amount_paid) as ticket_medio
ORDER BY total DESC
```

### 6.3 Fluxo de caixa (para gráfico de linha, últimos N meses)
```
Para cada mês:
  entradas = Σ amount_paid (receitas)
  saidas   = Σ amount_paid (despesas)
  saldo_do_mes = entradas - saidas
  saldo_acumulado = saldo_acumulado_anterior + saldo_do_mes
```

### 6.4 Projeção de saldo futuro
```
Baseado em recorrências ativas + lançamentos futuros já cadastrados:
saldo_projetado(mês+N) = saldo_atual + Σ(receitas previstas até mês+N) - Σ(despesas previstas até mês+N)
```

### 6.5 Comparativo ano a ano / mês a mês
```
variação % = (valor_mes_atual - valor_mes_anterior) / valor_mes_anterior * 100
```

### 6.6 Indicadores adicionais (opcionais, úteis)
- **Taxa de poupança**: `(receitas - despesas) / receitas * 100`
- **Maior gasto do mês** (single query, ORDER BY amount DESC LIMIT 1)
- **Dias até o próximo vencimento** por lançamento pendente
- **Alerta de orçamento estourado**: comparar `budgets.planned_amount` vs gasto real por categoria

---

## 7. Visualizações Sugeridas (Frontend)

| Visualização | Tipo de gráfico | Dados usados |
|---|---|---|
| Saldo do mês (previsto vs realizado) | Cards numéricos | 6.1 |
| Gastos por categoria | Pizza/Donut | 6.2 |
| Evolução do saldo (6-12 meses) | Linha | 6.3 |
| Receitas vs Despesas por mês | Barras agrupadas | 6.3 |
| Projeção dos próximos meses | Linha tracejada | 6.4 |
| Lista de lançamentos pendentes/atrasados | Tabela com destaque de cor | `entries` filtrado |
| Progresso do orçamento por categoria | Barra de progresso | 6.6 |

---

## 8. Estrutura de Pastas Sugerida (Backend)

```
/src
  /modules
    /auth
    /accounts
    /categories
    /entries
    /recurrences
    /dashboard
  /jobs
    generateRecurringEntries.js   -- cron mensal
    updateOverdueStatus.js        -- cron diário
  /middlewares
  /utils
  /database
    /migrations
    /seeds
```

---

## 9. Roadmap de Desenvolvimento Sugerido

### Fase 1 — MVP
- [ ] Autenticação
- [ ] CRUD de contas, categorias e lançamentos
- [ ] Baixa manual de lançamento
- [ ] Resumo mensal simples (6.1)

### Fase 2 — Automação
- [ ] Recorrências e geração automática mensal
- [ ] Atualização automática de status (cron atrasado)
- [ ] Gastos por categoria (gráfico)

### Fase 3 — Inteligência
- [ ] Projeção de saldo futuro
- [ ] Orçamentos por categoria e alertas
- [ ] Comparativos mensais/anuais

### Fase 4 — Extras
- [ ] Exportação (CSV/PDF)
- [ ] Múltiplas contas/cartões com fatura
- [ ] Compartilhamento familiar (múltiplos usuários numa mesma "casa")

---

## 10. Pontos de Decisão (defina antes de começar)

1. Vai suportar **múltiplas moedas**?
2. Cartão de crédito terá lógica de **fatura/fechamento** separada?
3. Lançamentos atrasados **migram** para o mês atual ou ficam no mês de origem?
4. Vai ter **app mobile** no futuro (afeta design da API — manter tudo desacoplado)?
5. Autenticação própria ou usar OAuth (Google/etc.)?
