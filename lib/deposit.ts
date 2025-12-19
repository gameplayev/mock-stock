import type { UserDocument } from "@/models/User";

export const DEPOSIT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const DEPOSIT_INTEREST_RATE = 0.006; // 0.6% per period

export type DepositSnapshot = {
  amount: number;
  startedAt: string;
  dueAt: string;
  interestRate: number;
  interest: number;
};

export const getDepositSnapshot = (deposit?: NonNullable<UserDocument["fixedDeposit"]>): DepositSnapshot | null => {
  if (!deposit) {
    return null;
  }

  const startedAt = deposit.startedAt?.toISOString() ?? new Date().toISOString();
  const dueAt = deposit.dueAt?.toISOString() ?? new Date(Date.now() + DEPOSIT_DURATION_MS).toISOString();
  const interest = Number((deposit.amount * deposit.interestRate).toFixed(2));
  return {
    amount: deposit.amount,
    startedAt,
    dueAt,
    interestRate: deposit.interestRate,
    interest,
  };
};

export const settleDepositIfMatured = async (user: UserDocument & { save: () => Promise<void> }) => {
  if (!user.fixedDeposit) {
    return null;
  }

  const due = new Date(user.fixedDeposit.dueAt).getTime();
  const now = Date.now();
  if (due <= now) {
    const interest = Number((user.fixedDeposit.amount * user.fixedDeposit.interestRate).toFixed(2));
    user.cashBalance = Number((user.cashBalance + user.fixedDeposit.amount + interest).toFixed(2));
    user.fixedDeposit = undefined;
    await user.save();
    return null;
  }

  return getDepositSnapshot(user.fixedDeposit);
};
