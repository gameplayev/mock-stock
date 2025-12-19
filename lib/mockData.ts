import { Headline, Holding, MarketIndex } from "@/types/portfolio";

// 기본 보유 자산 (회원 가입 시 초기 자산으로 활용)
export const baseHoldings: Holding[] = [
  { symbol: "NXVD", name: "Nexvidia Labs", shares: 0, avgCost: 225.42, price: 892.1, change: 1.92, allocation: 12, direction: "long" },
  { symbol: "APPL", name: "Appletone Devices", shares: 0, avgCost: 142.15, price: 194.3, change: 0.58, allocation: 11, direction: "long" },
  { symbol: "TESL", name: "TeslaX Mobility", shares: 0, avgCost: 207.4, price: 231.8, change: -0.74, allocation: 10, direction: "long" },
  { symbol: "AMZX", name: "Amazonix Commerce", shares: 0, avgCost: 125.6, price: 181.4, change: 0.82, allocation: 10, direction: "long" },
  { symbol: "TSMX", name: "Tsmex Foundry", shares: 0, avgCost: 92.2, price: 118.4, change: 1.03, allocation: 9, direction: "long" },
  { symbol: "SPCX", name: "SpaceX Ventures", shares: 0, avgCost: 276.8, price: 318.0, change: 2.16, allocation: 9, direction: "long" },
  { symbol: "M8TA", name: "Metera Networks", shares: 0, avgCost: 352.1, price: 488.5, change: 1.82, allocation: 9, direction: "long" },
  { symbol: "AMDD", name: "Amdium Semiconductors", shares: 0, avgCost: 118.3, price: 164.2, change: -0.53, allocation: 8, direction: "long" },
  { symbol: "INTE", name: "Intentive Tech", shares: 0, avgCost: 55.0, price: 72.6, change: 0.34, allocation: 7, direction: "long" },
  { symbol: "NETX", name: "NetX Stream", shares: 0, avgCost: 168.4, price: 209.5, change: -0.58, allocation: 7, direction: "long" },
  { symbol: "MICR", name: "MicroCraft Systems", shares: 0, avgCost: 215.2, price: 269.9, change: 0.47, allocation: 7, direction: "long" },
  { symbol: "GGLX", name: "Gogle Search Labs", shares: 0, avgCost: 118.6, price: 152.4, change: 0.64, allocation: 4, direction: "long" },
];

// 지수 모듈
export const marketPulseSeed: MarketIndex[] = [
  { label: "S&P 500", value: 5124.21, change: -0.42 },
  { label: "나스닥", value: 16242.11, change: 0.78 },
  { label: "다우존스", value: 38901.45, change: -0.18 },
  { label: "VIX", value: 12.94, change: -3.12 },
];

// 뉴스 모듈
const STOCK_SYMBOLS = baseHoldings.map((holding) => holding.symbol);

const clampPercent = (value: number) => {
  const clamped = Math.max(-30, Math.min(30, value));
  return Number(clamped.toFixed(2));
};

const stockTemplates = [
  {
    sentiment: "bullish",
    title: (symbol: string) => `${symbol}의 AI 가속 수요가 폭발`,
    summary: (symbol: string, impact: number) =>
      `${symbol}이 기관 매수세에 ${impact.toFixed(2)}% 밀어올려지며 모멘텀이 가속화되고 있습니다.`,
  },
  {
    sentiment: "bearish",
    title: (symbol: string) => `${symbol}에 차익 매물 확대`,
    summary: (symbol: string, impact: number) =>
      `${symbol}이 단기 차익실현으로 ${impact.toFixed(2)}% 내리며 변동성이 커졌습니다.`,
  },
  {
    sentiment: "neutral",
    title: (symbol: string) => `${symbol}이 박스권에서 숨고르기`,
    summary: (symbol: string, impact: number) =>
      `${symbol}이 ${impact.toFixed(2)}% 수준의 보합을 기록하며 재료 모멘텀이 부족합니다.`,
  },
  {
    sentiment: "bullish",
    title: (symbol: string) => `${symbol}이 수익률 리레이팅 기대를 반영`,
    summary: (symbol: string, impact: number) =>
      `실적 기대감이 퍼지며 ${symbol}이 ${impact.toFixed(2)}% 이상 힘 있게 상승하고 있습니다.`,
  },
  {
    sentiment: "bearish",
    title: (symbol: string) => `${symbol} 실적 경고로 출렁`,
    summary: (symbol: string, impact: number) =>
      `가이던스 하향으로 ${symbol}이 ${impact.toFixed(2)}% 이상 밀리는 모습이 관측됩니다.`,
  },
  {
    sentiment: "neutral",
    title: (symbol: string) => `${symbol}이 소재/테마 흐름에 동행`,
    summary: (symbol: string, impact: number) =>
      `${symbol}이 ${impact.toFixed(2)}%의 제한적 움직임으로 랠리와 하락 사이를 오가고 있습니다.`,
  },
];

