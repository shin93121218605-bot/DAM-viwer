"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface RadarValues {
  pitch?: number | null;
  stability?: number | null;
  expressive?: number | null;
  vibrato?: number | null;
  rhythm?: number | null;
}

export interface RadarSeries {
  values: RadarValues;
  label: string;
  color: string;
}

interface RadarScoreChartProps {
  series: RadarSeries[];
}

export default function RadarScoreChart({ series }: RadarScoreChartProps) {
  const subjects = ["音程", "安定性", "表現力", "ビブラート", "リズム"];
  const keys: (keyof RadarValues)[] = ["pitch", "stability", "expressive", "vibrato", "rhythm"];

  const data = subjects.map((subject, i) => {
    const key = keys[i];
    const entry: Record<string, string | number> = { subject };
    series.forEach((s) => {
      entry[s.label] = s.values[key] ?? 0;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
        {series.map((s) => (
          <Radar
            key={s.label}
            name={s.label}
            dataKey={s.label}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.2}
          />
        ))}
        <Legend />
        <Tooltip formatter={(v: number) => v.toFixed(1)} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
