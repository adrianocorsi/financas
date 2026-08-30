import { EntryStatus } from "../models/Entry";
import { toUTCDateOnly } from "./dateOnly";

interface StatusInput {
  paidDate: Date | null;
  dueDate: Date;
  currentStatus: EntryStatus;
}

// Regra de negócio (spec seção 4.1):
// - cancelado é sempre manual, nunca recalculado automaticamente aqui
// - pago: possui paidDate
// - atrasado: sem paidDate e dueDate < hoje
// - pendente: sem paidDate e dueDate >= hoje
export function computeEntryStatus({ paidDate, dueDate, currentStatus }: StatusInput): EntryStatus {
  if (currentStatus === "cancelado") return "cancelado";
  if (paidDate) return "pago";

  const today = toUTCDateOnly(new Date());
  const due = toUTCDateOnly(dueDate);

  return due < today ? "atrasado" : "pendente";
}
