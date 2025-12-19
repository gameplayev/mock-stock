import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "서밋 알파 | 모의 주식 터미널",
  description: "Next.js와 Tailwind CSS로 구현된 한국어 모의 증권 대시보드 데모입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
