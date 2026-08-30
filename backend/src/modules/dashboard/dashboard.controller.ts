import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as dashboardService from "./dashboard.service";

export const resumoMensalHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as any;
  res.json(await dashboardService.resumoMensal(req.userId!, month, year));
});

export const gastosPorCategoriaHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, year, type } = req.query as any;
  res.json(await dashboardService.gastosPorCategoria(req.userId!, month, year, type));
});

export const fluxoCaixaHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month_start, month_end, year } = req.query as any;
  res.json(await dashboardService.fluxoCaixa(req.userId!, month_start, month_end, year));
});

export const comparativoMensalHandler = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.query as any;
  res.json(await dashboardService.comparativoMensal(req.userId!, year));
});

export const projecaoSaldoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { months_ahead } = req.query as any;
  res.json(await dashboardService.projecaoSaldo(req.userId!, months_ahead));
});

export const evolucaoPatrimonioHandler = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.query as any;
  res.json(await dashboardService.evolucaoPatrimonio(req.userId!, year));
});

export const pendenciasAnterioresHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as any;
  res.json(await dashboardService.pendenciasAnteriores(req.userId!, month, year));
});
