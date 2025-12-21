## Summit Alpha — Mock Stock Experience (KR)

A polished, single-page mock brokerage dashboard built with **Next.js 15 (App Router)** and **Tailwind CSS**. Every visible string in the UI is localized to Korean so you can demo flows for domestic stakeholders without extra wiring.

### Highlights
- Hero “cockpit” with total balance, CTA actions, and contextual timestamp copy (한국어 지원).
- Holdings table with computed P/L, allocations, and gradient progress bars.
- Secondary cards for watchlists, macro pulse, upcoming events, insights, sentiment, plus 투자 패널과 계정 관리.
- Automated 뉴스 생성과 가격 반영 로직으로 “실시간” 체험을 제공합니다.
- Tailwind-driven glassmorphism theme with subtle gradients and typography tweaks.

### Development

```bash
npm install        # already run once, but safe if deps change
npm run dev        # start Next.js on http://localhost:3000
npm run lint       # ensure ESLint passes before shipping
```

글로벌 스타일은 `app/globals.css`, 대시보드 UI는 `components/dashboard/*`와 `hooks/useMockMarket.ts`로 모듈화되어 있으니 필요한 카드만 교체하거나 재사용할 수 있습니다.

### Authentication & Personal Dashboard

- `app/page.tsx` — 로그인/회원가입 화면. 성공 시 JWT 토큰을 `localStorage`에 저장합니다.
- `app/dashboard/page.tsx` — 토큰을 검증해 개인 포트폴리오와 현금 잔고, 리더보드를 로딩하고 투자/계정 명령을 처리합니다.
- `app/api/auth/*` — MongoDB + JWT 기반의 인증 라우트. `register`는 샘플 자산과 현금 잔고를 만들고, `login`은 토큰을, `delete`는 계정을 삭제합니다.
- `app/api/portfolio` — 사용자별 보유 종목·현금 잔고를 내려줍니다.
- `app/api/portfolio/invest` — 지정한 종목/수량/가격으로 매수하고 잔고를 차감합니다.
- `app/api/leaderboard` — 전체 사용자 기준 누적 자산 상위 순위를 제공합니다.

환경 변수:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster-url/db
JWT_SECRET=임의의-난수-문자열
```

### Deployment

Deploy straight to [Vercel](https://vercel.com/new) or your preferred platform. The project is static-friendly—no environment variables or server components beyond defaults—so the default Next.js build (`npm run build && npm run start`) works everywhere.
