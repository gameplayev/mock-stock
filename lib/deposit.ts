import type { UserDocument } from "@/models/User";
import { getInterestRate } from "@/lib/marketControl";

export const DEPOSIT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export type DepositSnapshot = {
  amount: number;
  startedAt: string;
  dueAt: string;
  interestRate: number;
  interest: number;
};

export const getDepositSnapshot = (
  deposit?: NonNullable<UserDocument["fixedDeposit"]>,
  marketRate?: number,
): DepositSnapshot | null => {
  if (!deposit) {
    return null;
  }

  const startedAt = deposit.startedAt?.toISOString() ?? new Date().toISOString();
  const dueAt = deposit.dueAt?.toISOString() ?? new Date(Date.now() + DEPOSIT_DURATION_MS).toISOString();
  const rate = marketRate ?? deposit.interestRate;
  const interest = Number((deposit.amount * rate).toFixed(2));
  return {
    amount: deposit.amount,
    startedAt,
    dueAt,
    interestRate: rate,
    interest,
  };
};

export const settleDepositIfMatured = async (
  user: UserDocument & { save: () => Promise<void> },
  marketRunning = true,
) => {
  if (!user.fixedDeposit) {
    return null;
  }

  if (!marketRunning) {
    return getDepositSnapshot(user.fixedDeposit, getInterestRate());
  }

  const due = new Date(user.fixedDeposit.dueAt).getTime();
  const now = Date.now();
  // Use the live benchmark so the payout math reflects whatever rate is active when the deposit expires.
  const currentRate = getInterestRate();
  if (due <= now) {
    const interest = Number((user.fixedDeposit.amount * currentRate).toFixed(2));
    user.cashBalance = Number((user.cashBalance + user.fixedDeposit.amount + interest).toFixed(2));
    user.fixedDeposit = undefined;
    await user.save();
    return null;
  }

  // Keep the snapshot math aligned with the current benchmark rate while the deposit is still running.
  return getDepositSnapshot(user.fixedDeposit, currentRate);
};
