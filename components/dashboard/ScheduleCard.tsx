export default function ScheduleCard() {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-900/20 p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-white">다가오는 일정</h3>
      <ul className="mt-5 space-y-4 text-sm text-slate-300">
        {[
          {
            title: "미국 CPI 발표",
            subtitle: "내일 · 오전 8:30 (ET)",
            badge: "변동성 경보",
            tone: "bg-amber-500/20 text-amber-200",
          },
          {
            title: "NVDA 실적 발표",
            subtitle: "3일 후",
            badge: "대기 중",
            tone: "bg-emerald-500/10 text-emerald-200",
          },
          {
            title: "자동 매수 $2.5K",
            subtitle: "주간 · 테크 슬리브",
            badge: "예약됨",
            tone: "bg-cyan-500/10 text-cyan-200",
          },
        ].map((item) => (
          <li key={item.title} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-xs text-slate-400">{item.subtitle}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>{item.badge}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
