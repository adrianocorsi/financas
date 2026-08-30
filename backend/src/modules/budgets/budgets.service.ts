import { z } from "zod";
import { Types } from "mongoose";
import { Budget } from "../../models/Budget";
import { Entry } from "../../models/Entry";
import { AppError } from "../../utils/AppError";
import { createBudgetSchema, updateBudgetSchema } from "./budgets.validation";

type CreateInput = z.infer<typeof createBudgetSchema>;
type UpdateInput = z.infer<typeof updateBudgetSchema>;

export function listBudgets(userId: string, filter: { month?: number; year?: number }) {
  const query: Record<string, unknown> = { userId };
  if (filter.month) query.month = filter.month;
  if (filter.year) query.year = filter.year;
  return Budget.find(query).sort({ year: -1, month: -1 });
}

export async function createBudget(userId: string, input: CreateInput) {
  try {
    return await Budget.create({ ...input, userId });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new AppError("Já existe um orçamento para essa categoria/mês/ano", 409);
    }
    throw err;
  }
}

export async function updateBudget(userId: string, id: string, input: UpdateInput) {
  const budget = await Budget.findOneAndUpdate({ _id: id, userId }, input, { new: true });
  if (!budget) throw AppError.notFound("Orçamento");
  return budget;
}

export async function deleteBudget(userId: string, id: string) {
  const budget = await Budget.findOneAndDelete({ _id: id, userId });
  if (!budget) throw AppError.notFound("Orçamento");
}

// 6.6 — Alerta de orçamento estourado: compara budgets.planned_amount vs gasto real por categoria.
export async function budgetsStatus(userId: string, month: number, year: number) {
  const [budgets, gastosReais] = await Promise.all([
    Budget.find({ userId, month, year }).populate("categoryId", "name color"),
    Entry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: "despesa",
          competenceMonth: month,
          competenceYear: year,
          amountPaid: { $ne: null },
        },
      },
      { $group: { _id: "$categoryId", total: { $sum: "$amountPaid" } } },
    ]),
  ]);

  const gastoPorCategoria = new Map(gastosReais.map((g) => [g._id.toString(), g.total as number]));

  return budgets.map((budget) => {
    const category = budget.categoryId as any;
    const gastoReal = gastoPorCategoria.get(budget.categoryId.toString()) ?? 0;
    const percentualUtilizado = budget.plannedAmount > 0 ? (gastoReal / budget.plannedAmount) * 100 : 0;

    return {
      budgetId: budget._id,
      categoryId: category?._id ?? budget.categoryId,
      categoryName: category?.name,
      categoryColor: category?.color,
      month,
      year,
      plannedAmount: budget.plannedAmount,
      gastoReal,
      percentualUtilizado,
      estourado: gastoReal > budget.plannedAmount,
    };
  });
}
