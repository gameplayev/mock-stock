"use client";

import { formatCurrency as formatCurrencyFn, formatPercent as formatPercentFn } from "@/lib/numberFormat";
import type { Holding } from "@/types/portfolio";

type HeroSectionProps = {
  userName: string;
  lastUpdated: string;
  portfolioValue: number;
  portfolioGain: number;
  portfolioGainPercent: number;
  impactLog: string | null;
  cashBalance: number;
  holdingsPreview: Holding[];
  formatCurrency?: typeof formatCurrencyFn;
  formatPercent?: typeof formatPercentFn;
  trendTone: (value: number) => string;
};

export default function HeroSection({
  userName,
  lastUpdated,
  portfolioValue,
  portfolioGain,
  portfolioGainPercent,
  impactLog,
  cashBalance,
  holdingsPreview,
  formatCurrency = formatCurrencyFn,
  formatPercent = formatPercentFn,
  trendTone,
}: HeroSectionProps) {
  return (
    <section className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/20 p-8 shadow-2xl shadow-emerald-500/5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">모의 시장</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white lg:text-5xl">
            {userName}님의 자산
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-300">
            
          </p>
        </div>

        <div className="flex flex-col gap-3 text-right">
          <p className="text-sm text-slate-400">총 평가금액</p>
          <p className="text-4xl font-semibold">{formatCurrency(portfolioValue, { maximumFractionDigits: 0 })}</p>
          <p className={`text-sm font-medium ${trendTone(portfolioGain)}`}>
            {formatCurrency(portfolioGain, { maximumFractionDigits: 0 })} ({formatPercent(portfolioGainPercent)})
          </p>
        </div>
      </div>
      {/* 핵심 지표 카드: 현금/동기화/알림 */}
      <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">현금</p>
          <p className="mt-2 text-2xl font-semibold text-white">${cashBalance.toLocaleString()}</p>
          <p className="text-xs text-slate-400">즉시 집행 가능</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">마지막 동기화</p>
          <p className="mt-2 text-lg font-semibold text-white">{lastUpdated}</p>
          <p className="text-xs text-slate-400">실시간 스트리밍</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">알림</p>
          <p className="mt-2 text-lg font-semibold text-white">{impactLog ? "새 소식" : "안정"}</p>
          <p className="text-xs text-slate-400">뉴스 피드 확인</p>
        </div>
      </div>

      {/* 주요 보유 종목 + 현금자산 목록 */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">{userName}님의 자산</p>
          <span className="text-xs text-slate-400">주식 {holdingsPreview.length}건 · 현금 1건</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {holdingsPreview.map((holding) => (
            <div key={holding.symbol} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-semibold text-white">{holding.symbol}</p>
                <p className="text-xs text-slate-400">
                  {holding.shares.toLocaleString()}주 · {formatCurrency(holding.price, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className={`text-sm font-semibold ${trendTone(holding.change)}`}>{formatPercent(holding.change)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
            <div>
              <p className="font-semibold text-white">현금 자산</p>
              <p className="text-xs text-slate-400"></p>
            </div>
            <p className="text-base font-semibold text-emerald-200">${cashBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {impactLog && (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          <p className="font-semibold uppercase tracking-[0.25em] text-emerald-200">뉴스 반응</p>
          <p className="mt-2 text-base">{impactLog}</p>
        </div>
      )}
    </section>
  );
}
