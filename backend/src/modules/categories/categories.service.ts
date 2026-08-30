import { z } from "zod";
import { Category } from "../../models/Category";
import { AppError } from "../../utils/AppError";
import { createCategorySchema, updateCategorySchema } from "./categories.validation";

type CreateInput = z.infer<typeof createCategorySchema>;
type UpdateInput = z.infer<typeof updateCategorySchema>;

export function listCategories(userId: string) {
  return Category.find({ userId }).sort({ name: 1 });
}

export function createCategory(userId: string, input: CreateInput) {
  return Category.create({ ...input, userId });
}

export async function updateCategory(userId: string, id: string, input: UpdateInput) {
  const category = await Category.findOneAndUpdate({ _id: id, userId }, input, { new: true });
  if (!category) throw AppError.notFound("Categoria");
  return category;
}

export async function deleteCategory(userId: string, id: string) {
  const category = await Category.findOneAndDelete({ _id: id, userId });
  if (!category) throw AppError.notFound("Categoria");
}
