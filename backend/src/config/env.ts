function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: required("MONGO_URI", "mongodb://localhost:27017/financas"),
  jwt: {
    secret: required("JWT_SECRET", "dev-secret-nao-usar-em-producao"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-nao-usar-em-producao"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  enableCronJobs: (process.env.ENABLE_CRON_JOBS ?? "true") === "true",
};
