import { Schema, model, Document, Types } from "mongoose";

// Fase 2/3 do roadmap: orçamento planejado por categoria/mês, usado nos alertas (6.6).
export interface IBudget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: number;
  year: number;
  plannedAmount: number;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    plannedAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

export const Budget = model<IBudget>("Budget", budgetSchema);
