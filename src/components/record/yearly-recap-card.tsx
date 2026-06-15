"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YearlyRecap } from "@/lib/recap";
import { CATEGORY_COLORS } from "@/lib/types";
import { formatMinutes } from "@/lib/utils";

const W = 1080;
const H = 1350;

export function YearlyRecapCard({
  recap,
  username,
}: {
  recap: YearlyRecap;
  username: string;
}) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [saving, setSaving] = useState(false);

  const topMonth = [...recap.months].sort((a, b) => b.sessionCount - a.sessionCount)[0];
  const stats = [
    { label: "鑑賞時間", value: formatMinutes(recap.totalMinutes) },
    { label: "記録回数", value: `${recap.sessionCount}回` },
    { label: "完了した作品", value: `${recap.doneWorks.length}作品` },
    { label: "読んだページ", value: `${recap.totalPages}p` },
  ];

  async function handleSave() {
    setSaving(true);
    try {
      await document.fonts.ready;
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => style.getPropertyValue(name).trim();
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawYearlyRecap(ctx, recap, {
        username,
        display: displayRef.current
          ? getComputedStyle(displayRef.current).fontFamily
          : "sans-serif",
        sans: bodyRef.current ? getComputedStyle(bodyRef.current).fontFamily : "sans-serif",
        bg: color("--background"),
        fg: color("--foreground"),
        muted: color("--muted"),
        subtle: color("--subtle"),
        line: color("--line"),
        accent: color("--accent"),
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zine-yearly-recap-${recap.year}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-md border border-line bg-background p-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span ref={displayRef} className="font-display text-lg font-bold tracking-widest">
            ZINE
          </span>
          <span className="text-[9px] tracking-[0.3em] text-subtle">YEARLY RECAP</span>
        </div>

        <p className="mt-6 font-display text-4xl font-bold">{recap.year}</p>
        <p ref={bodyRef} className="mt-1 text-xs text-muted">
          @{username} の年間総括
        </p>

        <div className="mt-6 grid grid-cols-2 gap-y-5">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-semibold">{stat.value}</p>
              <p className="mt-0.5 text-[10px] tracking-wider text-subtle">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <p className="text-[10px] tracking-[0.2em] text-subtle">月別の記録</p>
          <div className="mt-3 grid grid-cols-12 items-end gap-1">
            {recap.months.map((month) => {
              const max = Math.max(...recap.months.map((m) => m.sessionCount), 1);
              return (
                <div key={month.month} className="flex min-w-0 flex-col items-center gap-1">
                  <span
                    className="w-full bg-accent"
                    style={{ height: `${Math.max(6, (month.sessionCount / max) * 64)}px` }}
                  />
                  <span className="text-[9px] text-subtle">{month.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {recap.categories.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[10px] tracking-[0.2em] text-subtle">よく記録したカテゴリ</p>
            <div className="mt-3 space-y-2">
              {recap.categories.slice(0, 3).map((category) => (
                <div key={category.category} className="flex items-center gap-2 text-xs">
                  <span className="w-12 shrink-0 text-muted">{category.label}</span>
                  <span className="h-1.5 flex-1 bg-surface-2">
                    <span
                      className="block h-full"
                      style={{
                        width: `${(category.count / recap.categories[0].count) * 100}%`,
                        background: CATEGORY_COLORS[category.category],
                      }}
                    />
                  </span>
                  <span className="w-6 text-right font-display">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-4 text-xs text-muted">
          <p>
            いちばん記録した月:{" "}
            <span className="text-accent">
              {topMonth.label} / {topMonth.sessionCount}回
            </span>
          </p>
          {recap.topEmotion && (
            <p className="mt-2">
              今年の感情: <span className="text-accent">「{recap.topEmotion}」</span>
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-3 text-[9px] tracking-widest text-subtle">
          <span>@{username}</span>
          <span>ZINE / CULTURE TIMELINE</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          <Download size={15} />
          {saving ? "書き出し中..." : "画像として保存"}
        </Button>
      </div>
    </div>
  );
}

interface DrawOptions {
  username: string;
  display: string;
  sans: string;
  bg: string;
  fg: string;
  muted: string;
  subtle: string;
  line: string;
  accent: string;
}

function drawYearlyRecap(ctx: CanvasRenderingContext2D, recap: YearlyRecap, o: DrawOptions) {
  const margin = 84;
  const innerW = W - margin * 2;
  const hairline = (y: number) => {
    ctx.fillStyle = o.line;
    ctx.fillRect(margin, y, innerW, 2);
  };

  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = o.fg;
  ctx.font = `700 44px ${o.display}`;
  ctx.fillText("ZINE", margin, 124);
  ctx.fillStyle = o.subtle;
  ctx.font = `400 22px ${o.sans}`;
  ctx.textAlign = "right";
  ctx.fillText("Y E A R L Y  R E C A P", W - margin, 120);
  ctx.textAlign = "left";
  hairline(156);

  ctx.fillStyle = o.fg;
  ctx.font = `700 104px ${o.display}`;
  ctx.fillText(String(recap.year), margin, 300);
  ctx.fillStyle = o.muted;
  ctx.font = `400 28px ${o.sans}`;
  ctx.fillText(`@${o.username} の年間総括`, margin, 350);

  const stats = [
    { label: "鑑賞時間", value: formatMinutes(recap.totalMinutes) },
    { label: "記録回数", value: `${recap.sessionCount}回` },
    { label: "完了した作品", value: `${recap.doneWorks.length}作品` },
    { label: "読んだページ", value: `${recap.totalPages}p` },
  ];
  stats.forEach((stat, index) => {
    const x = margin + (index % 2) * (innerW / 2);
    const y = 470 + Math.floor(index / 2) * 140;
    ctx.fillStyle = o.fg;
    ctx.font = `600 60px ${o.display}`;
    ctx.fillText(stat.value, x, y);
    ctx.fillStyle = o.subtle;
    ctx.font = `400 24px ${o.sans}`;
    ctx.fillText(stat.label, x, y + 40);
  });

  let y = 720;
  hairline(y);
  y += 58;
  ctx.fillStyle = o.subtle;
  ctx.font = `400 24px ${o.sans}`;
  ctx.fillText("月別の記録", margin, y);
  y += 42;

  const maxMonth = Math.max(...recap.months.map((m) => m.sessionCount), 1);
  const gap = 12;
  const barW = (innerW - gap * 11) / 12;
  for (const month of recap.months) {
    const h = Math.max(10, (month.sessionCount / maxMonth) * 150);
    const x = margin + (month.month - 1) * (barW + gap);
    ctx.fillStyle = o.accent;
    ctx.fillRect(x, y + 160 - h, barW, h);
    ctx.fillStyle = o.subtle;
    ctx.font = `400 18px ${o.sans}`;
    ctx.textAlign = "center";
    ctx.fillText(String(month.month), x + barW / 2, y + 190);
  }
  ctx.textAlign = "left";

  y += 250;
  hairline(y);
  y += 58;
  const topCategories = recap.categories.slice(0, 3);
  if (topCategories.length > 0) {
    ctx.fillStyle = o.subtle;
    ctx.font = `400 24px ${o.sans}`;
    ctx.fillText("よく記録したカテゴリ", margin, y);
    y += 44;
    const maxCategory = topCategories[0].count;
    for (const category of topCategories) {
      ctx.fillStyle = o.muted;
      ctx.font = `400 26px ${o.sans}`;
      ctx.fillText(category.label, margin, y);
      ctx.fillStyle = o.line;
      ctx.fillRect(margin + 150, y - 18, innerW - 240, 12);
      ctx.fillStyle = CATEGORY_COLORS[category.category];
      ctx.fillRect(margin + 150, y - 18, ((innerW - 240) * category.count) / maxCategory, 12);
      ctx.fillStyle = o.fg;
      ctx.font = `600 26px ${o.display}`;
      ctx.textAlign = "right";
      ctx.fillText(String(category.count), W - margin, y);
      ctx.textAlign = "left";
      y += 52;
    }
  }

  if (recap.topEmotion) {
    y += 22;
    ctx.fillStyle = o.muted;
    ctx.font = `400 26px ${o.sans}`;
    ctx.fillText("今年の感情", margin, y);
    ctx.fillStyle = o.accent;
    ctx.font = `600 26px ${o.sans}`;
    ctx.fillText(`「${recap.topEmotion}」`, margin + 170, y);
  }

  hairline(H - 96);
  ctx.fillStyle = o.subtle;
  ctx.font = `400 22px ${o.sans}`;
  ctx.fillText(`@${o.username}`, margin, H - 48);
  ctx.textAlign = "right";
  ctx.fillText("Z I N E / C U L T U R E  T I M E L I N E", W - margin, H - 48);
  ctx.textAlign = "left";
}
