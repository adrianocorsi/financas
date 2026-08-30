import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

// Middleware de erro central: qualquer throw/reject dos controllers (via asyncHandler) cai aqui.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Dados inválidos", details: err.flatten() });
    return;
  }

  if (err instanceof Error && err.name === "MongoServerError" && (err as any).code === 11000) {
    res.status(409).json({ error: "Registro duplicado", details: (err as any).keyValue });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Erro interno do servidor" });
}
