import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { baseHoldings } from "@/lib/mockData";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "모든 필드를 작성해주세요." }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ message: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      holdings: baseHoldings.map((holding) => ({ ...holding })),
    });

    return NextResponse.json({ message: "등록 완료" }, { status: 201 });
  } catch (error) {
    console.error("[AUTH][REGISTER]", error);
    return NextResponse.json({ message: "회원 가입 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
