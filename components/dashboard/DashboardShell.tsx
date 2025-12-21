"use client";

import { useState } from "react";
import { useMockMarket } from "@/hooks/useMockMarket";
import { formatCurrency, formatPercent, trendTone } from "@/lib/numberFormat";
import type { DepositInfo, Holding } from "@/types/portfolio";
import HeroSection from "@/components/dashboard/HeroSection";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import NewsFeed from "@/components/dashboard/NewsFeed";
import InvestPanel from "@/components/dashboard/InvestPanel";
import AccountActions from "@/components/dashboard/AccountActions";
import InterestRateCard from "@/components/dashboard/InterestRateCard";
import DepositCard from "@/components/dashboard/DepositCard";
import StockChartPanel from "@/components/dashboard/StockChartPanel";

type DashboardShellProps = {
  initialHoldings: Holding[];
  userName: string;
  cashBalance: number;
  token: string;
  depositInfo?: DepositInfo | null;
  depositLoading: boolean;
  onStartDeposit: (amount: number) => Promise<void>;
  onPortfolioRefresh: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  accountLoading: boolean;
};

// 전체 대시보드를 조립하는 상위 컴포넌트
export default function DashboardShell({
  initialHoldings,
  userName,
  cashBalance,
  token,
  depositInfo,
  depositLoading,
  onStartDeposit,
  onPortfolioRefresh,
  onLogout,
  onDeleteAccount,
  accountLoading,
}: DashboardShellProps) {
  const { holdings, news, lastUpdated, impactLog, metrics, marketRunning, interestRate } =
    useMockMarket(initialHoldings);
  // 보유 가치 기준 상위 4개를 추려 히어로 카드에 노출
  const holdingsPreview = [...holdings]
    .sort((a, b) => b.price * b.shares - a.price * a.shares)
    .slice(0, 4);

  const interestRateLabel = `${(interestRate * 100).toFixed(2)}%`;
  const [selectedSymbol, setSelectedSymbol] = useState<string>(holdings[0]?.symbol ?? "");
  const fallbackSymbol = holdings[0]?.symbol ?? "";
  const normalizedSymbol = holdings.find((holding) => holding.symbol === selectedSymbol)
    ? selectedSymbol
    : fallbackSymbol;
  const depositPrincipal = depositInfo?.amount ?? 0;
  const totalAssets = metrics.portfolioValue + cashBalance + depositPrincipal;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:px-0 lg:py-16">
        <HeroSection
          userName={userName}
          lastUpdated={lastUpdated}
          portfolioGain={metrics.portfolioGain}
          portfolioGainPercent={metrics.portfolioGainPercent}
          impactLog={impactLog}
          cashBalance={cashBalance}
          holdingsPreview={holdingsPreview}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
          trendTone={trendTone}
          assetValue={totalAssets}
          depositPrincipal={depositPrincipal}
        />

        {!marketRunning && (
          <div className="rounded-2xl border border-white/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            현재 시장이 점검 중이므로 매수/매도 주문이 일시 중단되었습니다.
          </div>
        )}

        <section className="space-y-6">
          <StockChartPanel holdings={holdings} selectedSymbol={normalizedSymbol} onSymbolChange={setSelectedSymbol} />
          <div className="grid gap-6 md:grid-cols-2">
            <InvestPanel
              holdings={holdings}
              token={token}
              cashBalance={cashBalance}
              onSuccess={onPortfolioRefresh}
              marketRunning={marketRunning}
            />
            <AccountActions onLogout={onLogout} onDelete={onDeleteAccount} loading={accountLoading} />
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <InterestRateCard rate={interestRateLabel} />
          <DepositCard deposit={depositInfo} loading={depositLoading} onStart={onStartDeposit} />
        </section>

        <section className="space-y-6">
          <HoldingsTable holdings={holdings} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <NewsFeed news={news} formatPercent={formatPercent} />
          <div className="hidden lg:block" aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}
