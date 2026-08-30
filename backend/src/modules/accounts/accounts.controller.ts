import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as accountsService from "./accounts.service";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await accountsService.listAccounts(req.userId!);
  res.json(accounts);
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountsService.createAccount(req.userId!, req.body);
  res.status(201).json(account);
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountsService.updateAccount(req.userId!, req.params.id, req.body);
  res.json(account);
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  await accountsService.deleteAccount(req.userId!, req.params.id);
  res.status(204).send();
});

export const balanceHandler = asyncHandler(async (req: Request, res: Response) => {
  const balance = await accountsService.getAccountBalance(req.userId!, req.params.id, req.query as any);
  res.json(balance);
});
