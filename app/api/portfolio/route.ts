import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { UserDocument } from "@/models/User";
import { baseHoldings } from "@/lib/mockData";
import { settleDepositIfMatured } from "@/lib/deposit";
import { getMarketState } from "@/lib/marketControl";

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

    const marketRunning = getMarketState().running;
    const depositInfo = await settleDepositIfMatured(
      user as UserDocument & { save: () => Promise<void> },
      marketRunning,
    );

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

    const activeFutures = user.futuresOrders?.length ? [...user.futuresOrders] : [];
    const resolveMarketPrice = (symbol: string) => {
      const holdingPrice = user.holdings?.find((holding: HoldingDocument) => holding.symbol === symbol)?.price;
      if (typeof holdingPrice === "number" && holdingPrice > 0) {
        return holdingPrice;
      }
      const basePrice = baseHoldings.find((holding) => holding.symbol === symbol)?.price;
      return basePrice ?? 0;
    };
    const filteredFutures = activeFutures.filter((order) => {
      if (!order.expiresAt) {
        return true;
      }
      const expiresAt = new Date(order.expiresAt).getTime();
      if (marketRunning && expiresAt <= now) {
        const exitPrice = resolveMarketPrice(order.symbol);
        if (exitPrice > 0) {
          const priceDiff =
            order.direction === "long" ? exitPrice - order.entryPrice : order.entryPrice - exitPrice;
          const pnl = priceDiff * order.shares * order.leverage * 10;
          user.cashBalance = Number((user.cashBalance + pnl).toFixed(2));
        }
        needsSave = true;
        return false;
      }
      return true;
    });

    if (needsSave) {
      user.holdings = filteredHoldings;
      user.futuresOrders = filteredFutures;
      await user.save();
    }

    const holdingsToReturn = filteredHoldings.length ? filteredHoldings : baseHoldings.map((holding) => ({ ...holding }));

    return NextResponse.json({
      name: user.name,
      username: user.username,
      holdings: holdingsToReturn,
      cashBalance: user.cashBalance ?? 0,
      deposit: depositInfo,
      futuresOrders: filteredFutures,
      role: user.role,
    });
  } catch (error) {
    console.error("[PORTFOLIO]", error);
    return NextResponse.json({ message: "인증 정보가 유효하지 않습니다." }, { status: 401 });
  }
}
