import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import News from "@/models/News";

const NEWS_LIMIT = 6;

export async function GET() {
  try {
    await dbConnect();
    const entries = await News.find().sort({ createdAt: -1 }).limit(NEWS_LIMIT).lean();
    const news = entries.map((entry) => ({
      id: entry._id.toString(),
      title: entry.title,
      summary: entry.summary,
      source: entry.source,
      timeAgo: entry.timeAgo,
      sentiment: entry.sentiment,
      symbol: entry.symbol,
      impact: entry.impact,
      rateImpact: entry.rateImpact ?? 0,
    }));
    return NextResponse.json({ news });
  } catch (error) {
    console.error("[NEWS][GET]", error);
    return NextResponse.json({ message: "뉴스를 불러오지 못했습니다." }, { status: 500 });
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

    await dbConnect();
    const created = await News.create({
      title,
      summary,
      symbol,
      impact,
      rateImpact,
      sentiment,
      source,
      timeAgo,
    });

    return NextResponse.json(
      {
        news: {
          id: created._id.toString(),
          title: created.title,
          summary: created.summary,
          source: created.source,
          timeAgo: created.timeAgo,
          sentiment: created.sentiment,
          symbol: created.symbol,
          impact: created.impact,
          rateImpact: created.rateImpact ?? 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[NEWS][POST]", error);
    return NextResponse.json({ message: "뉴스를 등록하지 못했습니다." }, { status: 500 });
  }
}
