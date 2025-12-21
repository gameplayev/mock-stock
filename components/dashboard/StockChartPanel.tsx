"use client";

import { useEffect, useMemo, useState } from "react";
import type { Holding } from "@/types/portfolio";
import { baseHoldings } from "@/lib/mockData";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StockChartPanelProps = {
  holdings: Holding[];
};

const createSeries = (symbol: string, base: number) => {
  const seed = symbol.charCodeAt(0) + symbol.length * 3;
  return Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin((index + seed) / 4) * 0.03;
    const trend = index * 0.002;
    const variation = wave + trend;
    return Number((base * (1 + variation)).toFixed(2));
  });
};

const HISTORY_LENGTH = 12;

const BASE_SYMBOLS = baseHoldings.map((holding) => holding.symbol);
const SYMBOL_LOOKUP = baseHoldings.reduce<Record<string, Holding>>((acc, holding) => {
  acc[holding.symbol] = holding;
  return acc;
}, {});

export default function StockChartPanel({ holdings }: StockChartPanelProps) {
  const [history, setHistory] = useState<Record<string, number[]>>(() => {
    const seeded: Record<string, number[]> = {};
    BASE_SYMBOLS.forEach((symbol) => {
      const reference = SYMBOL_LOOKUP[symbol];
      seeded[symbol] = createSeries(symbol, reference?.price ?? 100);
    });
    return seeded;
  });
  const [selectedSymbol, setSelectedSymbol] = useState<string>(BASE_SYMBOLS[0]);

  useEffect(() => {
    if (!holdings.length) {
      return;
    }

    setHistory((prev) => {
      const next = { ...prev };
      holdings.forEach((holding) => {
        const symbol = holding.symbol;
        const latestPrice = Number(holding.price.toFixed(2));
        const previousSeries = next[symbol] ?? createSeries(symbol, latestPrice);
        const recent =
          previousSeries.length > HISTORY_LENGTH ? previousSeries.slice(-HISTORY_LENGTH) : previousSeries;
        const lastPrice = recent[recent.length - 1];
        if (lastPrice === latestPrice) {
          next[symbol] = recent;
          return;
        }
        next[symbol] = [...recent.slice(-HISTORY_LENGTH + 1), latestPrice];
      });
      return next;
    });
  }, [holdings]);

  const chartSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    BASE_SYMBOLS.forEach((symbol) => symbolSet.add(symbol));
    holdings.forEach((holding) => symbolSet.add(holding.symbol));
    Object.keys(history).forEach((symbol) => symbolSet.add(symbol));
    return Array.from(symbolSet).sort();
  }, [history, holdings]);

  useEffect(() => {
    if (!chartSymbols.length) {
      return;
    }
    setSelectedSymbol((prev) => (chartSymbols.includes(prev) ? prev : chartSymbols[0]));
  }, [chartSymbols]);

  const symbolToShow = selectedSymbol || chartSymbols[0] || BASE_SYMBOLS[0];
  const baseReference = SYMBOL_LOOKUP[symbolToShow];
  const active = holdings.find((holding) => holding.symbol === symbolToShow) ?? baseReference;
  const series = history[symbolToShow] ?? createSeries(symbolToShow, active?.price ?? 100);
  const minPoint = Math.min(...series);
  const maxPoint = Math.max(...series);
  const latest = series[series.length - 1];
  const previous = series[series.length - 2] ?? latest;
  const delta = Number((latest - previous).toFixed(2));
  const trendTone = delta >= 0 ? "text-emerald-300" : "text-rose-300";
  const gradientId = `line-chart-${symbolToShow}`;

  const chartData = series.map((value, index) => ({
    label: `T${index + 1}`,
    price: Number(value.toFixed(2)),
  }));

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">차트</p>
          <h3 className="text-lg font-semibold text-white">{symbolToShow} 차트</h3>
          <p className={`text-sm ${trendTone}`}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)} (최근)
          </p>
        </div>
        <select
          className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
          value={symbolToShow}
          onChange={(event) => setSelectedSymbol(event.target.value)}
        >
          {chartSymbols.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              fontSize={10}
              tick={{ fill: "rgba(148, 163, 184, 0.8)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(148, 163, 184, 0.8)" }}
              domain={["dataMin", "dataMax"]}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
              }}
              formatter={(value: number | undefined) => {
                const numeric = typeof value === "number" ? value : Number(value);
                if (Number.isNaN(numeric)) {
                  return ["-", "가격"];
                }
                return [`$${numeric.toFixed(2)}`, "가격"];
              }}
              labelFormatter={(label) => `${label}`}
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 }}
            />
            <Line
              dataKey="price"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-slate-400">
        <p>
          현재 {active ? `$${active.price.toFixed(2)}` : "-"} · {active?.direction?.toUpperCase() ?? "LONG"}
        </p>
        <p>
          최소 {minPoint.toFixed(2)} · 최대 {maxPoint.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
