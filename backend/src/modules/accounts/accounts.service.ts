import { z } from "zod";
import { Account } from "../../models/Account";
import { Entry } from "../../models/Entry";
import { AppError } from "../../utils/AppError";
import { createAccountSchema, updateAccountSchema } from "./accounts.validation";

type CreateInput = z.infer<typeof createAccountSchema>;
type UpdateInput = z.infer<typeof updateAccountSchema>;

export function listAccounts(userId: string) {
  return Account.find({ userId }).sort({ createdAt: -1 });
}

export function createAccount(userId: string, input: CreateInput) {
  return Account.create({ ...input, userId });
}

export async function updateAccount(userId: string, id: string, input: UpdateInput) {
  const account = await Account.findOneAndUpdate({ _id: id, userId }, input, { new: true });
  if (!account) throw AppError.notFound("Conta");
  return account;
}

export async function deleteAccount(userId: string, id: string) {
  const account = await Account.findOneAndDelete({ _id: id, userId });
  if (!account) throw AppError.notFound("Conta");
}

// Saldo por conta (spec 4.3): initial_balance + soma(receitas pagas) - soma(despesas pagas),
// opcionalmente filtrado por competência (month/year).
export async function getAccountBalance(
  userId: string,
  accountId: string,
  filter: { month?: number; year?: number }
) {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) throw AppError.notFound("Conta");

  const match: Record<string, unknown> = {
    userId: account.userId,
    accountId: account._id,
    amountPaid: { $ne: null },
  };
  if (filter.year) match.competenceYear = filter.year;
  if (filter.month) match.competenceMonth = filter.month;

  const result = await Entry.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amountPaid" },
      },
    },
  ]);

  const totals = Object.fromEntries(result.map((r) => [r._id, r.total])) as Record<string, number>;
  const receitas = totals.receita ?? 0;
  const despesas = totals.despesa ?? 0;

  return {
    accountId: account._id,
    initialBalance: account.initialBalance,
    totalReceitasPagas: receitas,
    totalDespesasPagas: despesas,
    balance: account.initialBalance + receitas - despesas,
  };
}
