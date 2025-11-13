import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}, { name: 1, holdings: 1, cashBalance: 1 })
      .lean()
      .limit(10);

    const leaderboard = users
      .map((user) => {
        const holdingsValue = user.holdings?.reduce(
          (sum, holding) => sum + (holding.price ?? 0) * (holding.shares ?? 0),
          0,
        );
        const totalValue = holdingsValue + (user.cashBalance ?? 0);
        return {
          id: user._id.toString(),
          name: user.name,
          cashBalance: user.cashBalance ?? 0,
          holdingsValue,
          totalValue,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("[LEADERBOARD]", error);
    return NextResponse.json({ message: "리더보드를 불러오지 못했습니다." }, { status: 500 });
  }
}
