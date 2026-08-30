import { Schema, model, Document, Types } from "mongoose";

export const ENTRY_TYPES = ["receita", "despesa"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: EntryType;
  color?: string;
  icon?: string;
  parentId?: Types.ObjectId;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ENTRY_TYPES, required: true },
    color: { type: String },
    icon: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);
