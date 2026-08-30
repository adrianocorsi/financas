import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as entriesService from "./entries.service";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const entries = await entriesService.listEntries(req.userId!, req.query as any);
  res.json(entries);
});

export const getHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.getEntry(req.userId!, req.params.id);
  res.json(entry);
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.createEntry(req.userId!, req.body);
  res.status(201).json(entry);
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.updateEntry(req.userId!, req.params.id, req.body);
  res.json(entry);
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  await entriesService.deleteEntry(req.userId!, req.params.id);
  res.status(204).send();
});

export const baixarHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.baixarEntry(req.userId!, req.params.id, req.body);
  res.json(entry);
});

export const cancelarHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.cancelarEntry(req.userId!, req.params.id);
  res.json(entry);
});

export const estornarHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await entriesService.estornarEntry(req.userId!, req.params.id);
  res.json(entry);
});
