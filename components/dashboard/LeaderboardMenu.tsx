import type { LeaderboardEntry } from "@/types/portfolio";
import { formatCurrency } from "@/lib/numberFormat";

type LeaderboardMenuProps = {
  leaderboard: LeaderboardEntry[];
};

export default function LeaderboardMenu({ leaderboard }: LeaderboardMenuProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-900/10 p-6 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">대시보드 메뉴</p>
          <h2 className="mt-1 text-lg font-semibold text-white">자산 상위 트레이더</h2>
        </div>
        <span className="text-xs text-slate-400">총 {leaderboard.length}명</span>
      </div>
      <ul className="mt-4 divide-y divide-white/5 text-sm">
        {leaderboard.map((entry, index) => (
          <li key={entry.id} className="flex items-center justify-between py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">#{index + 1}</span>
                <p className="font-semibold text-white">{entry.name}</p>
              </div>
              <p className="text-xs text-slate-400">
                주식 가치 {formatCurrency(entry.holdingsValue, { maximumFractionDigits: 0 })} · 현금 $
                {entry.cashBalance.toLocaleString()}
              </p>
            </div>
            <p className="text-right text-base font-semibold text-emerald-200">
              {formatCurrency(entry.totalValue, { maximumFractionDigits: 0 })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
