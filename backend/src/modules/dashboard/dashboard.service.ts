import { Types } from "mongoose";
import { Entry } from "../../models/Entry";
import { Account } from "../../models/Account";
import { toUTCDateOnly, utcDate } from "../../utils/dateOnly";

// paidDate é coagida por z.coerce.date() a partir de string ISO ("2026-08-15"), interpretada em UTC.
// O range do mês precisa ser construído em UTC também, senão lançamentos do dia 1 (ou próximos das
// bordas do mês) vazam para o mês vizinho em qualquer timezone com offset negativo (ex: Brasil, UTC-3).
function monthRange(month: number, year: number): { start: Date; end: Date } {
  const start = utcDate(year, month, 1);
  const end = month === 12 ? utcDate(year + 1, 1, 1) : utcDate(year, month + 1, 1); // exclusivo
  return { start, end };
}

async function sumAmountExpected(userId: string, type: "receita" | "despesa", month: number, year: number) {
  const [result] = await Entry.aggregate([
    { $match: { userId: new Types.ObjectId(userId), type, competenceMonth: month, competenceYear: year } },
    { $group: { _id: null, total: { $sum: "$amountExpected" } } },
  ]);
  return result?.total ?? 0;
}

async function sumAmountPaid(userId: string, type: "receita" | "despesa", month: number, year: number) {
  const { start, end } = monthRange(month, year);
  const [result] = await Entry.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type,
        amountPaid: { $ne: null },
        paidDate: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountPaid" } } },
  ]);
  return result?.total ?? 0;
}

// 6.1 — Resumo mensal
export async function resumoMensal(userId: string, month: number, year: number) {
  const [totalReceitasPrevistas, totalDespesasPrevistas, totalReceitasRealizadas, totalDespesasRealizadas] =
    await Promise.all([
      sumAmountExpected(userId, "receita", month, year),
      sumAmountExpected(userId, "despesa", month, year),
      sumAmountPaid(userId, "receita", month, year),
      sumAmountPaid(userId, "despesa", month, year),
    ]);

  const saldoPrevisto = totalReceitasPrevistas - totalDespesasPrevistas;
  const saldoRealizado = totalReceitasRealizadas - totalDespesasRealizadas;
  const percentualGasto = totalReceitasRealizadas > 0 ? (totalDespesasRealizadas / totalReceitasRealizadas) * 100 : 0;

  return {
    month,
    year,
    totalReceitasPrevistas,
    totalReceitasRealizadas,
    totalDespesasPrevistas,
    totalDespesasRealizadas,
    saldoPrevisto,
    saldoRealizado,
    percentualGasto,
  };
}

// 6.2 — Gastos por categoria (pizza/donut)
export async function gastosPorCategoria(
  userId: string,
  month: number,
  year: number,
  type: "receita" | "despesa"
) {
  const { start, end } = monthRange(month, year);

  return Entry.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type,
        amountPaid: { $ne: null },
        paidDate: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amountPaid" },
        quantidadeLancamentos: { $sum: 1 },
        ticketMedio: { $avg: "$amountPaid" },
      },
    },
    { $sort: { total: -1 } },
    {
      $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        categoryName: "$category.name",
        categoryColor: "$category.color",
        total: 1,
        quantidadeLancamentos: 1,
        ticketMedio: 1,
      },
    },
  ]);
}

// 6.3 — Fluxo de caixa (linha, N meses)
export async function fluxoCaixa(userId: string, monthStart: number, monthEnd: number, year: number) {
  const months: number[] = [];
  for (let m = monthStart; m <= monthEnd; m++) months.push(m);

  let saldoAcumulado = 0;
  const series = [];
  for (const month of months) {
    const [entradas, saidas] = await Promise.all([
      sumAmountPaid(userId, "receita", month, year),
      sumAmountPaid(userId, "despesa", month, year),
    ]);
    const saldoDoMes = entradas - saidas;
    saldoAcumulado += saldoDoMes;
    series.push({ month, year, entradas, saidas, saldoDoMes, saldoAcumulado });
  }
  return series;
}

