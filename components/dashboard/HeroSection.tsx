"use client";

import { formatCurrency as formatCurrencyFn, formatPercent as formatPercentFn } from "@/lib/numberFormat";
import { useEffect, useMemo, useState } from "react";
import type { FuturesOrder, Holding } from "@/types/portfolio";
import { baseHoldings } from "@/lib/mockData";

type HeroSectionProps = {
  userName: string;
  lastUpdated: string;
  portfolioGain: number;
  portfolioGainPercent: number;
  impactLog: string | null;
  cashBalance: number;
  holdings: Holding[];
  futuresOrders: FuturesOrder[];
  formatCurrency?: typeof formatCurrencyFn;
  formatPercent?: typeof formatPercentFn;
  trendTone: (value: number) => string;
  assetValue: number;
  depositPrincipal: number;
  futuresPnL: number;
  marketRunning: boolean;
  onRefresh: () => void;
};

export default function HeroSection({
  userName,
  lastUpdated,
  portfolioGain,
  portfolioGainPercent,
  impactLog,
  cashBalance,
  holdings,
  futuresOrders,
  formatCurrency = formatCurrencyFn,
  formatPercent = formatPercentFn,
  trendTone,
  assetValue,
  depositPrincipal,
  futuresPnL,
  marketRunning,
  onRefresh,
}: HeroSectionProps) {
  const [assetTab, setAssetTab] = useState<"assets" | "futures">("assets");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!marketRunning) {
      return undefined;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [marketRunning]);

  const activeFutures = useMemo(
    () =>
      futuresOrders.filter((order) => {
        const expiresAt = new Date(order.expiresAt).getTime();
        return expiresAt > now;
      }),
    [futuresOrders, now],
  );

  useEffect(() => {
    if (assetTab === "futures" && activeFutures.length === 0) {
      setAssetTab("assets");
    }
  }, [activeFutures.length, assetTab]);

  const formatTimeLeft = (expiresAt: string) => {
    const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const resolveCurrentPrice = (symbol: string) => {
    const holdingPrice = holdings.find((holding) => holding.symbol === symbol)?.price;
    if (typeof holdingPrice === "number" && holdingPrice > 0) {
      return holdingPrice;
    }
    const basePrice = baseHoldings.find((holding) => holding.symbol === symbol)?.price;
    return basePrice ?? 0;
  };

  const futuresTone = futuresPnL >= 0 ? "text-emerald-200" : "text-rose-300";
  return (
    <section className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/20 p-8 shadow-2xl shadow-emerald-500/5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">모의 시장</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white lg:text-5xl">
            {userName}님의 자산
          </h1>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-emerald-400 hover:text-white"
        >
          최신화
        </button>
      </div>
      {/* 핵심 지표 카드: 현금/동기화/알림 */}
      <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-1">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">현금</p>
          <div className="mt-2 flex items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-white">{formatCurrency(cashBalance)}</p>
              {depositPrincipal > 0 && (
                <span
                  className={`text-xs font-semibold ${
                    cashBalance >= depositPrincipal ? "text-emerald-200" : "text-rose-300"
                  }`}
                >
                  초기 자금 대비 {formatPercent((cashBalance - depositPrincipal) / depositPrincipal)}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">총 자산</p>
              <p className="text-lg font-semibold text-emerald-200">{formatCurrency(assetValue)}</p>
              <p className="text-xs text-slate-500">주식 매도 + 현금 + 예금 원금 + 선물 평가손익</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">즉시 집행 가능</p>
        </div>
      </div>

      {/* 주요 보유 종목 + 선물 주문 탭 */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-white">{userName}님의 자산</p>
            <span className="text-xs text-slate-400">
              주식 {holdings.filter((item) => item.shares > 0).length}건 · 현금 1건 · 선물 {activeFutures.length}건
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {[
              { value: "assets", label: "자산" },
              { value: "futures", label: "선물" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setAssetTab(tab.value as "assets" | "futures")}
                className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                  assetTab === tab.value
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {assetTab === "assets" ? (
          <div className="mt-4 flex flex-col gap-3">
            {holdings.map((holding) => {
              const positionCost = holding.avgCost * holding.shares;
              const currentValue = holding.price * holding.shares;
              const pnlPercent = positionCost === 0 ? 0 : ((currentValue - positionCost) / positionCost) * 100;

              return (
                <div
                  key={holding.symbol}
                  className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{holding.symbol}</p>
                    <p className="text-xs text-slate-400">
                      {holding.shares.toLocaleString()}주 ·{" "}
                      {formatCurrency(holding.price, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${trendTone(pnlPercent)}`}>{formatPercent(pnlPercent)}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-semibold text-white">현금 자산</p>
                <p className="text-xs text-slate-400"></p>
              </div>
              <p className="text-base font-semibold text-emerald-200">${cashBalance.toLocaleString()}</p>
            </div>
            {depositPrincipal > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-500/5 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">예금 원금</p>
                  <p className="text-xs text-slate-400">진행 중인 예금 포함</p>
                </div>
                <p className="text-base font-semibold text-emerald-200">${depositPrincipal.toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">선물 평가손익</p>
                <p className="text-xs text-slate-500">실시간 시세 반영</p>
              </div>
              <p className={`text-base font-semibold ${futuresTone}`}>{formatCurrency(futuresPnL)}</p>
            </div>
            {activeFutures.length ? (
              activeFutures.map((order) => {
                const currentPrice = resolveCurrentPrice(order.symbol);
                const diff =
                  currentPrice > 0
                    ? order.direction === "long"
                      ? currentPrice - order.entryPrice
                      : order.entryPrice - currentPrice
                    : 0;
                const pnl = diff * order.shares * order.leverage * 10;
                const pnlTone = pnl >= 0 ? "text-emerald-200" : "text-rose-300";
                return (
                  <div
                    key={`${order.symbol}-${order.openedAt}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{order.symbol}</p>
                      <p className="text-xs text-slate-400">
                        {order.direction === "long" ? "롱" : "숏"} · {order.leverage}x · {order.shares.toLocaleString()}개
                      </p>
                      <p className={`mt-1 text-xs font-semibold ${pnlTone}`}>
                        평가 손익 {formatCurrency(pnl)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">청산까지</p>
                      <p className="text-base font-semibold text-emerald-200">{formatTimeLeft(order.expiresAt)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-xs text-slate-400">
                진행 중인 선물 주문이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

    </section>
  );
}
