"use client";

import type { Holding } from "@/types/portfolio";
import { formatCurrency as currencyUtil, formatPercent as percentUtil, trendTone } from "@/lib/numberFormat";

type HoldingsTableProps = {
  holdings: Holding[];
  formatCurrency?: typeof currencyUtil;
  formatPercent?: typeof percentUtil;
};

export default function HoldingsTable({
  holdings,
  formatCurrency = currencyUtil,
  formatPercent = percentUtil,
}: HoldingsTableProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">보유 자산 개요</h2>
        <span className="text-sm text-slate-400">실시간 · {holdings.length}개 포지션</span>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/5 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">종목</th>
              <th className="px-4 py-3 font-medium">보유 수량</th>
              <th className="px-4 py-3 font-medium">평단가</th>
              <th className="px-4 py-3 font-medium">현재가</th>
              <th className="px-4 py-3 font-medium">손익</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {holdings.map((holding, index) => {
              const positionValue = holding.price * holding.shares;
              const costBasis = holding.avgCost * holding.shares;
              const pnl = positionValue - costBasis;
              const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100;

              return (
                <tr
                  key={`${holding.symbol}-${holding.direction ?? "long"}-${holding.openedAt ?? ""}-${index}`}
                  className="text-white/90"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold">{holding.symbol}</p>
                      <p className="text-xs text-slate-400">{holding.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">{holding.shares.toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatCurrency(holding.avgCost, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span>{formatCurrency(holding.price, { maximumFractionDigits: 2 })}</span>
                      <span className={`text-xs ${trendTone(holding.change)}`}>{formatPercent(holding.change)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className={trendTone(pnl)}>{formatCurrency(pnl, { maximumFractionDigits: 0 })}</span>
                      <span className={`text-xs ${trendTone(pnlPercent)}`}>{formatPercent(pnlPercent)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
