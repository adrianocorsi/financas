import { Schema, model, Document, Types } from "mongoose";
import { ENTRY_TYPES, EntryType } from "./Category";

export const ENTRY_STATUSES = ["pendente", "pago", "atrasado", "cancelado"] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export interface IEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  categoryId: Types.ObjectId;
  description: string;
  type: EntryType;
  amountExpected: number;
  amountPaid: number | null;
  dueDate: Date;
  paidDate: Date | null;
  competenceMonth: number; // 1-12
  competenceYear: number;
  status: EntryStatus;
  isRecurring: boolean;
  recurrenceId: Types.ObjectId | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<IEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ENTRY_TYPES, required: true },
    amountExpected: { type: Number, required: true },
    amountPaid: { type: Number, default: null },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    competenceMonth: { type: Number, required: true, min: 1, max: 12 },
    competenceYear: { type: Number, required: true },
    status: { type: String, enum: ENTRY_STATUSES, required: true, default: "pendente" },
    isRecurring: { type: Boolean, default: false },
    recurrenceId: { type: Schema.Types.ObjectId, ref: "Recurrence", default: null },
    installmentCurrent: { type: Number, default: null },
    installmentTotal: { type: Number, default: null },
    notes: { type: String },
  },
  { timestamps: true }
);

// Índices que sustentam os filtros mais comuns da API (GET /api/entries?month=&year=&status=&category_id=)
entrySchema.index({ userId: 1, competenceYear: 1, competenceMonth: 1 });
entrySchema.index({ userId: 1, status: 1 });
entrySchema.index({ userId: 1, categoryId: 1 });

export const Entry = model<IEntry>("Entry", entrySchema);
