import { z } from "zod";
import { ACCOUNT_TYPES } from "../../models/Account";

export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  initialBalance: z.number().default(0),
  closingDay: z.number().int().min(1).max(31).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export const balanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
});
