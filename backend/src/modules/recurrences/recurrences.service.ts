import { z } from "zod";
import { Recurrence } from "../../models/Recurrence";
import { Entry } from "../../models/Entry";
import { AppError } from "../../utils/AppError";
import { computeEntryStatus } from "../../utils/entryStatus";
import { utcDate } from "../../utils/dateOnly";
import { createRecurrenceSchema, updateRecurrenceSchema } from "./recurrences.validation";

type CreateInput = z.infer<typeof createRecurrenceSchema>;
type UpdateInput = z.infer<typeof updateRecurrenceSchema>;

export function listRecurrences(userId: string) {
  return Recurrence.find({ userId }).sort({ createdAt: -1 });
}

export function createRecurrence(userId: string, input: CreateInput) {
  return Recurrence.create({ ...input, userId });
}

export async function updateRecurrence(userId: string, id: string, input: UpdateInput) {
  const recurrence = await Recurrence.findOneAndUpdate({ _id: id, userId }, input, { new: true });
  if (!recurrence) throw AppError.notFound("Recorrência");
  return recurrence;
}

export async function deleteRecurrence(userId: string, id: string) {
  const recurrence = await Recurrence.findOneAndDelete({ _id: id, userId });
  if (!recurrence) throw AppError.notFound("Recorrência");
}

/** Último dia válido do mês, para não estourar (ex: dayOfMonth=31 em fevereiro). */
export function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate(); // month é 1-based aqui, Date usa day=0 do próximo mês
  return Math.min(day, lastDay);
}

export function dueDatesForRecurrence(
  recurrence: Pick<InstanceType<typeof Recurrence>, "dayOfMonth" | "frequency" | "startDate">,
  month: number,
  year: number
): Date[] {
  const day = clampDay(year, month, recurrence.dayOfMonth);
  const base = utcDate(year, month, day);

  if (recurrence.frequency === "anual") {
    // startDate vem coagida por z.coerce.date() a partir de string ISO ("2026-03-01"),
    // interpretada em UTC — por isso lemos o mês com getUTCMonth(), não getMonth().
    const startMonth = recurrence.startDate.getUTCMonth() + 1;
    return startMonth === month ? [base] : [];
  }

  if (recurrence.frequency === "quinzenal") {
    const secondDay = clampDay(year, month, recurrence.dayOfMonth + 15);
    const second = utcDate(year, month, secondDay);
    return secondDay === day ? [base] : [base, second];
  }

  // mensal
  return [base];
}

/**
 * Gera os `entries` do mês/ano informados a partir das recorrências ativas do usuário.
 * Idempotente: não duplica lançamento já gerado para a mesma recorrência + competência + vencimento.
 * Usada tanto pelo endpoint manual (POST /recurrences/generate-month) quanto pelo cron mensal
 * (src/jobs/generateRecurringEntries.ts).
 */
export async function generateEntriesForMonth(userId: string, month: number, year: number) {
  const recurrences = await Recurrence.find({ userId, active: true });
  const created = [];

  for (const recurrence of recurrences) {
    const daysInMonth = new Date(year, month, 0).getDate(); // contagem de dias é timezone-agnóstica
    if (recurrence.startDate > utcDate(year, month, daysInMonth)) continue; // ainda não começou nesse mês
    if (recurrence.endDate && recurrence.endDate < utcDate(year, month, 1)) continue; // já encerrou

    const dueDates = dueDatesForRecurrence(recurrence, month, year);

    for (const dueDate of dueDates) {
      const alreadyExists = await Entry.findOne({
        userId,
        recurrenceId: recurrence._id,
        competenceMonth: month,
        competenceYear: year,
        dueDate,
      });
      if (alreadyExists) continue;

      // Receita recorrente (salário etc.) nasce já como "pago": o usuário pediu para não
      // precisar dar baixa manual todo mês nisso — se o valor mudar, ele edita a recorrência
      // (Renda) e o próximo mês gerado já sai com o valor novo. Despesa continua exigindo
      // baixa manual normalmente, pois isso é o que a spec e o resto do app esperam rastrear.
      const isReceitaAutoRealizada = recurrence.type === "receita";
      const status = isReceitaAutoRealizada
        ? "pago"
        : computeEntryStatus({ paidDate: null, dueDate, currentStatus: "pendente" });

      const entry = await Entry.create({
        userId,
        accountId: recurrence.accountId,
        categoryId: recurrence.categoryId,
        description: recurrence.description,
        type: recurrence.type,
        amountExpected: recurrence.amount,
        amountPaid: isReceitaAutoRealizada ? recurrence.amount : null,
        dueDate,
        paidDate: isReceitaAutoRealizada ? dueDate : null,
        competenceMonth: month,
        competenceYear: year,
        status,
        isRecurring: true,
        recurrenceId: recurrence._id,
      });
      created.push(entry);
    }
  }

  return created;
}
