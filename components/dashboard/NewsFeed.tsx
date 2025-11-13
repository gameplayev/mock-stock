import type { Headline } from "@/types/portfolio";
import { formatPercent as percentUtil } from "@/lib/numberFormat";

type NewsFeedProps = {
  news: Headline[];
  formatPercent?: typeof percentUtil;
};

const sentimentLabel: Record<Headline["sentiment"], string> = {
  bullish: "강세",
  bearish: "약세",
  neutral: "중립",
};

export default function NewsFeed({ news, formatPercent = percentUtil }: NewsFeedProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">마켓 스토리</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">뉴스창</span>
      </div>
      <div className="mt-6 space-y-5">
        {news.map((headline) => (
          <article key={headline.id} className="rounded-2xl border border-white/5 bg-white/3 p-5 transition hover:border-white/20 hover:bg-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{headline.source}</span>
              <span>{headline.timeAgo}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white">{headline.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{headline.summary}</p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  headline.sentiment === "bullish"
                    ? "bg-emerald-500/10 text-emerald-200"
                    : headline.sentiment === "bearish"
                      ? "bg-rose-500/10 text-rose-200"
                      : "bg-slate-500/10 text-slate-200"
                }`}
              >
                {sentimentLabel[headline.sentiment]}
              </span>
              <p className="text-xs text-slate-400">
                대상: {headline.symbol} · 영향 {formatPercent(headline.impact)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
