import { z } from "zod";
import { ENTRY_TYPES } from "../../models/Category";
import { objectIdSchema } from "../../utils/commonValidation";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(ENTRY_TYPES),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: objectIdSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
