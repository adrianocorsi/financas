import { apiClient } from "./client";
import { Entry, EntryStatus } from "../types";

export interface EntriesFilter {
  month?: number;
  year?: number;
  status?: EntryStatus;
  category_id?: string;
}

export const entriesApi = {
  list: (filter: EntriesFilter) => apiClient.get<Entry[]>("/entries", { params: filter }).then((r) => r.data),
  create: (data: Partial<Entry>) => apiClient.post<Entry>("/entries", data).then((r) => r.data),
  update: (id: string, data: Partial<Entry>) => apiClient.put<Entry>(`/entries/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/entries/${id}`),
  baixar: (id: string, data: { paid_date: string; amount_paid: number; account_id?: string }) =>
    apiClient.patch<Entry>(`/entries/${id}/baixar`, data).then((r) => r.data),
  cancelar: (id: string) => apiClient.patch<Entry>(`/entries/${id}/cancelar`).then((r) => r.data),
  estornar: (id: string) => apiClient.patch<Entry>(`/entries/${id}/estornar`).then((r) => r.data),
};
