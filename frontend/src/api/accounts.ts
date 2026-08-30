import { apiClient } from "./client";
import { Account } from "../types";

export const accountsApi = {
  list: () => apiClient.get<Account[]>("/accounts").then((r) => r.data),
  create: (data: Partial<Account>) => apiClient.post<Account>("/accounts", data).then((r) => r.data),
  update: (id: string, data: Partial<Account>) =>
    apiClient.put<Account>(`/accounts/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/accounts/${id}`),
  balance: (id: string, params?: { month?: number; year?: number }) =>
    apiClient.get(`/accounts/${id}/balance`, { params }).then((r) => r.data),
};
