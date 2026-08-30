import { apiClient } from "./client";
import { Category } from "../types";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories").then((r) => r.data),
  create: (data: Partial<Category>) => apiClient.post<Category>("/categories", data).then((r) => r.data),
  update: (id: string, data: Partial<Category>) =>
    apiClient.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};
