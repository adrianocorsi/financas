import { z } from "zod";
import { Entry } from "../../models/Entry";
import { AppError } from "../../utils/AppError";
import { computeEntryStatus } from "../../utils/entryStatus";
import { baixarEntrySchema, createEntrySchema, listEntriesQuerySchema, updateEntrySchema } from "./entries.validation";

type CreateInput = z.infer<typeof createEntrySchema>;
type UpdateInput = z.infer<typeof updateEntrySchema>;
type ListQuery = z.infer<typeof listEntriesQuerySchema>;
type BaixarInput = z.infer<typeof baixarEntrySchema>;

export function listEntries(userId: string, query: ListQuery) {
  const filter: Record<string, unknown> = { userId };
  if (query.month) filter.competenceMonth = query.month;
  if (query.year) filter.competenceYear = query.year;
  if (query.status) filter.status = query.status;
  if (query.category_id) filter.categoryId = query.category_id;
  if (query.account_id) filter.accountId = query.account_id;

  return Entry.find(filter).sort({ dueDate: 1 });
}

export async function getEntry(userId: string, id: string) {
  const entry = await Entry.findOne({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");
  return entry;
}

export function createEntry(userId: string, input: CreateInput) {
  const status = computeEntryStatus({ paidDate: null, dueDate: input.dueDate, currentStatus: "pendente" });
  return Entry.create({ ...input, userId, status, amountPaid: null, paidDate: null });
}

export async function updateEntry(userId: string, id: string, input: UpdateInput) {
  const entry = await Entry.findOne({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");

  Object.assign(entry, input);
  // Se a data de vencimento mudou e o lançamento ainda não foi baixado/cancelado, recalcula o status.
  entry.status = computeEntryStatus({ paidDate: entry.paidDate, dueDate: entry.dueDate, currentStatus: entry.status });
  await entry.save();
  return entry;
}

export async function deleteEntry(userId: string, id: string) {
  const entry = await Entry.findOneAndDelete({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");
}

// PATCH /entries/:id/baixar — confirma pagamento/recebimento (spec seção 5).
// Baixa parcial é permitida: amount_paid pode divergir de amount_expected;
// a diferença fica apenas registrada no próprio lançamento (não gera lançamento residual — ver README, decisão em aberto).
export async function baixarEntry(userId: string, id: string, input: BaixarInput) {
  const entry = await Entry.findOne({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");
  if (entry.status === "cancelado") {
    throw new AppError("Não é possível baixar um lançamento cancelado", 409);
  }

  entry.paidDate = input.paid_date;
  entry.amountPaid = input.amount_paid;
  if (input.account_id) entry.accountId = input.account_id as any;
  entry.status = "pago";
  await entry.save();
  return entry;
}

export async function cancelarEntry(userId: string, id: string) {
  const entry = await Entry.findOne({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");
  if (entry.status === "pago") {
    throw new AppError("Não é possível cancelar um lançamento já pago — estorne a baixa primeiro", 409);
  }

  entry.status = "cancelado";
  await entry.save();
  return entry;
}

// PATCH /entries/:id/estornar — desfaz uma baixa, voltando o lançamento a pendente/atrasado.
export async function estornarEntry(userId: string, id: string) {
  const entry = await Entry.findOne({ _id: id, userId });
  if (!entry) throw AppError.notFound("Lançamento");
  if (entry.status !== "pago") {
    throw new AppError("Somente lançamentos pagos podem ser estornados", 409);
  }

  entry.paidDate = null;
  entry.amountPaid = null;
  entry.status = computeEntryStatus({ paidDate: null, dueDate: entry.dueDate, currentStatus: "pendente" });
  await entry.save();
  return entry;
}