// 6.5 — Comparativo mês a mês, para um ano inteiro
export async function comparativoMensal(userId: string, year: number) {
  const series = [];
  let valorAnterior: number | null = null;

  for (let month = 1; month <= 12; month++) {
    const [entradas, saidas] = await Promise.all([
      sumAmountPaid(userId, "receita", month, year),
      sumAmountPaid(userId, "despesa", month, year),
    ]);
    const saldo = entradas - saidas;
    const variacaoPercentual =
      valorAnterior !== null && valorAnterior !== 0 ? ((saldo - valorAnterior) / Math.abs(valorAnterior)) * 100 : null;

    series.push({ month, year, entradas, saidas, saldo, variacaoPercentual });
    valorAnterior = saldo;
  }
  return series;
}

// 6.4 — Projeção de saldo futuro, baseada em lançamentos já cadastrados (previstos, ainda não pagos).
// Recorrências ativas sem lançamento gerado ainda não entram aqui — rode /recurrences/generate-month
// (ou o cron mensal) antes de projetar, para que elas já existam como `entries` previstos.
export async function projecaoSaldo(userId: string, monthsAhead: number) {
  const accounts = await Account.find({ userId });
  const saldoAtual = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);

  // Normalizado para meia-noite UTC: garante que um lançamento com vencimento hoje entre na
  // projeção (senão o horário atual poderia cair depois da meia-noite UTC do próprio dia).
  const today = toUTCDateOnly(new Date());
  const limiteMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 0);
  const limite = utcDate(limiteMonthsFromNow.getFullYear(), limiteMonthsFromNow.getMonth() + 1, limiteMonthsFromNow.getDate());

  const [receitasFuturas, despesasFuturas] = await Promise.all([
    Entry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: "receita",
          amountPaid: null,
          dueDate: { $gte: today, $lte: limite },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountExpected" } } },
    ]),
    Entry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: "despesa",
          amountPaid: null,
          dueDate: { $gte: today, $lte: limite },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountExpected" } } },
    ]),
  ]);

  const totalReceitasFuturas = receitasFuturas[0]?.total ?? 0;
  const totalDespesasFuturas = despesasFuturas[0]?.total ?? 0;

  return {
    monthsAhead,
    saldoAtual,
    totalReceitasFuturasPrevistas: totalReceitasFuturas,
    totalDespesasFuturasPrevistas: totalDespesasFuturas,
    saldoProjetado: saldoAtual + totalReceitasFuturas - totalDespesasFuturas,
  };
}

// Evolução de patrimônio: saldo acumulado mês a mês partindo do saldo inicial das contas.
export async function evolucaoPatrimonio(userId: string, year: number) {
  const accounts = await Account.find({ userId });
  const saldoInicial = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);

  let saldoAcumulado = saldoInicial;
  const series = [];
  for (let month = 1; month <= 12; month++) {
    const [entradas, saidas] = await Promise.all([
      sumAmountPaid(userId, "receita", month, year),
      sumAmountPaid(userId, "despesa", month, year),
    ]);
    saldoAcumulado += entradas - saidas;
    series.push({ month, year, patrimonio: saldoAcumulado });
  }
  return series;
}

// Alerta do dashboard: lançamentos ainda não pagos/cancelados cuja competência é
// de um mês anterior ao selecionado — "contas em aberto de meses anteriores".
// Note: um lançamento assim quase sempre já está com status "atrasado" (due_date no
// passado), mas incluímos "pendente" também para cobrir o caso de due_date futura
// numa competência já encerrada (ex.: fatura de cartão fechada antecipadamente).
export async function pendenciasAnteriores(userId: string, month: number, year: number) {
  const entries = await Entry.find({
    userId: new Types.ObjectId(userId),
    status: { $in: ["pendente", "atrasado"] },
    $or: [{ competenceYear: { $lt: year } }, { competenceYear: year, competenceMonth: { $lt: month } }],
  })
    .sort({ competenceYear: 1, competenceMonth: 1, dueDate: 1 })
    .populate("categoryId", "name color");

  const total = entries.reduce((sum, e) => sum + e.amountExpected, 0);

  return {
    count: entries.length,
    total,
    entries: entries.map((e) => ({
      id: e._id,
      description: e.description,
      amountExpected: e.amountExpected,
      dueDate: e.dueDate,
      competenceMonth: e.competenceMonth,
      competenceYear: e.competenceYear,
      status: e.status,
      categoryName: (e.categoryId as any)?.name as string | undefined,
      categoryColor: (e.categoryId as any)?.color as string | undefined,
    })),
  };
}
