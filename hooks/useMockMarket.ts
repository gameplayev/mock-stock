"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Headline, Holding } from "@/types/portfolio";
import { newsSeed } from "@/lib/mockData";
import { DEFAULT_INTEREST_RATE } from "@/lib/marketControl";

// 정규화에 사용할 범용 함수
const randomBetween = (min: number, max: number) =>
  Number((Math.random() * (max - min) + min).toFixed(2));

const clampPrice = (price: number) => Number(Math.max(price, 1).toFixed(2));

const formatTimestamp = () =>
  new Intl.DateTimeFormat("ko-KR", {
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());

type UseMockMarketResult = {
  holdings: Holding[];
  news: Headline[];
  lastUpdated: string;
  impactLog: string | null;
  metrics: {
    portfolioValue: number;
    invested: number;
    portfolioGain: number;
    portfolioGainPercent: number;
    dailyChange: number;
  };
  marketRunning: boolean;
  interestRate: number;
};

// 포트폴리오 상태를 시뮬레이션하면서 뉴스-가격을 자동으로 생성/반영
const NEWS_LIMIT = 8;

const cloneHoldings = (holdings: Holding[]) => holdings.map((holding) => ({ ...holding }));
const cloneHeadlines = (headlines: Headline[]) => headlines.map((headline) => ({ ...headline }));

export const useMockMarket = (initialHoldings: Holding[]): UseMockMarketResult => {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [news, setNews] = useState<Headline[]>(newsSeed);
  const [impactLog, setImpactLog] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(formatTimestamp());
  const newsCounter = useRef(newsSeed.length + 1);
  const [marketRunning, setMarketRunning] = useState(true);
  const marketRunningRef = useRef(marketRunning);
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const serverInterestRateRef = useRef(DEFAULT_INTEREST_RATE);
  const resetRef = useRef(0);

  useEffect(() => {
    marketRunningRef.current = marketRunning;
  }, [marketRunning]);

  const clampInterest = (value: number) => Number(Math.max(0.01, Math.min(0.1, value)).toFixed(4));
  const adjustInterestRate = useCallback((rateImpact: number) => {
    if (!rateImpact) return;
    setInterestRate((prev) => clampInterest(prev + rateImpact / 100));
  }, []);

  const addHeadline = useCallback(
    (headline: Headline) => {
      if (headline.rateImpact) {
        adjustInterestRate(headline.rateImpact);
      }
      setNews((prev) => {
        if (prev.some((item) => item.id.toString() === headline.id.toString())) {
          return prev;
        }
        return [headline, ...prev].slice(0, NEWS_LIMIT);
      });
    },
    [adjustInterestRate],
  );

  // 외부에서 새로운 초기 데이터를 받을 경우 즉시 반영
  useEffect(() => {
    if (initialHoldings.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버에서 새 데이터를 받으면 보유 내역을 동기화합니다.
      setHoldings(cloneHoldings(initialHoldings));
    }
  }, [initialHoldings]);

  const createAutoHeadline = useCallback(() => {
    if (!marketRunningRef.current) {
      return;
    }
    setHoldings((prevHoldings) => {
      if (!prevHoldings.length) {
        return prevHoldings;
      }

      const targetIndex = Math.floor(Math.random() * prevHoldings.length);
      const target = prevHoldings[targetIndex];
      const sentimentBucket = Math.random();
      const sentiment: Headline["sentiment"] =
        sentimentBucket > 0.6 ? "bullish" : sentimentBucket < 0.25 ? "bearish" : "neutral";
      const impact =
        sentiment === "bullish"
          ? randomBetween(0.6, 1.8)
          : sentiment === "bearish"
            ? randomBetween(-1.8, -0.6)
            : randomBetween(-0.4, 0.4);
      const updatedHoldings = prevHoldings.map((holding, index) =>
        index === targetIndex
          ? {
              ...holding,
              price: clampPrice(holding.price * (1 + impact / 100)),
              change: Number((holding.change + impact).toFixed(2)),
            }
          : holding,
      );

      const headline: Headline = {
        id: newsCounter.current++,
        title:
          sentiment === "bullish"
            ? `${target.symbol} 강세 수급 유입`
            : sentiment === "bearish"
              ? `${target.symbol} 차익 매물 확대`
              : `${target.symbol} 중립적 흐름 유지`,
        summary:
          sentiment === "bullish"
            ? "기관 수요와 AI 테마 기대감으로 추가 매수세가 확인되었습니다."
            : sentiment === "bearish"
              ? "거시 환경 불확실성으로 단기 수익 실현 물량이 늘었습니다."
              : "재료 공백 구간으로 제한적인 박스권 흐름이 이어집니다.",
        source: "Summit Desk",
        timeAgo: "방금 전",
        sentiment,
        symbol: target.symbol,
        impact,
        rateImpact: Math.random() > 0.7 ? randomBetween(-1.1, 1.1) : 0,
        applied: true,
      };

      addHeadline(headline);
      const verb = impact >= 0 ? "상승" : "하락";
      setImpactLog(`${target.symbol} · 자동 뉴스 영향으로 ${Math.abs(impact).toFixed(2)}% ${verb}`);

      return updatedHoldings;
    });
  }, [addHeadline]);

  // 6초마다 모의 시세를 변동
  useEffect(() => {
    const interval = setInterval(() => {
      if (!marketRunningRef.current) {
        setLastUpdated(formatTimestamp());
        return;
      }

      setHoldings((prev) =>
        prev.map((holding) => {
          const drift = randomBetween(-0.45, 0.45);
          return {
            ...holding,
            price: clampPrice(holding.price * (1 + drift / 100)),
            change: Number(drift.toFixed(2)),
          };
        }),
      );

      setLastUpdated(formatTimestamp());
      createAutoHeadline();
    }, 6000);

    return () => clearInterval(interval);
  }, [createAutoHeadline]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchState = async () => {
      try {
        const response = await fetch("/api/market/state", { signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const state = data.state;
        if (!state) {
          return;
        }
        setMarketRunning(state.running);
        marketRunningRef.current = state.running;
        if (typeof state.interestRate === "number" && state.interestRate !== serverInterestRateRef.current) {
          setInterestRate(state.interestRate);
          serverInterestRateRef.current = state.interestRate;
        }

        if (typeof state.resetNonce === "number" && state.resetNonce !== resetRef.current) {
          resetRef.current = state.resetNonce;
          setHoldings(cloneHoldings(initialHoldings));
          setNews(cloneHeadlines(newsSeed));
          setImpactLog(null);
          setLastUpdated(formatTimestamp());
          newsCounter.current = newsSeed.length + 1;
        }
      } catch {
        // ignore
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [initialHoldings]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAdminNews = async () => {
      try {
        const response = await fetch("/api/news", { signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (!Array.isArray(data.news)) {
          return;
        }
        data.news.forEach((headline: Headline) => {
          addHeadline({
            ...headline,
            id: headline.id ?? `admin-${Math.random()}`,
          });
        });
      } catch {
        // ignore
      }
    };

    fetchAdminNews();
    return () => controller.abort();
  }, [addHeadline]);

  const metrics = useMemo(() => {
    const portfolioValue = holdings.reduce((total, holding) => total + holding.price * holding.shares, 0);
    const invested = holdings.reduce((total, holding) => total + holding.avgCost * holding.shares, 0);
    const portfolioGain = portfolioValue - invested;
    const portfolioGainPercent = invested === 0 ? 0 : (portfolioGain / invested) * 100;
    const dailyChange = holdings.reduce(
      (total, holding) => total + holding.price * holding.shares * (holding.change / 100),
      0,
    );

    return { portfolioValue, invested, portfolioGain, portfolioGainPercent, dailyChange };
  }, [holdings]);

  return {
    holdings,
    news,
    lastUpdated,
    impactLog,
    metrics,
    marketRunning,
    interestRate,
  };
};
