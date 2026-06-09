"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps<T> {
  data: T[];
  dataKey: keyof T;
  xAxisKey: keyof T;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  formatTooltipLabel?: (label: string) => string;
  formatTooltipValue?: (value: number) => string;
  interval?: number | "preserveEnd" | "preserveStart" | "preserveStartEnd";
  gradient?: {
    startColor: string;
    endColor: string;
  };
}

export function PriceChart<T extends Record<string, unknown>>({
  data,
  dataKey,
  xAxisKey,
  formatXAxis,
  formatYAxis,
  formatTooltipLabel,
  formatTooltipValue,
  interval,
  gradient = {
    startColor: "#10b981",
    endColor: "#10b981",
  },
}: PriceChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradient.startColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={gradient.endColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey={xAxisKey as string}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          interval={interval}
          tickFormatter={formatXAxis}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickFormatter={formatYAxis}
        />

        <Tooltip
          formatter={
            formatTooltipValue
              ? (value: number) => [formatTooltipValue(value), "Close"]
              : undefined
          }
          labelFormatter={formatTooltipLabel}
          labelStyle={{ fontSize: 12, color: "#a1a1aa" }}
          itemStyle={{ fontSize: 12, color: "#e4e4e7" }}
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            padding: "6px 8px",
            color: "#fff",
          }}
        />

        <Area
          type="monotone"
          dataKey={dataKey as string}
          stroke={gradient.startColor}
          strokeWidth={2}
          fill="url(#priceGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
