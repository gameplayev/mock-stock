import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User, { HoldingDocument, UserDocument } from "@/models/User";

export async function GET(request: NextRequest) {
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

    await dbConnect();
    const users = await User.find({}, { name: 1, username: 1, holdings: 1, cashBalance: 1, role: 1, fixedDeposit: 1 }).lean() as {
      _id: unknown;
      name?: string;
      username?: string;
      holdings?: HoldingDocument[];
      cashBalance?: number;
      role?: "user" | "admin";
      fixedDeposit?: UserDocument["fixedDeposit"];
    }[];

    const sanitized = users.map((user) => ({
      id: String(user._id),
      name: user.name ?? "익명",
      username: user.username ?? "unknown",
      holdings: (user.holdings ?? []).map((holding) => ({ ...holding })),
      cashBalance: user.cashBalance ?? 0,
      depositAmount: user.fixedDeposit?.amount ?? 0,
      role: user.role ?? "user",
    }));

    return NextResponse.json({ users: sanitized });
  } catch (error) {
    console.error("[ADMIN][USERS]", error);
    return NextResponse.json({ message: "사용자 목록을 가져오지 못했습니다." }, { status: 500 });
  }
}
