import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { baseHoldings } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    await dbConnect();

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const holdings = user.holdings?.length ? user.holdings : baseHoldings.map((holding) => ({ ...holding }));

    return NextResponse.json({
      name: user.name,
      email: user.email,
      holdings,
      cashBalance: user.cashBalance ?? 0,
    });
  } catch (error) {
    console.error("[PORTFOLIO]", error);
    return NextResponse.json({ message: "인증 정보가 유효하지 않습니다." }, { status: 401 });
  }
}
