import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.status(200).json(result);
});
