import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { HoldingDocument } from "@/models/User";

type SnapshotHolding = {
  symbol: string;
  price: number;
  change?: number;
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    const { holdings } = (await request.json()) as { holdings?: SnapshotHolding[] };
    if (!Array.isArray(holdings)) {
      return NextResponse.json({ message: "유효한 보유 자산 데이터가 필요합니다." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(payload.sub);
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const snapshotMap = new Map(
      holdings
        .filter((holding) => typeof holding.symbol === "string" && typeof holding.price === "number")
        .map((holding) => [holding.symbol, holding]),
    );

    let updated = 0;
    user.holdings.forEach((holding: HoldingDocument) => {
      const snapshot = snapshotMap.get(holding.symbol);
      if (!snapshot) {
        return;
      }
      holding.price = Number(snapshot.price.toFixed(2));
      if (typeof snapshot.change === "number") {
        holding.change = Number(snapshot.change.toFixed(2));
      }
      updated += 1;
    });

    if (updated > 0) {
      await user.save();
    }

    return NextResponse.json({ updated }, { status: 200 });
  } catch (error) {
    console.error("[PORTFOLIO][SNAPSHOT]", error);
    return NextResponse.json({ message: "포트폴리오 최신화를 반영하지 못했습니다." }, { status: 500 });
  }
}
