// 통일된 숫자/색상 포맷 유틸리티
export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...options,
  }).format(value);

export const formatPercent = (value: number, digits = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;

export const trendTone = (value: number) => (value >= 0 ? "text-emerald-400" : "text-rose-400");
