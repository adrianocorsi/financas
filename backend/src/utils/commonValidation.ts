import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "id inválido");

export const idParamSchema = z.object({
  id: objectIdSchema,
});
