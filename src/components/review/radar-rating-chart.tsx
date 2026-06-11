"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { AxisScore } from "@/lib/types";

const SIZES = {
  sm: { height: 130, fontSize: 0, outerRadius: "78%" },
  md: { height: 220, fontSize: 11, outerRadius: "72%" },
  lg: { height: 300, fontSize: 12, outerRadius: "75%" },
} as const;

/**
 * 五角形レーダーチャート。
 * sm: タイムラインカード内(ラベル省略) / md: レビュー詳細 / lg: 作品ページ・編集プレビュー
 * 色はCSS変数を参照するためダーク/ライト両対応。
 */
export function RadarRatingChart({
  axes,
  size = "md",
}: {
  axes: AxisScore[];
  size?: keyof typeof SIZES;
}) {
  const cfg = SIZES[size];
  const data = axes.map((a) => ({ axis: a.axis, score: a.score }));
  return (
    <div style={{ height: cfg.height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={cfg.outerRadius} cx="50%" cy="50%">
          <PolarGrid stroke="var(--line)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={
              cfg.fontSize
                ? { fill: "var(--muted)", fontSize: cfg.fontSize }
                : false
            }
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.18}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
