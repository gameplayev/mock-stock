export default function SessionStatsCard() {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900/30 p-6 shadow-xl">
      <h2 className="text-lg font-semibold">세션 통계</h2>
      <div className="mt-6 space-y-4 text-sm">
        {[
          { label: "체결 건수", value: "12" },
          { label: "승률", value: "64%" },
          { label: "최대 보유", value: "AAPL · $8,867" },
          { label: "평균 보유 기간", value: "48일" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-slate-400">{stat.label}</span>
            <span className="font-semibold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
