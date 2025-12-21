import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getMarketState, resetMarket, setInterestRate, setMarketRunning } from "@/lib/marketControl";

export async function GET() {
  try {
    return NextResponse.json({ state: getMarketState() });
  } catch (error) {
    console.error("[MARKET][STATE][GET]", error);
    return NextResponse.json({ message: "시장 상태를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "관리자 인증이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { action, interestRate } = await request.json();
    if (!["start", "pause", "reset", "interest"].includes(action)) {
      return NextResponse.json({ message: "유효한 동작이 아닙니다." }, { status: 400 });
    }

    let state;
    if (action === "reset") {
      state = resetMarket();
    } else if (action === "interest") {
      if (typeof interestRate !== "number" || Number.isNaN(interestRate) || interestRate < 0) {
        return NextResponse.json({ message: "적절한 금리를 입력하세요." }, { status: 400 });
      }
      state = setInterestRate(interestRate);
    } else {
      state = setMarketRunning(action === "start");
    }

    return NextResponse.json({ state }, { status: 200 });
  } catch (error) {
    console.error("[MARKET][STATE][POST]", error);
    return NextResponse.json({ message: "시장 상태를 변경하지 못했습니다." }, { status: 500 });
  }
}
