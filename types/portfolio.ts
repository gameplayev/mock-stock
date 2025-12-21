// 포트폴리오 관련 공용 타입 정의
export type Holding = {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  change: number;
  allocation: number;
  direction?: "long" | "short";
  openedAt?: string;
  expiresAt?: string;
};

export type Headline = {
  id: number | string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  sentiment: "bullish" | "bearish" | "neutral";
  symbol: string;
  impact: number;
  rateImpact?: number;
  applied?: boolean;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  totalValue: number;
  holdingsValue: number;
  cashBalance: number;
};

export type DepositInfo = {
  amount: number;
  startedAt: string;
  dueAt: string;
  interestRate: number;
  interest: number;
};

export type FuturesOrder = {
  symbol: string;
  name: string;
  shares: number;
  leverage: number;
  direction: "long" | "short";
  entryPrice: number;
  openedAt: string;
  expiresAt: string;
};
