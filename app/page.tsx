"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

// 인증 모드 타입
type AuthMode = "login" | "register";
type AccountRole = "user" | "admin";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccountRole>("user");
  const [adminCode, setAdminCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // API 호출 공통 핸들러
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { username, password }
        : {
            name,
            username,
            password,
            role,
            adminCode: role === "admin" ? adminCode : undefined,
          };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "요청 처리 중 오류가 발생했습니다.");
      }

      const data = await response.json();

      if (mode === "login") {
        localStorage.setItem("summit-token", data.token);
        const destination = data.role === "admin" ? "/admin" : "/dashboard";
        router.push(destination);
      } else {
        setStatus("가입이 완료되었습니다. 이제 로그인하세요.");
        setMode("login");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-500/10 backdrop-blur">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Summit Alpha</p>
          <h1 className="text-3xl font-semibold">{mode === "login" ? "로그인" : "회원 가입"}</h1>
          <p className="text-sm text-slate-300">
            {mode === "login" ? "계정을 통해 모의 투자를 시작하세요." : "새 계정을 만들어보세요."}
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-sm text-slate-300">이름</label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                placeholder="홍길동"
              />
            </div>
          )}

          <div className="space-y-1">
          <label className="text-sm text-slate-300">아이디</label>
          <input
            type="text"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="id123"
          />
          </div>

          {mode === "register" && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-slate-300">계정 유형</p>
                <div className="mt-1 flex gap-2">
                  {[
                    { value: "user", label: "일반 계정" },
                    { value: "admin", label: "관리자 계정" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value as AccountRole)}
                      className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        role === option.value
                          ? "border-emerald-400 bg-emerald-400/20 text-white"
                          : "border-white/10 text-slate-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {role === "admin" && (
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">관리자 인증 코드</label>
                  <input
                    type="password"
                    required
                    value={adminCode}
                    onChange={(event) => setAdminCode(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="관리자 코드 입력"
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <label className="text-sm text-slate-300">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "처리 중..." : mode === "login" ? "대시보드 입장" : "계정 만들기"}
          </button>
        </form>

        {status && <p className="text-center text-sm text-amber-200">{status}</p>}

        <p className="text-center text-sm text-slate-400">
          {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
          <button
            className="font-semibold text-emerald-200 underline-offset-4 hover:underline"
            onClick={() => {
              const nextMode = mode === "login" ? "register" : "login";
              setMode(nextMode);
              if (nextMode === "login") {
                setRole("user");
                setAdminCode("");
              }
            }}
          >
            {mode === "login" ? "회원 가입" : "로그인"}
          </button>
        </p>
      </div>
    </main>
  );
}
