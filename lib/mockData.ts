import { Headline, Holding, Insight, MarketIndex, WatchItem } from "@/types/portfolio";

// 기본 보유 자산 (회원 가입 시 초기 자산으로 활용)
export const baseHoldings: Holding[] = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 0, avgCost: 137.48, price: 192.13, change: 1.24, allocation: 24 },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 0, avgCost: 313.91, price: 877.12, change: 3.14, allocation: 19 },
  { symbol: "MSFT", name: "Microsoft", shares: 0, avgCost: 258.2, price: 421.44, change: -0.65, allocation: 16 },
  { symbol: "AMZN", name: "Amazon.com", shares: 0, avgCost: 104.52, price: 182.67, change: 0.82, allocation: 14 },
  { symbol: "SPY", name: "S&P 500 ETF", shares: 0, avgCost: 395.32, price: 512.18, change: -0.21, allocation: 27 },
];

// 관심 종목 시드 데이터
export const watchlistSeed: WatchItem[] = [
  { symbol: "TSLA", name: "Tesla", price: 236.41, change: -2.14, high: 248.12, low: 221.28 },
  { symbol: "META", name: "Meta Platforms", price: 498.73, change: 1.82, high: 504.22, low: 486.07 },
  { symbol: "AMD", name: "AMD", price: 176.08, change: -0.54, high: 183.4, low: 165.51 },
  { symbol: "COIN", name: "Coinbase", price: 262.91, change: 4.63, high: 268.19, low: 247.25 },
];

// 지수 모듈
export const marketPulseSeed: MarketIndex[] = [
  { label: "S&P 500", value: 5124.21, change: -0.42 },
  { label: "나스닥", value: 16242.11, change: 0.78 },
  { label: "다우존스", value: 38901.45, change: -0.18 },
  { label: "VIX", value: 12.94, change: -3.12 },
];

// 뉴스 모듈
export const newsSeed: Headline[] = [
  {
    id: 1,
    title: "AI 수요 확대에 반도체 랠리 연장",
    summary: "데이터 센터 수요와 상향된 실적 가이던스로 주요 반도체 기업 주가가 신고가를 경신했습니다.",
    source: "블룸버그 마켓",
    timeAgo: "12분 전",
    sentiment: "bullish",
    symbol: "NVDA",
    impact: 1.6,
  },
  {
    id: 2,
    title: "연준 의사록, 완만한 금리 경로 시사",
    summary: "물가 둔화를 확인하며 인내심을 유지하겠다는 발언이 이어져 위험자산 심리를 지지했습니다.",
    source: "월스트리트저널",
    timeAgo: "38분 전",
    sentiment: "neutral",
    symbol: "SPY",
    impact: 0.5,
  },
  {
    id: 3,
    title: "유가 조정에 에너지 업종 약세",
    summary: "WTI가 78달러 아래로 밀리며 정유사·통합 메이저 전반에 매도 압력이 유입됐습니다.",
    source: "CNBC Pro",
    timeAgo: "58분 전",
    sentiment: "bearish",
    symbol: "AMZN",
    impact: -1.2,
  },
];

// 인사이트 모듈
export const insightsSeed: Insight[] = [
  {
    title: "자동 입금 스케줄",
    description: "코어 ETF에 주 단위로 분할 매수하여 꾸준한 복리 효과를 설계하세요.",
    action: "목표 설정",
  },
  {
    title: "옵션 헤지",
    description: "3주 만기 칼라 전략으로 기술 비중 35%를 보호하면서 상승 베팅을 유지합니다.",
    action: "전략 보기",
  },
  {
    title: "대기 자금 수익",
    description: "놀고 있는 현금이 연 4.6% 수익을 창출합니다. 계좌 간 이체는 즉시 가능합니다.",
    action: "이체하기",
  },
];
