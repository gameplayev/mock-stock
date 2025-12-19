import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { UserDocument } from "@/models/User";
import { DEPOSIT_DURATION_MS, DEPOSIT_INTEREST_RATE, getDepositSnapshot, settleDepositIfMatured } from "@/lib/deposit";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    await dbConnect();
    const user = await User.findById(payload.sub);
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ message: "관리자 계정은 예금을 이용할 수 없습니다." }, { status: 403 });
    }

    await settleDepositIfMatured(user as UserDocument & { save: () => Promise<void> });

    if (user.fixedDeposit) {
      return NextResponse.json({ message: "이미 예금이 진행 중이므로 잠시 기다려주세요." }, { status: 409 });
    }

    const { amount } = await request.json();
    const depositAmount = Number(amount);
    if (Number.isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ message: "예치할 금액을 정확히 입력하세요." }, { status: 400 });
    }

    if (depositAmount > user.cashBalance) {
      return NextResponse.json({ message: "가용 현금이 부족합니다." }, { status: 400 });
    }

    user.cashBalance = Number((user.cashBalance - depositAmount).toFixed(2));
    const now = new Date();
    user.fixedDeposit = {
      amount: depositAmount,
      startedAt: now,
      dueAt: new Date(now.getTime() + DEPOSIT_DURATION_MS),
      interestRate: DEPOSIT_INTEREST_RATE,
    };

    await user.save();

    const snapshot = getDepositSnapshot(user.fixedDeposit);
    return NextResponse.json({ deposit: snapshot });
  } catch (error) {
    console.error("[DEPOSIT][POST]", error);
    return NextResponse.json({ message: "예금 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
