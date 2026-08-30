import { apiClient } from "./client";
import { Recurrence } from "../types";

export const recurrencesApi = {
  list: () => apiClient.get<Recurrence[]>("/recurrences").then((r) => r.data),
  create: (data: Partial<Recurrence>) => apiClient.post<Recurrence>("/recurrences", data).then((r) => r.data),
  update: (id: string, data: Partial<Recurrence>) =>
    apiClient.put<Recurrence>(`/recurrences/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/recurrences/${id}`),
  generateMonth: (month: number, year: number) =>
    apiClient.post("/recurrences/generate-month", { month, year }).then((r) => r.data),
};
