import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

const ensureAdmin = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
};

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = ensureAdmin(request);
    if (!payload) {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    await user.deleteOne();
    return NextResponse.json({ message: "계정이 삭제되었습니다." });
  } catch (error) {
    console.error("[ADMIN][USER DELETE]", error);
    return NextResponse.json({ message: "계정을 삭제하지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = ensureAdmin(request);
    if (!payload) {
      return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { cashBalance, cashDelta } = await request.json();
    if (cashBalance == null && cashDelta == null) {
      return NextResponse.json({ message: "변경할 금액 정보를 보내주세요." }, { status: 400 });
    }

    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (typeof cashBalance === "number") {
      user.cashBalance = Math.max(0, cashBalance);
    }

    if (typeof cashDelta === "number") {
      user.cashBalance = Math.max(0, user.cashBalance + cashDelta);
    }

    await user.save();
    return NextResponse.json({ cashBalance: user.cashBalance });
  } catch (error) {
    console.error("[ADMIN][USER PATCH]", error);
    return NextResponse.json({ message: "자산을 업데이트하지 못했습니다." }, { status: 500 });
  }
}
