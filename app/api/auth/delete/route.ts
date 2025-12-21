import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    await dbConnect();
    await User.findByIdAndDelete(payload.sub);

    return NextResponse.json({ message: "계정이 삭제되었습니다." });
  } catch (error) {
    console.error("[AUTH][DELETE]", error);
    return NextResponse.json({ message: "계정을 삭제하지 못했습니다." }, { status: 500 });
  }
}
