import { Schema, model, models } from "mongoose";
import type { Holding } from "@/types/portfolio";

export type HoldingDocument = Holding & { _id?: Schema.Types.ObjectId };

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  holdings: HoldingDocument[];
  cashBalance: number;
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
  },
  { _id: false },
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    holdings: { type: [HoldingSchema], default: [] },
    cashBalance: { type: Number, default: 50000 },
  },
  { timestamps: true },
);

const User = models.User || model<UserDocument>("User", UserSchema);

export default User;
