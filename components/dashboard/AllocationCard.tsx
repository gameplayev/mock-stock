import type { Holding } from "@/types/portfolio";

type AllocationCardProps = {
  holdings: Holding[];
};

export default function AllocationCard({ holdings }: AllocationCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-6 shadow-xl shadow-emerald-500/20">
    <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">자산 배분</h3>
          <p className="text-sm text-emerald-200/80">섹터 편중을 수치로 확인하세요</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
          {holdings.length}개 자산
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {holdings.map((holding) => (
          <div key={holding.symbol}>
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-white">
                {holding.symbol} · <span className="text-slate-300">{holding.name}</span>
              </p>
              <p className="font-semibold text-emerald-200">{holding.allocation}%</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ width: `${holding.allocation}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
