import { Schema, model, Document, Types } from "mongoose";
import { ENTRY_TYPES, EntryType } from "./Category";

export const RECURRENCE_FREQUENCIES = ["mensal", "quinzenal", "anual"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface IRecurrence extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  description: string;
  categoryId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: EntryType;
  amount: number;
  dayOfMonth: number;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
}

const recurrenceSchema = new Schema<IRecurrence>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    type: { type: String, enum: ENTRY_TYPES, required: true },
    amount: { type: Number, required: true },
    dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    frequency: { type: String, enum: RECURRENCE_FREQUENCIES, required: true, default: "mensal" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Recurrence = model<IRecurrence>("Recurrence", recurrenceSchema);
