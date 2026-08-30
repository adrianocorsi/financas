import { z } from "zod";
import { ENTRY_TYPES } from "../../models/Category";
import { RECURRENCE_FREQUENCIES } from "../../models/Recurrence";
import { objectIdSchema } from "../../utils/commonValidation";

export const createRecurrenceSchema = z.object({
  description: z.string().min(1),
  categoryId: objectIdSchema,
  accountId: objectIdSchema,
  type: z.enum(ENTRY_TYPES),
  amount: z.number().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
  frequency: z.enum(RECURRENCE_FREQUENCIES).default("mensal"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
});

export const updateRecurrenceSchema = createRecurrenceSchema.partial();

export const generateMonthSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});
