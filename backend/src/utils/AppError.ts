export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(entity: string): AppError {
    return new AppError(`${entity} não encontrado(a)`, 404);
  }

  static unauthorized(message = "Não autenticado"): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = "Acesso negado"): AppError {
    return new AppError(message, 403);
  }
}
