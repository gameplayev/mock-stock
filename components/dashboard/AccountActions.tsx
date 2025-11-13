"use client";

type AccountActionsProps = {
  onLogout: () => void;
  onDelete: () => Promise<void>;
  loading: boolean;
};

// 세션 종료 및 계정 삭제 버튼 묶음
export default function AccountActions({ onLogout, onDelete, loading }: AccountActionsProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-xl shadow-black/30 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">계정 관리</p>
      <h3 className="mt-2 text-lg font-semibold text-white">세션 & 계정</h3>
      <p className="mt-1 text-sm text-slate-300">보안을 위해 사용하지 않을 때는 로그아웃하거나 계정을 정리하세요.</p>

      <div className="mt-5 space-y-3 text-sm">
        <button
          onClick={onLogout}
          className="w-full rounded-2xl border border-white/10 px-4 py-3 font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-200"
        >
          로그아웃
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="w-full rounded-2xl border border-rose-500/30 px-4 py-3 font-semibold text-rose-100 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "계정 삭제 중..." : "계정 삭제"}
        </button>
      </div>
    </div>
  );
}
