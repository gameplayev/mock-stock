import { Schema, model, models } from "mongoose";
import type { Holding } from "@/types/portfolio";

export type HoldingDocument = Holding & { _id?: Schema.Types.ObjectId };

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  name: string;
  username: string;
  password: string;
  holdings: HoldingDocument[];
  cashBalance: number;
  role: "user" | "admin";
  fixedDeposit?: {
    amount: number;
    startedAt: Date;
    dueAt: Date;
    interestRate: number;
  };
}

const HoldingSchema = new Schema<HoldingDocument>(
  {
    symbol: String,
    name: String,
    shares: Number,
    avgCost: Number,
    price: Number,
    change: Number,
    allocation: Number,
    direction: String,
    openedAt: String,
    expiresAt: String,
  },
  { _id: false },
);

const DepositSchema = new Schema(
  {
    amount: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    interestRate: { type: Number, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    holdings: { type: [HoldingSchema], default: [] },
    cashBalance: { type: Number, default: 50000 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    fixedDeposit: { type: DepositSchema, default: undefined },
  },
  { timestamps: true },
);



const User = models.User || model<UserDocument>("User", UserSchema);

export default User;
