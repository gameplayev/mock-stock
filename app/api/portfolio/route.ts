import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { UserDocument } from "@/models/User";
import { baseHoldings } from "@/lib/mockData";
import { settleDepositIfMatured } from "@/lib/deposit";

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ message: "관리자 전용 페이지입니다." }, { status: 403 });
    }

    const depositInfo = await settleDepositIfMatured(user as UserDocument & { save: () => Promise<void> });

    const now = Date.now();
    const activeHoldings = user.holdings?.length ? [...user.holdings] : baseHoldings.map((holding) => ({ ...holding }));
    let needsSave = false;
    const filteredHoldings = activeHoldings.filter((holding) => {
      if (!holding.expiresAt) {
        return true;
      }

      const expiresAt = new Date(holding.expiresAt).getTime();
      if (expiresAt <= now) {
        if (holding.direction === "long") {
          user.cashBalance = Number((user.cashBalance + holding.price * holding.shares).toFixed(2));
        } else if (holding.direction === "short") {
          user.cashBalance = Number((user.cashBalance - holding.price * holding.shares).toFixed(2));
        }
        needsSave = true;
        return false;
      }
      return true;
    });

    if (needsSave) {
      user.holdings = filteredHoldings;
      await user.save();
    }

    const holdingsToReturn = filteredHoldings.length ? filteredHoldings : baseHoldings.map((holding) => ({ ...holding }));

    return NextResponse.json({
      name: user.name,
      username: user.username,
      holdings: holdingsToReturn,
      cashBalance: user.cashBalance ?? 0,
      deposit: depositInfo,
      role: user.role,
    });
  } catch (error) {
    console.error("[PORTFOLIO]", error);
    return NextResponse.json({ message: "인증 정보가 유효하지 않습니다." }, { status: 401 });
  }
}
