import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { HoldingDocument } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    const { symbol, shares, price, name, action = "buy" } = await request.json();

    if (!symbol || !shares || !price) {
      return NextResponse.json({ message: "종목, 수량, 가격을 모두 입력하세요." }, { status: 400 });
    }

    if (!["buy", "sell"].includes(action)) {
      return NextResponse.json({ message: "알 수 없는 주문 타입입니다." }, { status: 400 });
    }

    if (shares <= 0 || price <= 0) {
      return NextResponse.json({ message: "수량과 가격은 0보다 커야 합니다." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(payload.sub);

    if (!user) {
      return NextResponse.json({ message: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const orderValue = shares * price;
    const targetIndex = user.holdings.findIndex((holding: HoldingDocument) => holding.symbol === symbol);
    const target = targetIndex >= 0 ? user.holdings[targetIndex] : null;

    if (action === "buy") {
      if (user.cashBalance < orderValue) {
        return NextResponse.json({ message: "가용 현금이 부족합니다." }, { status: 400 });
      }

      if (target) {
        const totalShares = target.shares + shares;
        const totalCost = target.avgCost * target.shares + orderValue;
        target.shares = totalShares;
        target.avgCost = Number(totalCost / totalShares);
        target.price = price;
        target.change = 0;
      } else {
        const newHolding: HoldingDocument = {
          symbol,
          name: name ?? symbol,
          shares,
          avgCost: price,
          price,
          change: 0,
          allocation: 5,
        };
        user.holdings.push(newHolding);
      }

      user.cashBalance = Number((user.cashBalance - orderValue).toFixed(2));
    } else {
      if (!target || target.shares < shares) {
        return NextResponse.json({ message: "보유 수량이 부족합니다." }, { status: 400 });
      }

      target.shares -= shares;
      target.price = price;
      target.change = 0;

      if (target.shares === 0) {
        user.holdings.splice(targetIndex, 1);
      }

      user.cashBalance = Number((user.cashBalance + orderValue).toFixed(2));
    }
    await user.save();

    return NextResponse.json({
      holdings: user.holdings,
      cashBalance: user.cashBalance,
    });
  } catch (error) {
    console.error("[PORTFOLIO][INVEST]", error);
    return NextResponse.json({ message: "투자 주문을 처리하지 못했습니다." }, { status: 500 });
  }
}
