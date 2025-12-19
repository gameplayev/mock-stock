import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    await dbConnect();
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ id: user._id.toString(), name: user.name, role: user.role, username: user.username });
  } catch (error) {
    console.error("[ADMIN][ME]", error);
    return NextResponse.json({ message: "관리자 인증을 확인할 수 없습니다." }, { status: 401 });
  }
}
