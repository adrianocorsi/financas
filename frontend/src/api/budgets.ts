import { apiClient } from "./client";
import { Budget, BudgetStatus } from "../types";

export const budgetsApi = {
  list: (filter?: { month?: number; year?: number }) =>
    apiClient.get<Budget[]>("/budgets", { params: filter }).then((r) => r.data),
  create: (data: Partial<Budget>) => apiClient.post<Budget>("/budgets", data).then((r) => r.data),
  update: (id: string, data: Partial<Budget>) => apiClient.put<Budget>(`/budgets/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/budgets/${id}`),
  status: (month: number, year: number) =>
    apiClient.get<BudgetStatus[]>("/budgets/status", { params: { month, year } }).then((r) => r.data),
};
