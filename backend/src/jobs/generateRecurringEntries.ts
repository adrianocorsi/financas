import cron from "node-cron";
import { Recurrence } from "../models/Recurrence";
import { generateEntriesForMonth } from "../modules/recurrences/recurrences.service";

/**
 * Job mensal (spec seção 3.5): gera os `entries` do mês corrente a partir das `recurrences` ativas.
 * Roda automaticamente no dia 1 de cada mês, às 01:00, para todos os usuários com recorrências ativas.
 */
export async function runGenerateRecurringEntries(referenceDate = new Date()): Promise<void> {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();

  const userIds = await Recurrence.distinct("userId", { active: true });

  let totalCreated = 0;
  for (const userId of userIds) {
    const created = await generateEntriesForMonth(userId.toString(), month, year);
    totalCreated += created.length;
  }

  console.log(`[jobs] generateRecurringEntries: ${totalCreated} lançamento(s) gerado(s) para ${month}/${year}`);
}

export function scheduleGenerateRecurringEntries(): void {
  // Todo dia 1 de cada mês, à 01:00
  cron.schedule("0 1 1 * *", () => {
    runGenerateRecurringEntries().catch((err) =>
      console.error("[jobs] falha em generateRecurringEntries:", err)
    );
  });
}
