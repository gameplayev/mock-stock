"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Holding, LeaderboardEntry } from "@/types/portfolio";
import { baseHoldings } from "@/lib/mockData";

type PortfolioResponse = {
  name: string;
  holdings: Holding[];
  cashBalance: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [initialHoldings, setInitialHoldings] = useState<Holding[]>(baseHoldings.map((holding) => ({ ...holding })));
  const [cashBalance, setCashBalance] = useState(0);
  const [userName, setUserName] = useState("트레이더");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const ensureToken = () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("summit-token") : null;
    if (!stored) {
      router.replace("/");
      return null;
    }
    setToken(stored);
    return stored;
  };

  const fetchPortfolio = async (authToken: string) => {
    const response = await fetch("/api/portfolio", { headers: { Authorization: `Bearer ${authToken}` } });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("세션이 만료되었습니다. 다시 로그인하세요.");
      }
      throw new Error("포트폴리오 데이터를 불러오지 못했습니다.");
    }
    const data: PortfolioResponse = await response.json();
    setInitialHoldings(data.holdings);
    setUserName(data.name);
    setCashBalance(data.cashBalance ?? 0);
  };

  const fetchLeaderboard = async () => {
    const response = await fetch("/api/leaderboard");
    if (response.ok) {
      const data = await response.json();
      setLeaderboard(data.leaderboard ?? []);
    }
  };

  const bootstrap = async () => {
    try {
      const localToken = ensureToken();
      if (!localToken) return;
      await fetchPortfolio(localToken);
      await fetchLeaderboard();
    } catch (bootstrapError) {
      setError(bootstrapError instanceof Error ? bootstrapError.message : "알 수 없는 오류가 발생했습니다.");
      localStorage.removeItem("summit-token");
      setTimeout(() => router.replace("/"), 1600);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    if (!token) return;
    await fetchPortfolio(token);
    fetchLeaderboard();
  };

  const handleLogout = () => {
    localStorage.removeItem("summit-token");
    router.replace("/");
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setAccountLoading(true);
    try {
      const response = await fetch("/api/auth/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "계정을 삭제하지 못했습니다.");
      }
      handleLogout();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setAccountLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">개인 포트폴리오를 불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-rose-200">{error}</p>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <DashboardShell
      initialHoldings={initialHoldings}
      userName={userName}
      cashBalance={cashBalance}
      token={token}
      leaderboard={leaderboard}
      onPortfolioRefresh={handleRefresh}
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
      accountLoading={accountLoading}
    />
  );
}
