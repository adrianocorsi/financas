import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri);

  mongoose.connection.on("error", (err) => {
    console.error("[database] erro de conexão com o MongoDB:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[database] desconectado do MongoDB");
  });

  console.log(`[database] conectado ao MongoDB (${env.mongoUri})`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
