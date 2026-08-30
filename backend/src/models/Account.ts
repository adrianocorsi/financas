import { Schema, model, Document, Types } from "mongoose";

export const ACCOUNT_TYPES = ["corrente", "poupanca", "cartao_credito", "dinheiro", "investimento"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: AccountType;
  initialBalance: number;
  // Preenchido apenas quando type = cartao_credito.
  // Dia de fechamento da fatura: compras após esse dia caem na competência do mês seguinte.
  closingDay?: number;
  createdAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    initialBalance: { type: Number, required: true, default: 0 },
    closingDay: { type: Number, min: 1, max: 31 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Account = model<IAccount>("Account", accountSchema);
