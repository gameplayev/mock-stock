"use client";

type InterestRateCardProps = {
  rate: string;
  description?: string;
};

export default function InterestRateCard({ rate, description = "유휴 현금이 이자 수익을 상회할 수 있도록 포트폴리오를 정리하세요." }: InterestRateCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900/70 to-slate-900/30 p-6 shadow-xl shadow-black/30">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">금리 안내</p>
      <p className="mt-3 text-4xl font-semibold text-white">{rate}</p>
      <p className="text-sm text-slate-300">연 환산 기준 · 단순 복리 적용</p>
      <p className="mt-5 text-sm text-slate-300">{description}</p>
    </div>
  );
}
