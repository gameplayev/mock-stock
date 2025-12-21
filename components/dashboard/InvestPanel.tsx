"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FuturesOrder, Holding } from "@/types/portfolio";
import { baseHoldings } from "@/lib/mockData";
import { formatCurrency } from "@/lib/numberFormat";

type InvestPanelProps = {
  holdings: Holding[];
  token: string;
  cashBalance: number;
  onSuccess: () => void;
  onFuturesOrdersUpdate?: (orders: FuturesOrder[]) => void;
  marketRunning: boolean;
};

const AVAILABLE_SYMBOLS = baseHoldings.map((holding) => holding.symbol);
const DEFAULT_SYMBOL = AVAILABLE_SYMBOLS[0] ?? "";
const PRICE_LOOKUP = baseHoldings.reduce<Record<string, number>>((acc, holding) => {
  acc[holding.symbol] = holding.price;
  return acc;
}, {});
const NAME_LOOKUP = baseHoldings.reduce<Record<string, string>>((acc, holding) => {
  acc[holding.symbol] = holding.name;
  return acc;
}, {});

const EMPTY_FORM = {
  symbol: DEFAULT_SYMBOL,
  shares: "",
};

type StatusVariant = "success" | "error" | "info";
type FormStatus = {
  text: string;
  variant: StatusVariant;
};

