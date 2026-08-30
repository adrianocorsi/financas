import { z } from "zod";

export const resumoMensalQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});

export const gastosPorCategoriaQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
  type: z.enum(["receita", "despesa"]).default("despesa"),
});

export const fluxoCaixaQuerySchema = z.object({
  month_start: z.coerce.number().int().min(1).max(12),
  month_end: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});

export const comparativoMensalQuerySchema = z.object({
  year: z.coerce.number().int(),
});

export const projecaoSaldoQuerySchema = z.object({
  months_ahead: z.coerce.number().int().min(1).max(24).default(3),
});

export const evolucaoPatrimonioQuerySchema = z.object({
  year: z.coerce.number().int(),
});

export const pendenciasAnterioresQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});
