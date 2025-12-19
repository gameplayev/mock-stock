"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Holding } from "@/types/portfolio";
import { formatCurrency } from "@/lib/numberFormat";

type InvestPanelProps = {
  holdings: Holding[];
  token: string;
  cashBalance: number;
  onSuccess: () => void;
};

const EMPTY_FORM = {
  symbol: "",
  customSymbol: "",
  shares: "",
  price: "",
};

// 사용자가 수동으로 주문을 입력해 포트폴리오를 업데이트하는 패널
export default function InvestPanel({ holdings, token, cashBalance, onSuccess }: InvestPanelProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectableSymbols = useMemo(() => holdings.map((holding) => holding.symbol), [holdings]);

  const resolvedSymbol = form.symbol === "custom" ? form.customSymbol.trim().toUpperCase() : form.symbol;
  const resolvedPrice = form.price;
  const selectedHolding =
    holdings.find((holding) => holding.symbol === resolvedSymbol && holding.direction === direction) ??
    holdings.find((holding) => holding.symbol === resolvedSymbol);

  useEffect(() => {
    if (form.symbol && form.symbol !== "custom") {
      const matched =
        holdings.find((holding) => holding.symbol === form.symbol && holding.direction === direction) ??
        holdings.find((holding) => holding.symbol === form.symbol);
      setForm((prev) => ({ ...prev, price: matched ? String(matched.price) : "" }));
    } else if (form.symbol === "custom") {
      setForm((prev) => ({ ...prev, price: "" }));
    }
  }, [form.symbol, holdings, direction]);

  const clampShares = useCallback(
    (value: string) => {
      if (!value) return "";
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return value;
      if (action === "sell" && selectedHolding && numeric > selectedHolding.shares) {
        return String(selectedHolding.shares);
      }
      return value;
    },
    [action, selectedHolding],
  );

  useEffect(() => {
    if (form.shares) {
      setForm((prev) => ({ ...prev, shares: clampShares(prev.shares) }));
    }
  }, [action, selectedHolding, clampShares, form.shares]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!resolvedSymbol || !form.shares || !resolvedPrice) {
      setStatus("필수 입력값을 모두 채워주세요.");
      return;
    }

      if (action === "sell") {
        if (!selectedHolding) {
          setStatus(`${direction === "long" ? "롱" : "숏"} 포지션이 존재하지 않습니다.`);
          return;
        }
        if (Number(form.shares) > selectedHolding.shares) {
          setStatus("보유 수량보다 많이 팔 수 없습니다.");
          return;
        }
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
          name: resolvedSymbol,
          shares: Number(form.shares),
          price: Number(resolvedPrice),
          action,
          direction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "주문이 거절되었습니다.");
      }

      setForm(EMPTY_FORM);
      setStatus(
        `${direction === "long" ? "롱" : "숏"} ${action === "buy" ? "진입" : "청산"} 주문이 체결되었습니다.`,
      );
      onSuccess();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "주문 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

      <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
        <div>
          <label className="text-slate-300">동작</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {[
              { value: "buy", label: "매수" },
              { value: "sell", label: "매도" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAction(option.value as "buy" | "sell")}
                className={`rounded-2xl border px-4 py-2 font-semibold transition ${
                  action === option.value ? "border-emerald-400 bg-emerald-400/20 text-white" : "border-white/10 text-slate-300"
                }`}
              >
                {option.label}
            </button>
          ))}
        </div>
      </div>

        <div>
          <label className="text-slate-300">포지션</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {[
              { value: "long", label: "롱" },
              { value: "short", label: "숏" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDirection(option.value as "long" | "short")}
                className={`rounded-2xl border px-4 py-2 font-semibold transition ${
                  direction === option.value
                    ? "border-emerald-400 bg-emerald-400/20 text-white"
                    : "border-white/10 text-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-300">종목</label>
          <div className="mt-1 flex gap-2">
            <select
              className="w-1/2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
              value={form.symbol}
              onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))}
            >
              <option value="">종목 선택</option>
              {selectableSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
              <option value="custom">직접 입력</option>
            </select>
            {form.symbol === "custom" && (
              <input
                type="text"
                className="w-1/2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm uppercase focus:border-emerald-400 focus:outline-none"
                value={form.customSymbol}
                onChange={(event) => setForm((prev) => ({ ...prev, customSymbol: event.target.value }))}
                placeholder="예: TSLA"
              />
            )}
          </div>
        </div>

      <div>
          <label className="text-slate-300">수량</label>
          <input
            type="number"
            min="1"
            value={form.shares}
            onChange={(event) => {
              const clamped = clampShares(event.target.value);
              setForm((prev) => ({ ...prev, shares: clamped }));
            }}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
            placeholder="매수 수량"
          />
        </div>

        <div>
          <label className="text-slate-300">가격 (USD)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={resolvedPrice}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 focus:border-emerald-400 focus:outline-none"
            placeholder="체결 단가"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-2xl bg-emerald-400/90 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "주문 전송 중..." : action === "buy" ? "시장가 매수" : "시장가 매도"}
        </button>
      </form>

      <div className="mt-3 text-xs text-slate-400">
        {action === "sell" && selectedHolding ? (
          <p>
            현재 {selectedHolding.symbol} {direction === "long" ? "롱" : "숏"} {selectedHolding.shares.toLocaleString()}
            주 · 평단 {formatCurrency(selectedHolding.avgCost, { maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p>매수 시 현금 잔액에서 차감되고, 매도 시 현금이 추가됩니다.</p>
        )}
        <p className="mt-1">선물 포지션은 3분 후 자동 청산됩니다.</p>
      </div>

      {status && <p className="mt-2 text-center text-xs text-amber-200">{status}</p>}
    </div>
  );
}
