import cron from "node-cron";
import { Entry } from "../models/Entry";
import { toUTCDateOnly } from "../utils/dateOnly";

/**
 * Job diário (spec seção 8): recalcula o status de lançamentos não pagos/cancelados
 * comparando due_date com a data atual (regra da seção 4.1).
 */
export async function runUpdateOverdueStatus(): Promise<void> {
  // dueDate é gravada em UTC (via z.coerce.date()), então "hoje" precisa ser comparado
  // em UTC também — ver src/utils/dateOnly.ts para o porquê.
  const today = toUTCDateOnly(new Date());

  const overdueResult = await Entry.updateMany(
    { status: "pendente", paidDate: null, dueDate: { $lt: today } },
    { $set: { status: "atrasado" } }
  );

  // Caso a due_date de um lançamento "atrasado" seja adiada para o futuro, ele volta a pendente.
  const restoredResult = await Entry.updateMany(
    { status: "atrasado", paidDate: null, dueDate: { $gte: today } },
    { $set: { status: "pendente" } }
  );

  console.log(
    `[jobs] updateOverdueStatus: ${overdueResult.modifiedCount} marcado(s) como atrasado, ` +
      `${restoredResult.modifiedCount} restaurado(s) para pendente`
  );
}

export function scheduleUpdateOverdueStatus(): void {
  // Todo dia, à 00:05
  cron.schedule("5 0 * * *", () => {
    runUpdateOverdueStatus().catch((err) => console.error("[jobs] falha em updateOverdueStatus:", err));
  });
}
