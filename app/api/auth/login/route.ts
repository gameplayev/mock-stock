import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User, { UserDocument } from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: "아이디와 비밀번호를 모두 입력하세요." }, { status: 400 });
    }

    await dbConnect();
    const user = (await User.findOne({ username }).lean()) as (UserDocument & { _id: string }) | null;

    if (!user) {
      return NextResponse.json({ message: "가입되지 않은 아이디입니다." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const token = signToken({ sub: user._id.toString(), username: user.username, role: user.role });
    return NextResponse.json({ token, role: user.role });
  } catch (error) {
    console.error("[AUTH][LOGIN]", error);
    return NextResponse.json({ message: "로그인 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
