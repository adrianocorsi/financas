import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { scheduleGenerateRecurringEntries } from "./jobs/generateRecurringEntries";
import { scheduleUpdateOverdueStatus } from "./jobs/updateOverdueStatus";

async function main(): Promise<void> {
  await connectDatabase();

  if (env.enableCronJobs) {
    scheduleGenerateRecurringEntries();
    scheduleUpdateOverdueStatus();
    console.log("[jobs] cron jobs agendados");
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] rodando em http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] falha ao iniciar:", err);
  process.exit(1);
});
