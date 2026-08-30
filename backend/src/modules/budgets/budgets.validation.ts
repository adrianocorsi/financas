import { z } from "zod";
import { objectIdSchema } from "../../utils/commonValidation";

export const createBudgetSchema = z.object({
  categoryId: objectIdSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  plannedAmount: z.number().positive(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
});

export const budgetsStatusQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});
