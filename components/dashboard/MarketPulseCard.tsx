import type { MarketIndex } from "@/types/portfolio";
import { formatPercent as percentUtil } from "@/lib/numberFormat";

type MarketPulseCardProps = {
  marketPulse: MarketIndex[];
  formatPercent?: typeof percentUtil;
  trendTone: (value: number) => string;
};

export default function MarketPulseCard({
  marketPulse,
  formatPercent = percentUtil,
  trendTone,
}: MarketPulseCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">시장 맥박</h3>
        <span className="text-xs uppercase tracking-[0.25em] text-slate-400">LIVE</span>
      </div>
      <div className="mt-4 space-y-4">
        {marketPulse.map((index) => (
          <div key={index.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm text-slate-400">{index.label}</p>
              <p className="text-xl font-semibold text-white">{index.value.toLocaleString("ko-KR")}</p>
            </div>
            <span className={`text-sm font-semibold ${trendTone(index.change)}`}>{formatPercent(index.change)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