export default function InvestPanel({
  holdings,
  token,
  cashBalance,
  onSuccess,
  onFuturesOrdersUpdate,
  marketRunning,
}: InvestPanelProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [action, setAction] = useState<"buy" | "sell" | "futures">("buy");
  const [futuresForm, setFuturesForm] = useState({
    symbol: DEFAULT_SYMBOL,
    shares: "",
    leverage: 3,
    direction: "long" as "long" | "short",
  });
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const heldSymbols = useMemo(
    () =>
      Array.from(
        new Set(holdings.filter((holding) => holding.shares > 0).map((holding) => holding.symbol)),
      ),
    [holdings],
  );
  const symbolOptions = action === "sell" ? heldSymbols : AVAILABLE_SYMBOLS;
  const resolvedSymbol = symbolOptions.includes(form.symbol) ? form.symbol : symbolOptions[0] ?? "";
  const hasSellableSymbols = heldSymbols.length > 0;
  useEffect(() => {
    if (!symbolOptions.includes(form.symbol) && symbolOptions.length) {
      setForm((prev) => ({ ...prev, symbol: symbolOptions[0] }));
    }
  }, [symbolOptions, form.symbol]);
  const direction = action === "buy" ? "long" : "short";
  const latestPrice =
    holdings.find((holding) => holding.symbol === resolvedSymbol)?.price ?? PRICE_LOOKUP[resolvedSymbol] ?? 0;
  const futuresMarketPrice =
    holdings.find((holding) => holding.symbol === futuresForm.symbol)?.price ??
    PRICE_LOOKUP[futuresForm.symbol] ??
    0;
  const marketSymbol = action === "futures" ? futuresForm.symbol : resolvedSymbol;
  const marketPrice = action === "futures" ? futuresMarketPrice : latestPrice;
  const currentPosition = holdings.find((holding) => holding.symbol === resolvedSymbol);
  const tradingDisabled = !marketRunning;
  const selectDisabled = tradingDisabled || (action === "sell" && !hasSellableSymbols);
  const sellDisabled = action === "sell" && !hasSellableSymbols;
  const emitStatus = (text: string, variant: StatusVariant) => setStatus({ text, variant });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!marketRunning) {
      emitStatus("시장 점검 중에는 주문할 수 없습니다.", "error");
      return;
    }
    if (!token) return;

    if (action === "futures") {
      const futuresShares = Number(futuresForm.shares);
      if (!futuresForm.symbol) {
        emitStatus("종목을 선택해주세요.", "error");
        return;
      }
      if (Number.isNaN(futuresShares) || futuresShares <= 0) {
        emitStatus("수량을 1개 이상 입력하세요.", "error");
        return;
      }
      if (futuresForm.leverage < 1 || futuresForm.leverage > 10) {
        emitStatus("레버리지를 1~10배 범위로 선택하세요.", "error");
        return;
      }

      const futuresPrice =
        holdings.find((holding) => holding.symbol === futuresForm.symbol)?.price ??
        PRICE_LOOKUP[futuresForm.symbol] ??
        0;
      if (futuresPrice <= 0) {
        emitStatus("시장가를 가져올 수 없습니다.", "error");
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const response = await fetch("/api/portfolio/futures", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            symbol: futuresForm.symbol,
            name: NAME_LOOKUP[futuresForm.symbol] ?? futuresForm.symbol,
            shares: futuresShares,
            price: futuresPrice,
            leverage: futuresForm.leverage,
            direction: futuresForm.direction,
          }),
        });

        const responseBody = await response.json();
        if (!response.ok) {
          throw new Error(responseBody.message ?? "선물 주문이 거절되었습니다.");
        }

        if (Array.isArray(responseBody.futuresOrders)) {
          onFuturesOrdersUpdate?.(responseBody.futuresOrders as FuturesOrder[]);
        }
        setFuturesForm((prev) => ({ ...prev, shares: "" }));
        emitStatus("선물 주문이 접수되었습니다.", "success");
        onSuccess();
      } catch (error) {
        emitStatus(
          error instanceof Error ? error.message : "선물 주문 처리 중 오류가 발생했습니다.",
          "error",
        );
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!resolvedSymbol) {
      emitStatus("종목을 선택해주세요.", "error");
      return;
    }

    const sharesValue = Number(form.shares);
    if (Number.isNaN(sharesValue) || sharesValue <= 0) {
      emitStatus("보유 수량을 1주 이상 입력하세요.", "error");
      return;
    }

    if (latestPrice <= 0) {
      emitStatus("시장가를 가져올 수 없습니다.", "error");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/portfolio/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: resolvedSymbol,
          name: NAME_LOOKUP[resolvedSymbol] ?? resolvedSymbol,
          shares: sharesValue,
          price: latestPrice,
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "주문이 거절되었습니다.");
      }

      setForm((prev) => ({ ...prev, shares: "" }));
      emitStatus(
        `시장가 ${action === "buy" ? "매수" : "매도"} 주문이 체결되었습니다.`,
        "success",
      );
      onSuccess();
    } catch (error) {
      emitStatus(
        error instanceof Error ? error.message : "주문 처리 중 오류가 발생했습니다.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSellAll = async () => {
    if (!marketRunning) {
      emitStatus("시장 점검 중에는 주문할 수 없습니다.", "error");
      return;
    }
    if (!token) {
      emitStatus("로그인 정보를 확인할 수 없어 주문할 수 없습니다.", "error");
      return;
    }
    if (!currentPosition || currentPosition.shares <= 0) {
      emitStatus("매도 가능한 자산이 없습니다.", "error");
      return;
    }
    if (latestPrice <= 0) {
      emitStatus("시장가를 가져올 수 없습니다.", "error");
      return;
    }

    setLoading(true);
    emitStatus("전량 매도 주문을 전송 중입니다.", "info");
    try {
      const response = await fetch("/api/portfolio/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: currentPosition.symbol,
          name: currentPosition.name ?? currentPosition.symbol,
          shares: currentPosition.shares,
          price: latestPrice,
          action: "sell",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "주문이 거부되었습니다.");
      }

      setForm((prev) => ({ ...prev, shares: "" }));
      emitStatus("시장가 매도 주문이 체결되었습니다.", "success");
      onSuccess();
    } catch (error) {
      emitStatus(
        error instanceof Error ? error.message : "주문 처리 중 오류가 발생했습니다.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAction = (value: "buy" | "sell" | "futures") => {
    if (tradingDisabled) return;
    setAction(value);
  };

  const leverageOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= 10; i += 1) {
      options.push(i);
    }
    return options;
  }, []);

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/40 backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">투자</p>
          <h3 className="text-lg font-semibold text-white">수동 주문 패널</h3>
        </div>
        <p className="text-sm text-slate-300">
          가용 현금 <span className="font-semibold text-white">${cashBalance.toLocaleString()}</span>
        </p>
      </header>
      {!marketRunning && (
        <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          시장이 정지되어 있습니다. 재시작 후 주문이 가능해집니다.
        </div>
      )}

      <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
        <div>
          <label className="text-slate-300">동작</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {[
              { value: "buy", label: "매수" },
              { value: "sell", label: "매도" },
              { value: "futures", label: "선물" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAction(option.value as "buy" | "sell" | "futures")}
                className={`rounded-2xl border px-4 py-2 font-semibold transition ${
                  action === option.value
                    ? "border-emerald-400 bg-emerald-400/20 text-white"
                    : "border-white/10 text-slate-300"
                }`}
                disabled={tradingDisabled}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {action !== "futures" ? (
          <>
            <div>
              <label className="text-slate-300">종목</label>
              <select
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
                value={resolvedSymbol}
                onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))}
                disabled={selectDisabled}
              >
                {symbolOptions.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
              {action === "sell" && !hasSellableSymbols && (
                <p className="mt-1 text-xs text-rose-200">매도 가능한 자산이 없습니다.</p>
              )}
            </div>

            <div>
              <label className="text-slate-300">수량</label>
              <input
                type="number"
                min="1"
                value={form.shares}
                onChange={(event) => setForm((prev) => ({ ...prev, shares: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
                placeholder={action === "buy" ? "매수 수량" : "매도 수량"}
                disabled={tradingDisabled}
              />
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">선물 포지션</p>
              <span className="text-xs text-slate-400">1배 ~ 10배 레버리지</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "long", label: "롱" },
                { value: "short", label: "숏" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFuturesForm((prev) => ({ ...prev, direction: option.value as "long" | "short" }))}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    futuresForm.direction === option.value
                      ? "border-emerald-400 bg-emerald-400/20 text-white"
                      : "border-white/10 text-slate-300"
                  }`}
                  disabled={tradingDisabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-slate-300">레버리지</label>
              <select
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
                value={futuresForm.leverage}
                onChange={(event) =>
                  setFuturesForm((prev) => ({ ...prev, leverage: Number(event.target.value) }))
                }
                disabled={tradingDisabled}
              >
                {leverageOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}x
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300">종목</label>
              <select
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
                value={futuresForm.symbol}
                onChange={(event) => setFuturesForm((prev) => ({ ...prev, symbol: event.target.value }))}
                disabled={tradingDisabled}
              >
                {AVAILABLE_SYMBOLS.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300">수량</label>
              <input
                type="number"
                min="1"
                value={futuresForm.shares}
                onChange={(event) => setFuturesForm((prev) => ({ ...prev, shares: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
                placeholder="계약 수량"
                disabled={tradingDisabled}
              />
            </div>
            <p className="text-xs text-slate-400">
              선물 주문 UI 단계이며, 실제 체결 로직은 추후 연결됩니다.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">시장가</p>
          <p className="text-lg font-semibold text-white">
            {marketPrice > 0 ? `${marketSymbol} $${marketPrice.toFixed(2)}` : "데이터 없음"} · 자동 계산
          </p>
          <p className="text-xs text-slate-500">
            {action === "futures"
              ? "선물 주문은 현재 시장가 기준으로 평가됩니다."
              : "롱 포지션은 자동 청산되며, 숏 매도는 시장가로 체결됩니다."}
          </p>
        </div>

        {action === "futures" ? (
          <button
            type="submit"
            disabled={loading || !token || tradingDisabled}
            className="w-full rounded-2xl bg-emerald-400/90 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "주문 전송 중..." : "선물 주문"}
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={loading || !token || tradingDisabled || sellDisabled}
              className={`w-full rounded-2xl py-3 text-sm font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                action === "buy"
                  ? "bg-emerald-400/90 hover:bg-emerald-300"
                  : "bg-rose-500/90 hover:bg-rose-400"
              }`}
            >
              {loading ? "주문 전송 중..." : action === "buy" ? "시장가 매수" : "시장가 매도"}
            </button>
            {action === "sell" && hasSellableSymbols && currentPosition?.shares ? (
              <button
                type="button"
                onClick={handleSellAll}
                disabled={loading || !token || tradingDisabled || currentPosition.shares <= 0}
                className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "전량 매도 중..." : "전량 매도"}
              </button>
            ) : null}
          </>
        )}
      </form>

      <div className="mt-3 text-xs text-slate-400">
        {action === "futures" ? (
          <>
            <p>선물 주문은 지정한 레버리지로 3분 뒤 자동 청산됩니다.</p>
            <p className="mt-1">체결 로직은 추후 업데이트됩니다.</p>
          </>
        ) : currentPosition ? (
          <>
            <p>
              현재 {currentPosition.symbol} {direction === "long" ? "롱" : "숏"} {currentPosition.shares.toLocaleString()}주
              · 평단 {formatCurrency(currentPosition.avgCost, { maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1">선물 포지션은 3분 뒤 자동 청산됩니다.</p>
          </>
        ) : (
          <>
            <p>{direction === "long" ? "롱" : "숏"} 포지션이 존재하지 않습니다.</p>
            <p className="mt-1">선물 포지션은 3분 뒤 자동 청산됩니다.</p>
          </>
        )}
      </div>

      {status && (
        <p
          className={`mt-2 text-center text-xs font-semibold ${
            status.variant === "success"
              ? "text-emerald-300"
              : status.variant === "error"
              ? "text-rose-300"
              : "text-amber-200"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
