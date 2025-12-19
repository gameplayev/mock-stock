import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("환경 변수 JWT_SECRET이 설정되지 않았습니다.");
}

type TokenPayload = {
  sub: string;
  username: string;
  role: "user" | "admin";
};

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET) as TokenPayload;
