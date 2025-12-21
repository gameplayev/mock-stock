import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { Headline } from "@/types/portfolio";

const clampPercent = (value: number) => {
  const clamped = Math.max(-30, Math.min(30, Number(value)));
  return Number(clamped.toFixed(2));
};

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

    const {
      title,
      summary,
      symbol,
      impact,
      rateImpact = 0,
      sentiment,
      source = "Summit Desk",
      timeAgo = "방금 전",
    } = await request.json();

    if (
      !title ||
      !summary ||
      !symbol ||
      typeof impact !== "number" ||
      typeof rateImpact !== "number" ||
      !sentiment
    ) {
      return NextResponse.json({ message: "모든 필드를 작성해주세요." }, { status: 400 });
    }

    if (Math.abs(impact) > 30 || Math.abs(rateImpact) > 30) {
      return NextResponse.json({ message: "변동 값은 ±30% 이내여야 합니다." }, { status: 400 });
    }

    const headline: Headline = {
      id: `admin-${Date.now()}`,
      title,
      summary,
      symbol,
      impact: clampPercent(impact),
      rateImpact: clampPercent(rateImpact),
      sentiment,
      source,
      timeAgo,
      applied: true,
    };

    return NextResponse.json({ headline }, { status: 201 });
  } catch (error) {
    console.error("[NEWS][BROADCAST]", error);
    return NextResponse.json({ message: "뉴스를 배포하지 못했습니다." }, { status: 500 });
  }
}
