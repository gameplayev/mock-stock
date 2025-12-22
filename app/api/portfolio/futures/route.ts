import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import type { FuturesOrder } from "@/types/portfolio";

const POSITION_DURATION_MS = 3 * 60 * 1000;
const CONTRACT_MULTIPLIER = 10;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    const { symbol, name, shares, price, leverage, direction } = await request.json();

    if (!symbol || !shares || !price) {
      return NextResponse.json({ message: "종목, 수량, 가격을 모두 입력하세요." }, { status: 400 });
    }

    const numericShares = Number(shares);
    const numericPrice = Number(price);
    const numericLeverage = Number(leverage);
    if (
      Number.isNaN(numericShares) ||
      Number.isNaN(numericPrice) ||
      Number.isNaN(numericLeverage) ||
      numericShares <= 0 ||
      numericPrice <= 0
    ) {
      return NextResponse.json({ message: "수량과 가격은 0보다 커야 합니다." }, { status: 400 });
    }

    if (!["long", "short"].includes(direction)) {
      return NextResponse.json({ message: "롱/숏 방향을 선택하세요." }, { status: 400 });
    }

    if (numericLeverage < 1 || numericLeverage > 10) {
      return NextResponse.json({ message: "레버리지는 1~10배 범위여야 합니다." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(payload.sub);

    if (!user) {
      return NextResponse.json({ message: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + POSITION_DURATION_MS).toISOString();

    const reservedMargin = ((user.futuresOrders ?? []) as FuturesOrder[]).reduce(
      (sum: number, order: FuturesOrder) => {
        const entryPrice = Number(order.entryPrice);
        const shares = Number(order.shares);
        const leverage = Number(order.leverage) || 1;
        if (!entryPrice || !shares || leverage <= 0) {
          return sum;
        }
        return sum + (entryPrice * shares * CONTRACT_MULTIPLIER) / leverage;
      },
      0,
    );
    const requiredMargin = (numericPrice * numericShares * CONTRACT_MULTIPLIER) / numericLeverage;
    const availableMargin = user.cashBalance - reservedMargin;
    if (availableMargin < requiredMargin) {
      return NextResponse.json(
        { message: "Insufficient margin for the futures position." },
        { status: 400 },
      );
    }

    user.futuresOrders = [
      ...(user.futuresOrders ?? []),
      {
        symbol,
        name: name ?? symbol,
        shares: numericShares,
        leverage: Number(numericLeverage.toFixed(2)),
        direction,
        entryPrice: Number(numericPrice.toFixed(2)),
        openedAt: now.toISOString(),
        expiresAt,
      },
    ];

    await user.save();

    return NextResponse.json({ futuresOrders: user.futuresOrders }, { status: 201 });
  } catch (error) {
    console.error("[PORTFOLIO][FUTURES]", error);
    return NextResponse.json({ message: "선물 주문을 처리하지 못했습니다." }, { status: 500 });
  }
}
