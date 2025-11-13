"use client";

import { useMemo } from "react";
import { useMockMarket } from "@/hooks/useMockMarket";
import { formatCurrency, formatPercent, trendTone } from "@/lib/numberFormat";
import type { Holding, LeaderboardEntry } from "@/types/portfolio";
import HeroSection from "@/components/dashboard/HeroSection";
import KPISection from "@/components/dashboard/KPISection";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import AllocationCard from "@/components/dashboard/AllocationCard";
import MarketPulseCard from "@/components/dashboard/MarketPulseCard";
import ScheduleCard from "@/components/dashboard/ScheduleCard";
import WatchlistCard from "@/components/dashboard/WatchlistCard";
import InsightsCard from "@/components/dashboard/InsightsCard";
import NewsFeed from "@/components/dashboard/NewsFeed";
import SessionStatsCard from "@/components/dashboard/SessionStatsCard";
import InvestPanel from "@/components/dashboard/InvestPanel";
import AccountActions from "@/components/dashboard/AccountActions";
import LeaderboardMenu from "@/components/dashboard/LeaderboardMenu";

type DashboardShellProps = {
  initialHoldings: Holding[];
  userName: string;
  cashBalance: number;
  token: string;
  leaderboard: LeaderboardEntry[];
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
  leaderboard,
  onPortfolioRefresh,
  onLogout,
  onDeleteAccount,
  accountLoading,
}: DashboardShellProps) {
  const { holdings, watchlist, marketPulse, insights, news, lastUpdated, impactLog, metrics } = useMockMarket(initialHoldings);
  // 보유 가치 기준 상위 4개를 추려 히어로 카드에 노출
  const holdingsPreview = [...holdings]
    .sort((a, b) => b.price * b.shares - a.price * a.shares)
    .slice(0, 4);

  const kpiCards = useMemo(
    () => [
      {
        label: "오늘 등락",
        value: formatCurrency(metrics.dailyChange, { maximumFractionDigits: 0 }),
        trend: formatPercent((metrics.dailyChange / Math.max(metrics.portfolioValue, 1)) * 100, 2),
      },
      {
        label: "투입 원금",
        value: formatCurrency(metrics.invested, { maximumFractionDigits: 0 }),
        trend: `${formatPercent((metrics.portfolioValue / Math.max(metrics.invested, 1) - 1) * 100, 2)} 누적`,
      },
      {
        label: "가용 현금",
        value: "$18,400",
        trend: "즉시 집행 가능",
      },
      {
        label: "자동 입금",
        value: "$2,500 / 주",
        trend: "내일 실행 예정",
      },
    ],
    [metrics.dailyChange, metrics.invested, metrics.portfolioValue],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:px-0 lg:py-16">
        <HeroSection
          userName={userName}
          lastUpdated={lastUpdated}
          portfolioValue={metrics.portfolioValue}
          portfolioGain={metrics.portfolioGain}
          portfolioGainPercent={metrics.portfolioGainPercent}
          impactLog={impactLog}
          cashBalance={cashBalance}
          holdingsPreview={holdingsPreview}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
          trendTone={trendTone}
        />

        <LeaderboardMenu leaderboard={leaderboard} />

        <section className="grid gap-6 md:grid-cols-2">
          <InvestPanel holdings={holdings} token={token} cashBalance={cashBalance} onSuccess={onPortfolioRefresh} />
          <AccountActions onLogout={onLogout} onDelete={onDeleteAccount} loading={accountLoading} />
        </section>

        <KPISection cards={kpiCards} />

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <HoldingsTable holdings={holdings} formatCurrency={formatCurrency} formatPercent={formatPercent} />
            <AllocationCard holdings={holdings} />
          </div>
          <div className="space-y-6">
            <MarketPulseCard marketPulse={marketPulse} formatPercent={formatPercent} trendTone={trendTone} />
            <ScheduleCard />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <WatchlistCard watchlist={watchlist} formatCurrency={formatCurrency} formatPercent={formatPercent} trendTone={trendTone} />
          <InsightsCard insights={insights} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <NewsFeed news={news} formatPercent={formatPercent} />
          <SessionStatsCard />
        </section>
      </div>
    </main>
  );
}
