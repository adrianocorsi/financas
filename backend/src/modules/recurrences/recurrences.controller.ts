import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as recurrencesService from "./recurrences.service";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const recurrences = await recurrencesService.listRecurrences(req.userId!);
  res.json(recurrences);
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const recurrence = await recurrencesService.createRecurrence(req.userId!, req.body);
  res.status(201).json(recurrence);
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const recurrence = await recurrencesService.updateRecurrence(req.userId!, req.params.id, req.body);
  res.json(recurrence);
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  await recurrencesService.deleteRecurrence(req.userId!, req.params.id);
  res.status(204).send();
});

export const generateMonthHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.body;
  const created = await recurrencesService.generateEntriesForMonth(req.userId!, month, year);
  res.status(201).json({ generated: created.length, entries: created });
});
