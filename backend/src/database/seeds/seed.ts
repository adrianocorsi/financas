import { connectDatabase, disconnectDatabase } from "../../config/database";
import { Account } from "../../models/Account";
import { Category } from "../../models/Category";
import { User } from "../../models/User";
import { hashPassword } from "../../utils/password";

const DEMO_EMAIL = "demo@financas.local";

const DEFAULT_CATEGORIES: Array<{ name: string; type: "receita" | "despesa"; color: string }> = [
  { name: "Salário", type: "receita", color: "#22c55e" },
  { name: "Freelance", type: "receita", color: "#16a34a" },
  { name: "Alimentação", type: "despesa", color: "#f97316" },
  { name: "Transporte", type: "despesa", color: "#3b82f6" },
  { name: "Moradia", type: "despesa", color: "#8b5cf6" },
  { name: "Lazer", type: "despesa", color: "#ec4899" },
  { name: "Saúde", type: "despesa", color: "#ef4444" },
];

async function seed(): Promise<void> {
  await connectDatabase();

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: "Usuário Demo",
      email: DEMO_EMAIL,
      passwordHash: await hashPassword("demo1234"),
    });
    console.log(`[seed] usuário demo criado: ${DEMO_EMAIL} / senha: demo1234`);
  } else {
    console.log("[seed] usuário demo já existia, reaproveitando");
  }

  const existingCategories = await Category.countDocuments({ userId: user._id });
  if (existingCategories === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user!._id })));
    console.log(`[seed] ${DEFAULT_CATEGORIES.length} categorias padrão criadas`);
  }

  const existingAccounts = await Account.countDocuments({ userId: user._id });
  if (existingAccounts === 0) {
    await Account.create({
      userId: user._id,
      name: "Conta Corrente",
      type: "corrente",
      initialBalance: 0,
    });
    console.log("[seed] conta padrão 'Conta Corrente' criada");
  }

  await disconnectDatabase();
  console.log("[seed] concluído");
}

seed().catch((err) => {
  console.error("[seed] falha:", err);
  process.exit(1);
});
