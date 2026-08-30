import { z } from "zod";
import { ENTRY_STATUSES } from "../../models/Entry";
import { ENTRY_TYPES } from "../../models/Category";
import { objectIdSchema } from "../../utils/commonValidation";

export const createEntrySchema = z.object({
  accountId: objectIdSchema,
  categoryId: objectIdSchema,
  description: z.string().min(1),
  type: z.enum(ENTRY_TYPES),
  amountExpected: z.number().positive(),
  dueDate: z.coerce.date(),
  competenceMonth: z.number().int().min(1).max(12),
  competenceYear: z.number().int(),
  isRecurring: z.boolean().optional(),
  recurrenceId: objectIdSchema.optional(),
  installmentCurrent: z.number().int().positive().optional(),
  installmentTotal: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

// Mantém os nomes de query usados na spec (seção 5): month, year, status, category_id
export const listEntriesQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  category_id: objectIdSchema.optional(),
  account_id: objectIdSchema.optional(),
});

// Mantém os nomes de body usados no exemplo da spec (seção 5): paid_date, amount_paid, account_id
export const baixarEntrySchema = z.object({
  paid_date: z.coerce.date(),
  amount_paid: z.number().positive(),
  account_id: objectIdSchema.optional(),
});
