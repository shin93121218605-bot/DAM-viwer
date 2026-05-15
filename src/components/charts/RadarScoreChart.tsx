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

interface RadarData {
  subject: string;
  best: number;
  latest: number;
}

interface RadarScoreChartProps {
  best: {
    pitch?: number | null;
    stability?: number | null;
    expressive?: number | null;
    vibrato?: number | null;
    rhythm?: number | null;
  };
  latest: {
    pitch?: number | null;
    stability?: number | null;
    expressive?: number | null;
    vibrato?: number | null;
    rhythm?: number | null;
  };
}

export default function RadarScoreChart({ best, latest }: RadarScoreChartProps) {
  const data: RadarData[] = [
    { subject: "音程", best: best.pitch ?? 0, latest: latest.pitch ?? 0 },
    { subject: "安定性", best: best.stability ?? 0, latest: latest.stability ?? 0 },
    { subject: "表現力", best: best.expressive ?? 0, latest: latest.expressive ?? 0 },
    { subject: "ビブラート", best: best.vibrato ?? 0, latest: latest.vibrato ?? 0 },
    { subject: "リズム", best: best.rhythm ?? 0, latest: latest.rhythm ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar
          name="最高記録"
          dataKey="best"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.25}
        />
        <Radar
          name="最新"
          dataKey="latest"
          stroke="#ec4899"
          fill="#ec4899"
          fillOpacity={0.25}
        />
        <Legend />
        <Tooltip formatter={(v: number) => v.toFixed(1)} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
