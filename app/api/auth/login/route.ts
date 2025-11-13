import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "이메일과 비밀번호를 모두 입력하세요." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json({ message: "가입되지 않은 이메일입니다." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const token = signToken({ sub: user._id.toString(), email: user.email });
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[AUTH][LOGIN]", error);
    return NextResponse.json({ message: "로그인 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