const rateTemplates = [
  {
    sentiment: "bearish",
    title: () => "국채 금리 급등, 연준 긴축 시그널",
    summary: (rateImpact: number) =>
      `금리가 ${rateImpact.toFixed(2)}% 오르면서 금융섹터가 다시 긴축 리스크를 반영 중입니다.`,
  },
  {
    sentiment: "bullish",
    title: () => "CPI 둔화가 금리 부담을 낮춰",
    summary: (rateImpact: number) =>
      `인플레이션 지표가 안정되며 금리가 ${rateImpact.toFixed(2)}% 하락했고, 위험자산을 지지하고 있습니다.`,
  },
  {
    sentiment: "neutral",
    title: () => "기준금리 재검토 시그널",
    summary: (rateImpact: number) =>
      `중립적 논평으로 금리 변동폭 ${rateImpact.toFixed(2)}% 수준에서 방향을 탐색하고 있습니다.`,
  },
];

const timeStamps = ["방금 전", "3분 전", "7분 전", "12분 전", "23분 전", "37분 전", "59분 전", "1시간 전", "2시간 전"];
const newsSources = ["Summit Desk", "Market Pulse", "Macro Wire", "Techno Sphere", "Global Brief", "CXN 방송"];

const TOTAL_NEWS = 150;

export const newsSeed: Headline[] = Array.from({ length: TOTAL_NEWS }, (_, index) => {
  const id = index + 1;
  const timeAgo = timeStamps[index % timeStamps.length];
  const source = newsSources[index % newsSources.length];
  const isRateStory = index % 11 === 0;

  if (isRateStory) {
    const template = rateTemplates[(index / 11) % rateTemplates.length];
    let rateImpact = clampPercent(((index * 13) % 61) - 30 + (index % 3) * 0.35);
    if (Math.abs(rateImpact) < 0.1) {
      rateImpact = 0.4;
    }
    return {
      id,
      title: template.title(),
      summary: template.summary(rateImpact),
      source,
      timeAgo,
      sentiment: template.sentiment,
      symbol: "RATE",
      impact: 0,
      rateImpact,
    };
  }

  const template = stockTemplates[(index * 7) % stockTemplates.length];
  const symbol = STOCK_SYMBOLS[index % STOCK_SYMBOLS.length];
  let impact = 0;

  if (template.sentiment === "bullish") {
    impact = clampPercent(((index * 5) % 24) + 3);
  } else if (template.sentiment === "bearish") {
    impact = clampPercent(-(((index * 5) % 24) + 3));
  } else {
    const neutralBase = ((index % 5) * 0.3) + 0.4;
    impact = clampPercent((index % 2 === 0 ? neutralBase : -neutralBase));
  }
  if (Math.abs(impact) < 0.3) {
    impact = template.sentiment === "bearish" ? -0.35 : 0.35;
  }

  const rateImpact = index % 6 === 0 ? clampPercent(((index * 4) % 8) * 0.25 * (index % 2 === 0 ? 1 : -1)) : 0;

  return {
    id,
    title: template.title(symbol),
    summary: template.summary(symbol, impact),
    source,
    timeAgo,
    sentiment: template.sentiment,
    symbol,
    impact,
    rateImpact,
  };
});
