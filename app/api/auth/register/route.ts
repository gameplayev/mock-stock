import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { baseHoldings } from "@/lib/mockData";

const ADMIN_REGISTRATION_CODE = "STOCKMAN123";

export async function POST(request: Request) {
  try {
    const { name, username, password, role = "user", adminCode } = await request.json();

    if (!name || !username || !password) {
      return NextResponse.json({ message: "모든 필드를 작성해주세요." }, { status: 400 });
    }

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json({ message: "알 수 없는 계정 유형입니다." }, { status: 400 });
    }

    if (role === "admin" && adminCode !== ADMIN_REGISTRATION_CODE) {
      return NextResponse.json({ message: "관리자 인증 코드가 일치하지 않습니다." }, { status: 403 });
    }

    await dbConnect();

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return NextResponse.json({ message: "이미 가입된 아이디입니다." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      username,
      password: hashedPassword,
      holdings: baseHoldings.map((holding) => ({ ...holding })),
      role,
    });

    return NextResponse.json({ message: "등록 완료" }, { status: 201 });
  } catch (error) {
    console.error("[AUTH][REGISTER]", error);
    return NextResponse.json({ message: "회원 가입 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
