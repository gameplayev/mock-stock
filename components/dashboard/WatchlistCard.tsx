import type { WatchItem } from "@/types/portfolio";
import { formatCurrency as currencyUtil, formatPercent as percentUtil } from "@/lib/numberFormat";
import { trendTone as trendToneUtil } from "@/lib/numberFormat";

type WatchlistCardProps = {
  watchlist: WatchItem[];
  formatCurrency?: typeof currencyUtil;
  formatPercent?: typeof percentUtil;
  trendTone?: typeof trendToneUtil;
};

export default function WatchlistCard({
  watchlist,
  formatCurrency = currencyUtil,
  formatPercent = percentUtil,
  trendTone = trendToneUtil,
}: WatchlistCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">관심 종목</h2>
        <button className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">+ 추가</button>
      </div>
      <div className="mt-6 space-y-4">
        {watchlist.map((stock) => (
          <div key={stock.symbol} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-4">
            <div>
              <p className="font-semibold text-white">{stock.symbol}</p>
              <p className="text-xs text-slate-400">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-white">{formatCurrency(stock.price, { maximumFractionDigits: 2 })}</p>
              <p className={`text-sm ${trendTone(stock.change)}`}>{formatPercent(stock.change)}</p>
            </div>
            <div className="hidden w-32 flex-col text-right text-xs text-slate-400 sm:flex">
              <span>고가 {formatCurrency(stock.high, { maximumFractionDigits: 0 })}</span>
              <span>저가 {formatCurrency(stock.low, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
