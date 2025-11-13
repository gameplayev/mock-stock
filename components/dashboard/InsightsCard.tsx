import type { Insight } from "@/types/portfolio";

type InsightsCardProps = {
  insights: Insight[];
};

export default function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">인사이트</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">BETA</span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.title} className="flex flex-col rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{insight.title}</p>
            <p className="mt-3 flex-1 text-sm text-slate-300">{insight.description}</p>
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
              {insight.action}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
