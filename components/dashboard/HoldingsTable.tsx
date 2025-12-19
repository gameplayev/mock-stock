import type { Holding } from "@/types/portfolio";
import { formatCurrency as currencyUtil, formatPercent as percentUtil } from "@/lib/numberFormat";
import { trendTone } from "@/lib/numberFormat";

type HoldingsTableProps = {
  holdings: Holding[];
  formatCurrency?: typeof currencyUtil;
  formatPercent?: typeof percentUtil;
};

type DirectionSummary = {
  direction: "long" | "short";
  label: string;
};

const directionSummaries: DirectionSummary[] = [
  { direction: "long", label: "롱 포지션" },
  { direction: "short", label: "숏 포지션" },
];

export default function HoldingsTable({
  holdings,
  formatCurrency = currencyUtil,
  formatPercent = percentUtil,
}: HoldingsTableProps) {
  const summarizeDirection = (direction: "long" | "short") => {
    const positions = holdings.filter((holding) => holding.direction === direction && holding.shares > 0);
    const totalValue = positions.reduce((sum, holding) => sum + holding.price * holding.shares, 0);
    const averageChange =
      positions.length === 0 ? 0 : positions.reduce((sum, holding) => sum + holding.change, 0) / positions.length;

    return { positions, totalValue, averageChange };
  };

  const summaries = directionSummaries
    .map((summary) => ({
      ...summary,
      data: summarizeDirection(summary.direction),
    }))
    .filter((summary) => summary.data.positions.length > 0);

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">보유 자산 개요</h2>
        <span className="text-sm text-slate-400">실시간 · {holdings.length}개 포지션</span>
      </div>
      {summaries.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {summaries.map((summary) => (
            <div
              key={summary.direction}
              className={`rounded-2xl border border-white/10 p-4 text-sm ${
                summary.direction === "long"
                  ? "bg-emerald-500/5 border-emerald-400/30"
                  : "bg-rose-500/5 border-rose-400/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{summary.label}</p>
                <span
                  className={`text-xs font-semibold ${
                    summary.direction === "long" ? "text-emerald-200" : "text-rose-200"
                  }`}
                >
                  {summary.data.positions.length}개
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatCurrency(summary.data.totalValue, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-400">
                평균 {formatPercent(summary.data.averageChange)} · {summary.data.positions.length}건 진행중
              </p>
              <div className="mt-3 space-y-1 text-[0.75rem] text-slate-300">
                {summary.data.positions.map((position) => (
                  <div key={`${position.symbol}-${position.direction}`} className="flex items-center justify-between">
                    <span className="font-semibold text-white">{position.symbol}</span>
                    <span className="text-xs text-slate-400">
                      {position.shares.toLocaleString()}주 ·{" "}
                      {formatCurrency(position.price, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
            {holdings.map((holding) => {
              const positionValue = holding.price * holding.shares;
              const costBasis = holding.avgCost * holding.shares;
              const pnl = positionValue - costBasis;
              const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100;

              return (
                <tr key={holding.symbol} className="text-white/90">
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
