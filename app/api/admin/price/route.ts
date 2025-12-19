import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { HoldingDocument } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { symbol, price } = await request.json();
    if (!symbol || typeof price !== "number" || price <= 0) {
      return NextResponse.json({ message: "적절한 종목과 가격을 입력하세요." }, { status: 400 });
    }

    await dbConnect();
    const users = await User.find({ "holdings.symbol": symbol });
    let updatedCount = 0;

    for (const user of users) {
      let mutated = false;
      user.holdings.forEach((holding: HoldingDocument) => {
        if (holding.symbol === symbol) {
          const prevPrice = holding.price || 0;
          const change = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
          holding.price = price;
          holding.change = Number(change.toFixed(2));
          mutated = true;
        }
      });

      if (mutated) {
        updatedCount += 1;
        await user.save();
      }
    }

    return NextResponse.json({ updated: updatedCount });
  } catch (error) {
    console.error("[ADMIN][PRICE]", error);
    return NextResponse.json({ message: "가격을 적용하지 못했습니다." }, { status: 500 });
  }
}
