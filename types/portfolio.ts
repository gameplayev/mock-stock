// 포트폴리오 관련 공용 타입 정의
export type Holding = {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  change: number;
  allocation: number;
};

export type WatchItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  high: number;
  low: number;
};

export type MarketIndex = {
  label: string;
  value: number;
  change: number;
};

export type Headline = {
  id: number;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  sentiment: "bullish" | "bearish" | "neutral";
  symbol: string;
  impact: number;
  applied?: boolean;
};

export type Insight = {
  title: string;
  description: string;
  action: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  totalValue: number;
  holdingsValue: number;
  cashBalance: number;
};
