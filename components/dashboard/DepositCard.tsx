"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { DepositInfo } from "@/types/portfolio";

type DepositCardProps = {
  deposit?: DepositInfo | null;
  loading: boolean;
  onStart: (amount: number) => Promise<void>;
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function DepositCard({ deposit, loading, onStart }: DepositCardProps) {
  const [amount, setAmount] = useState("");
  const [ticker, setTicker] = useState(() => Date.now());

  const due = useMemo(() => (deposit ? new Date(deposit.dueAt) : null), [deposit]);

  useEffect(() => {
    if (!due) {
      return undefined;
    }
    const timer = setInterval(() => setTicker(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [due]);
  const timeLeft = due ? Math.max(0, due.getTime() - ticker) : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount) {
      return;
    }
    await onStart(Number(amount));
    setAmount("");
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-900/20 p-6 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">예금</p>
        <span className="text-xs text-slate-400">{deposit ? "진행 중" : "자리 확보"}</span>
      </div>
      {deposit ? (
        <>
          <p className="mt-4 text-3xl font-semibold text-white">${deposit.amount.toLocaleString()}</p>
          <p className="text-sm text-slate-300">
            금리 {Math.round(deposit.interestRate * 1000) / 10}% · 이자 ${deposit.interest.toFixed(2)} 수령
          </p>
          <p className="mt-3 text-xs text-slate-400">만기까지 {formatCountdown(timeLeft)}</p>
          <p className="text-xs text-slate-400">
            만기일 {new Date(deposit.dueAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </>
      ) : (
        <form className="mt-4 space-y-3 text-sm" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-300">은행에 맡기면 5분간 자금은 묶입니다.</p>
          <div>
            <label className="text-xs text-slate-400">예치 금액</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
              placeholder="예: 5000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? "요청 중..." : "예금 시작 (5분)"}
          </button>
        </form>
      )}
    </div>
  );
}
