"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Holding } from "@/types/portfolio";
import { formatCurrency } from "@/lib/numberFormat";
import type { MarketState } from "@/lib/marketControl";

const STOCK_SYMBOLS = ["NVDA", "AAPL", "TSLA", "AMZN", "TSM", "SPACEX", "META", "AMD", "INTC", "NFLX", "MSFT", "GOOGL"];

type AdminUser = {
  id: string;
  name: string;
  username: string;
  cashBalance: number;
  holdings: Holding[];
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>("관리자");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AlertState>(null);
  const [stockForm, setStockForm] = useState({ symbol: STOCK_SYMBOLS[0], price: "" });
  const [newsForm, setNewsForm] = useState({
    title: "",
    summary: "",
    symbol: STOCK_SYMBOLS[0],
    sentiment: "bullish",
    impact: "1.0",
    rateImpact: "0.0",
  });
  const [cashInputs, setCashInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const fetchMarketState = useCallback(async () => {
    try {
      const response = await fetch("/api/market/state");
      if (!response.ok) {
        throw new Error("시장 상태를 불러올 수 없습니다.");
      }
      const data = await response.json();
      setMarketState(data.state);
    } catch (error) {
      console.error("[MARKET][STATE][GET]", error);
    }
  }, []);

  const scoreboard = useMemo(() => {
    return [...users]
      .map((user) => {
        const holdingsValue = user.holdings.reduce((sum, holding) => sum + holding.price * holding.shares, 0);
        const totalValue = holdingsValue + user.cashBalance;
        return { ...user, holdingsValue, totalValue };
      })
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [users]);

  const refreshUsers = useCallback(async (authToken: string) => {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) {
      throw new Error("사용자 목록을 불러오지 못했습니다.");
    }
    const data = await response.json();
    const fetchedUsers = (data.users ?? []) as AdminUser[];
    setUsers(fetchedUsers);
    const cashMap: Record<string, string> = {};
    fetchedUsers.forEach((user) => {
      cashMap[user.id] = user.cashBalance.toFixed(2);
    });
    setCashInputs(cashMap);
  }, []);

  const bootstrap = useCallback(
    async (authToken: string) => {
      try {
        const meResponse = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      if (!meResponse.ok) {
        throw new Error("관리자 인증에 실패했습니다.");
      }
      const meData = await meResponse.json();
      if (meData.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setAdminName(meData.name ?? "관리자");
      await refreshUsers(authToken);
    } finally {
      setLoading(false);
    }
  },
    [router, refreshUsers],
  );

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("summit-token") : null;
    if (!stored) {
      router.replace("/");
      return;
    }
    setToken(stored);
    bootstrap(stored).catch(() => {
      router.replace("/dashboard");
    });
  }, [bootstrap, router]);

  useEffect(() => {
    fetchMarketState();
  }, [fetchMarketState]);

  const handleMarketAction = useCallback(
    async (action: "pause" | "start" | "reset") => {
      if (!token) return;
      setActionLoading(`market-${action}`);
      setStatus(null);
      try {
        const response = await fetch("/api/market/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message ?? "시장 제어 실패");
        }
        const data = await response.json();
        setMarketState(data.state);
        const label =
          action === "reset" ? "초기화" : action === "start" ? "시작" : "정지";
        setStatus({ type: "success", message: `시장 ${label}되었습니다.` });
      } catch (error) {
        setStatus({ type: "error", message: error instanceof Error ? error.message : "시장 제어 실패" });
      } finally {
        setActionLoading(null);
      }
    },
    [token],
  );

  const handlePriceUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setActionLoading("price");
    setStatus(null);
    try {
      const priceClean = Number(stockForm.price);
      if (!stockForm.symbol || Number.isNaN(priceClean) || priceClean <= 0) {
        throw new Error("적절한 가격을 입력하세요.");
      }
      const response = await fetch("/api/admin/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol: stockForm.symbol, price: priceClean }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "가격 업데이트 실패");
      }
      setStatus({ type: "success", message: "주가 변동이 적용되었습니다." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleNewsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setActionLoading("news");
    setStatus(null);
    try {
      const impactValue = Number(newsForm.impact);
      const rateValue = Number(newsForm.rateImpact);
      if (
        !newsForm.title ||
        !newsForm.summary ||
        !newsForm.symbol ||
        Number.isNaN(impactValue) ||
        Number.isNaN(rateValue)
      ) {
        throw new Error("모든 뉴스 정보를 입력하세요.");
      }
      if (Math.abs(impactValue) > 30 || Math.abs(rateValue) > 30) {
        throw new Error("변동치는 ±30% 이내여야 합니다.");
      }
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newsForm.title,
          summary: newsForm.summary,
          symbol: newsForm.symbol,
          impact: impactValue,
          rateImpact: rateValue,
          sentiment: newsForm.sentiment,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "뉴스 등록 실패");
      }
      setStatus({ type: "success", message: "뉴스가 적용되었습니다." });
      setNewsForm((prev) => ({ ...prev, title: "", summary: "", impact: "1.0", rateImpact: "0.0" }));
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCashUpdate = async (userId: string) => {
    if (!token) return;
    const rawValue = Number(cashInputs[userId]);
    if (Number.isNaN(rawValue)) {
      setStatus({ type: "error", message: "현금 값을 숫자로 입력하세요." });
      return;
    }
    setActionLoading(`cash-${userId}`);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cashBalance: rawValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "현금 업데이트 실패");
      }
      await refreshUsers(token);
      setStatus({ type: "success", message: "현금 잔액이 반영되었습니다." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (!window.confirm("정말 이 사용자를 삭제하시겠습니까?")) return;
    setActionLoading(`delete-${userId}`);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "삭제에 실패했습니다.");
      }
      await refreshUsers(token);
      setStatus({ type: "success", message: "사용자가 삭제되었습니다." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("summit-token");
    router.replace("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">관리자 자격을 확인하는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">관리자 전용</p>
              <h1 className="text-3xl font-semibold">{adminName}님, 통제실에 오신 것을 환영합니다.</h1>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-2xl border border-white/20 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-white"
            >
              로그아웃
            </button>
          </div>
          <p className="text-sm text-slate-400">
            이 패널에서 유저 자산을 직접 조정하거나 주가를 일괄 변경하고, 신규 뉴스까지 배포할 수 있습니다.
            변경 사항은 즉시 사용자 화면에 반영됩니다.
          </p>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  marketState?.running
                    ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-200 border border-rose-500/30"
                }`}
              >
                {marketState ? (marketState.running ? "시장 실행 중" : "시장 정지") : "상태 로딩 중"}
              </span>
              <span className="text-xs text-slate-400">
                {marketState
                  ? `마지막 ${marketState.lastAction === "reset" ? "초기화" : marketState.lastAction} · ${
                      new Date(marketState.updatedAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }`
                  : "최신 상태를 불러오는 중입니다."}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleMarketAction(marketState?.running ? "pause" : "start")}
                disabled={!marketState || actionLoading?.startsWith("market-")}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-emerald-400 disabled:border-white/10 disabled:text-slate-500"
              >
                {marketState?.running ? (actionLoading === "market-pause" ? "정지 중..." : "시장 정지") : actionLoading === "market-start" ? "시작 중..." : "시장 시작"}
              </button>
              <button
                onClick={() => handleMarketAction("reset")}
                disabled={actionLoading === "market-reset"}
                className="rounded-2xl border border-emerald-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "market-reset" ? "초기화 중..." : "시장 초기화"}
              </button>
            </div>
          </div>
        </header>

        {status && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/50 bg-rose-500/10 text-rose-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">자산 순위</h2>
              <span className="text-xs text-slate-400">내림차순</span>
            </div>
            <ol className="mt-4 space-y-3 text-sm">
              {scoreboard.slice(0, 5).map((entry, index) => (
                <li key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">#{index + 1}</p>
                    <p className="text-base font-semibold text-white">{entry.name}</p>
                    <p className="text-xs text-slate-400">아이디 {entry.username}</p>
                    <p className="text-xs text-slate-400">
                      주식 {formatCurrency(entry.holdingsValue, { maximumFractionDigits: 0 })} · 현금 $
                      {entry.cashBalance.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-200">
                    {formatCurrency(entry.totalValue, { maximumFractionDigits: 0 })}
                  </p>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/40">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">주가 조정</p>
                <h3 className="text-lg font-semibold text-white">임의 변동</h3>
                <p className="text-sm text-slate-400">모든 계정의 보유 가격이 일괄 반영됩니다.</p>
                <form className="mt-4 space-y-3 text-sm" onSubmit={handlePriceUpdate}>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-3 py-2"
                    value={stockForm.symbol}
                    onChange={(event) => setStockForm((prev) => ({ ...prev, symbol: event.target.value }))}
                  >
                    {STOCK_SYMBOLS.map((symbol) => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={stockForm.price}
                    onChange={(event) => setStockForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2"
                    placeholder="새 시세 입력"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading === "price"}
                    className="w-full rounded-2xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {actionLoading === "price" ? "반영 중..." : "주가 반영"}
                  </button>
                </form>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">뉴스 배포</p>
                <h3 className="text-lg font-semibold text-white">임의 뉴스</h3>
                <p className="text-sm text-slate-400">즉시 푸시하여 자동 시세에 영향을 줍니다.</p>
                <form className="mt-4 space-y-3 text-sm" onSubmit={handleNewsSubmit}>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(event) => setNewsForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2"
                    placeholder="제목"
                  />
                  <textarea
                    required
                    value={newsForm.summary}
                    onChange={(event) => setNewsForm((prev) => ({ ...prev, summary: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2"
                    placeholder="요약"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                      value={newsForm.symbol}
                      onChange={(event) => setNewsForm((prev) => ({ ...prev, symbol: event.target.value }))}
                    >
                      {STOCK_SYMBOLS.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                      <option value="RATE">금리</option>
                    </select>
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                      value={newsForm.sentiment}
                      onChange={(event) => setNewsForm((prev) => ({ ...prev, sentiment: event.target.value }))}
                    >
                      <option value="bullish">강세</option>
                      <option value="bearish">약세</option>
                      <option value="neutral">중립</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newsForm.impact}
                    onChange={(event) => setNewsForm((prev) => ({ ...prev, impact: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2"
                    placeholder="영향력 (예: 1.5)"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newsForm.rateImpact}
                    onChange={(event) => setNewsForm((prev) => ({ ...prev, rateImpact: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2"
                    placeholder="금리 영향 (예: -0.25)"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading === "news"}
                    className="w-full rounded-2xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {actionLoading === "news" ? "툴 적용 중..." : "뉴스 추가"}
                  </button>
                </form>
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">사용자 자산 관리</h2>
              <button
                onClick={() => {
                  if (token) {
                    setStatus(null);
                    setActionLoading("refresh");
                    refreshUsers(token)
                      .catch((error) => setStatus({ type: "error", message: error.message }))
                      .finally(() => setActionLoading(null));
                  }
                }}
                disabled={actionLoading === "refresh"}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "refresh" ? "갱신 중..." : "최신화"}
              </button>
            </div>
          <div className="space-y-4">
            {users.map((user) => (
              <article key={user.id} className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 shadow-xl shadow-black/30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">ID: {user.id}</p>
                    <p className="text-lg font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-slate-400">아이디: {user.username}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">총 자산</p>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(
                        user.holdings.reduce((sum, holding) => sum + holding.price * holding.shares, 0) + user.cashBalance,
                        { maximumFractionDigits: 0 },
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-400">현금</label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        value={cashInputs[user.id] ?? user.cashBalance.toFixed(2)}
                        onChange={(event) => setCashInputs((prev) => ({ ...prev, [user.id]: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleCashUpdate(user.id)}
                        disabled={actionLoading === `cash-${user.id}`}
                        className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-200 disabled:opacity-60"
                      >
                        반영
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">보유 종목</p>
                    <p className="text-sm text-slate-300">
                      {user.holdings.length}개 · 평균 {user.holdings.reduce((sum, holding) => sum + holding.shares, 0)}주
                    </p>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={actionLoading === `delete-${user.id}`}
                      className="mt-2 w-full rounded-2xl border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-400 disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
