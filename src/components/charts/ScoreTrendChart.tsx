"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendPoint {
  date: string;
  pitch?: number | null;
  stability?: number | null;
  expressive?: number | null;
  vibrato?: number | null;
  rhythm?: number | null;
}

interface ScoreTrendChartProps {
  data: TrendPoint[];
  bestScore?: number | null;
}

const LINES = [
  { key: "pitch", label: "音程", color: "#ec4899" },
  { key: "stability", label: "安定性", color: "#3b82f6" },
  { key: "expressive", label: "表現力", color: "#10b981" },
  { key: "vibrato", label: "ビブラート", color: "#f59e0b" },
  { key: "rhythm", label: "リズム", color: "#8b5cf6" },
];

export default function ScoreTrendChart({ data, bestScore }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toFixed(1)}`,
            name,
          ]}
        />
        <Legend />
        {bestScore != null && (
          <ReferenceLine
            y={bestScore}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: "自己最高", position: "insideTopRight", fontSize: 10 }}
          />
        )}
        {LINES.map(({ key, label, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
