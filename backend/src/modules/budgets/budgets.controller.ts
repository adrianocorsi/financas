import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as budgetsService from "./budgets.service";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const budgets = await budgetsService.listBudgets(req.userId!, req.query as any);
  res.json(budgets);
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetsService.createBudget(req.userId!, req.body);
  res.status(201).json(budget);
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetsService.updateBudget(req.userId!, req.params.id, req.body);
  res.json(budget);
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  await budgetsService.deleteBudget(req.userId!, req.params.id);
  res.status(204).send();
});

export const statusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as any;
  const status = await budgetsService.budgetsStatus(req.userId!, month, year);
  res.json(status);
});
