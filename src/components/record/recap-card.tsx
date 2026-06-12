"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/types";
import type { MonthlyRecap } from "@/lib/recap";

/** 書き出し画像のサイズ(縦長の一枚絵) */
const W = 1080;
const H = 1350;

/**
 * 月間総括カード(Phase 4)。
 * 画面にはDOMでプレビューを出し、「画像として保存」でcanvasに
 * 同じ内容を描画してPNGをダウンロードする。
 * 色とフォントは実行時にデザイントークン(CSS変数)から読む — hex直書きをしない。
 */
export function RecapCard({
  recap,
  username,
}: {
  recap: MonthlyRecap;
  username: string;
}) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [saving, setSaving] = useState(false);

  const stats = [
    { label: "鑑賞時間", value: formatMinutes(recap.totalMinutes) },
    { label: "完了した作品", value: `${recap.doneWorks.length}作品` },
    { label: "読んだページ", value: `${recap.totalPages}p` },
    { label: "記録回数", value: `${recap.sessionCount}回` },
  ];
  const categories = recap.categories.slice(0, 3);
  const catMax = categories[0]?.count ?? 1;
  const works = recap.doneWorks.slice(0, 3);

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

      drawRecap(ctx, recap, {
        username,
        display: displayRef.current
          ? getComputedStyle(displayRef.current).fontFamily
          : "sans-serif",
        sans: bodyRef.current
          ? getComputedStyle(bodyRef.current).fontFamily
          : "sans-serif",
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
        a.download = `zine-recap-${recap.year}-${String(recap.month).padStart(2, "0")}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* プレビュー(書き出し画像と同じ構成) */}
      <div className="mx-auto w-full max-w-sm border border-line bg-background p-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span ref={displayRef} className="font-display text-lg font-bold tracking-widest">
            ZINE
          </span>
          <span className="text-[9px] tracking-[0.3em] text-subtle">MONTHLY RECAP</span>
        </div>

        <p className="mt-6 font-display text-3xl font-bold">
          {recap.year}年{recap.month}月
        </p>
        <p ref={bodyRef} className="mt-1 text-xs text-muted">
          @{username} の月間総括
        </p>

        <div className="mt-6 grid grid-cols-2 gap-y-5">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-semibold">{s.value}</p>
              <p className="mt-0.5 text-[10px] tracking-wider text-subtle">{s.label}</p>
            </div>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[10px] tracking-[0.2em] text-subtle">カテゴリ別の記録</p>
            <div className="mt-3 space-y-2">
              {categories.map((c) => (
                <div key={c.category} className="flex items-center gap-2 text-xs">
                  <span className="w-12 shrink-0 text-muted">{c.label}</span>
                  <span className="h-1.5 flex-1 bg-surface-2">
                    <span
                      className="block h-full"
                      style={{
                        width: `${(c.count / catMax) * 100}%`,
                        background: CATEGORY_COLORS[c.category],
                      }}
                    />
                  </span>
                  <span className="w-6 text-right font-display">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {works.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[10px] tracking-[0.2em] text-subtle">今月の収穫</p>
            <ul className="mt-3 space-y-2">
              {works.map((w) => (
                <li key={w.title} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-display font-semibold">{w.title}</span>
                    <span className="ml-2 text-xs text-subtle">{w.creator}</span>
                  </span>
                  {w.rating != null && (
                    <span className="shrink-0 text-xs text-accent">★ {w.rating}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recap.topEmotion && (
          <p className="mt-5 text-xs text-muted">
            今月いちばんの感情 <span className="text-accent">「{recap.topEmotion}」</span>
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-3 text-[9px] tracking-widest text-subtle">
          <span>@{username}</span>
          <span>ZINE — CULTURE TIMELINE</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          <Download size={15} />
          {saving ? "書き出し中…" : "画像として保存"}
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

function drawRecap(ctx: CanvasRenderingContext2D, recap: MonthlyRecap, o: DrawOptions) {
  const M = 84; // 外周余白
  const innerW = W - M * 2;

  const hairline = (y: number) => {
    ctx.fillStyle = o.line;
    ctx.fillRect(M, y, innerW, 2);
  };
  const truncate = (text: string, maxWidth: number) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
    return t + "…";
  };

  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, W, H);

  // ヘッダー
  ctx.fillStyle = o.fg;
  ctx.font = `700 44px ${o.display}`;
  ctx.fillText("ZINE", M, 124);
  ctx.fillStyle = o.subtle;
  ctx.font = `400 22px ${o.sans}`;
  ctx.textAlign = "right";
  ctx.fillText("M O N T H L Y  R E C A P", W - M, 120);
  ctx.textAlign = "left";
  hairline(156);

  // 月
  ctx.fillStyle = o.fg;
  ctx.font = `700 88px ${o.display}`;
  ctx.fillText(`${recap.year}年${recap.month}月`, M, 300);
  ctx.fillStyle = o.muted;
  ctx.font = `400 26px ${o.sans}`;
  ctx.fillText(`@${o.username} の月間総括`, M, 348);

  // 統計 2x2
  const stats = [
    { label: "鑑賞時間", value: formatMinutes(recap.totalMinutes) },
    { label: "完了した作品", value: `${recap.doneWorks.length}作品` },
    { label: "読んだページ", value: `${recap.totalPages}p` },
    { label: "記録回数", value: `${recap.sessionCount}回` },
  ];
  stats.forEach((s, i) => {
    const x = M + (i % 2) * (innerW / 2);
    const y = 470 + Math.floor(i / 2) * 140;
    ctx.fillStyle = o.fg;
    ctx.font = `600 60px ${o.display}`;
    ctx.fillText(s.value, x, y);
    ctx.fillStyle = o.subtle;
    ctx.font = `400 24px ${o.sans}`;
    ctx.fillText(s.label, x, y + 40);
  });

  let y = 720;
  hairline(y);
  y += 56;

  // カテゴリ別バー
  const categories = recap.categories.slice(0, 3);
  if (categories.length > 0) {
    ctx.fillStyle = o.subtle;
    ctx.font = `400 24px ${o.sans}`;
    ctx.fillText("カテゴリ別の記録", M, y);
    y += 44;
    const max = categories[0].count;
    const barX = M + 150;
    const barW = innerW - 150 - 80;
    for (const c of categories) {
      ctx.fillStyle = o.muted;
      ctx.font = `400 26px ${o.sans}`;
      ctx.fillText(c.label, M, y);
      ctx.fillStyle = o.line;
      ctx.fillRect(barX, y - 18, barW, 12);
      ctx.fillStyle = CATEGORY_COLORS[c.category];
      ctx.fillRect(barX, y - 18, (c.count / max) * barW, 12);
      ctx.fillStyle = o.fg;
      ctx.font = `600 26px ${o.display}`;
      ctx.textAlign = "right";
      ctx.fillText(String(c.count), W - M, y);
      ctx.textAlign = "left";
      y += 52;
    }
    y += 12;
  }

  hairline(y);
  y += 56;

  // 今月の収穫
  const works = recap.doneWorks.slice(0, 3);
  if (works.length > 0) {
    ctx.fillStyle = o.subtle;
    ctx.font = `400 24px ${o.sans}`;
    ctx.fillText("今月の収穫", M, y);
    y += 48;
    for (const w of works) {
      ctx.fillStyle = o.fg;
      ctx.font = `600 32px ${o.display}`;
      const title = truncate(w.title, innerW - 320);
      ctx.fillText(title, M, y);
      const titleW = ctx.measureText(title).width;
      ctx.fillStyle = o.subtle;
      ctx.font = `400 24px ${o.sans}`;
      ctx.fillText(truncate(w.creator, 280 - 20), M + titleW + 20, y);
      if (w.rating != null) {
        ctx.fillStyle = o.accent;
        ctx.font = `600 26px ${o.sans}`;
        ctx.textAlign = "right";
        ctx.fillText(`★ ${w.rating}`, W - M, y);
        ctx.textAlign = "left";
      }
      y += 56;
    }
  }

  if (recap.topEmotion) {
    y += 8;
    ctx.fillStyle = o.muted;
    ctx.font = `400 26px ${o.sans}`;
    ctx.fillText("今月いちばんの感情", M, y);
    ctx.fillStyle = o.accent;
    ctx.font = `600 26px ${o.sans}`;
    ctx.fillText(`「${recap.topEmotion}」`, M + 250, y);
  }

  // フッター
  hairline(H - 96);
  ctx.fillStyle = o.subtle;
  ctx.font = `400 22px ${o.sans}`;
  ctx.fillText(`@${o.username}`, M, H - 48);
  ctx.textAlign = "right";
  ctx.fillText("Z I N E — C U L T U R E  T I M E L I N E", W - M, H - 48);
  ctx.textAlign = "left";
}
