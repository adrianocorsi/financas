import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as categoriesService from "./categories.service";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoriesService.listCategories(req.userId!);
  res.json(categories);
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.userId!, req.body);
  res.status(201).json(category);
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(req.userId!, req.params.id, req.body);
  res.json(category);
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  await categoriesService.deleteCategory(req.userId!, req.params.id);
  res.status(204).send();
});
