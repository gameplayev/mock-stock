"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const holdingsSorted = [...holdings].sort((a, b) => b.price * b.shares - a.price * a.shares);

  const interestRateLabel = `${(interestRate * 100).toFixed(2)}%`;
  const depositPrincipal = depositInfo?.amount ?? 0;
  const totalAssets = metrics.portfolioValue + cashBalance + depositPrincipal;
  const [adminRefreshNote, setAdminRefreshNote] = useState<string | null>(null);
  const notifyAdminRefresh = useCallback(
    (message = "관리자 요청이 반영되었습니다.") => {
      onPortfolioRefresh();
      setAdminRefreshNote(message);
    },
    [onPortfolioRefresh],
  );

  useEffect(() => {
    if (!adminRefreshNote) {
      return undefined;
    }
    const timer = setTimeout(() => setAdminRefreshNote(null), 3000);
    return () => clearTimeout(timer);
  }, [adminRefreshNote]);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    broadcastChannelRef.current = new BroadcastChannel("market-admin-refresh");
    const ADMIN_REFRESH_KEY = "market-admin-refresh";

    const readMessage = () => {
      const payload = window.localStorage.getItem(ADMIN_REFRESH_KEY);
      if (!payload) {
        return "관리자 요청이 반영되었습니다.";
      }
      try {
        const parsed = JSON.parse(payload);
        if (typeof parsed.message === "string") {
          return parsed.message;
        }
      } catch {
        // ignore
      }
      return "관리자 요청이 반영되었습니다.";
    };

    const handleSignal = () => notifyAdminRefresh(readMessage());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_REFRESH_KEY) {
        handleSignal();
      }
    };
    const handleBroadcast = (event: MessageEvent) => {
      if (typeof event.data !== "string") {
        return;
      }
      try {
        const parsed = JSON.parse(event.data);
        if (typeof parsed.message === "string") {
          notifyAdminRefresh(parsed.message);
          return;
        }
      } catch {
        // ignore parsing result
      }
      notifyAdminRefresh(event.data);
    };

    window.addEventListener("market-admin-refresh", handleSignal);
    window.addEventListener("storage", handleStorage);
    broadcastChannelRef.current?.addEventListener("message", handleBroadcast);

    return () => {
      window.removeEventListener("market-admin-refresh", handleSignal);
      window.removeEventListener("storage", handleStorage);
      broadcastChannelRef.current?.removeEventListener("message", handleBroadcast);
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, [notifyAdminRefresh]);

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
          holdings={holdingsSorted}
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
          <StockChartPanel holdings={holdings} />
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
          {/* 현재 시장 금리를 deposit 카드에도 표시하여 사용자에게 일관된 기준을 제공합니다. */}
          <DepositCard
            deposit={depositInfo}
            loading={depositLoading}
            onStart={onStartDeposit}
            currentInterestRate={interestRate}
            onPortfolioRefresh={onPortfolioRefresh}
          />
        </section>
        {adminRefreshNote && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 animate-pulse">
            {adminRefreshNote}
          </div>
        )}

        <section className="space-y-6">
          <HoldingsTable
            holdings={holdings}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            token={token}
            marketRunning={marketRunning}
            onOrderComplete={onPortfolioRefresh}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <NewsFeed news={news} formatPercent={formatPercent} />
          <div className="hidden lg:block" aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}
