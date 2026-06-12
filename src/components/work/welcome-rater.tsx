"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rateWork } from "@/lib/actions";
import { CATEGORY_LABELS, type Work } from "@/lib/types";
import { cn } from "@/lib/utils";

const GOAL = 10;

/**
 * オンボーディング: 観たことのある作品に星をつける。
 * 本棚(records)が初日から生きた状態になる。
 */
export function WelcomeRater({ works }: { works: Work[] }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const ratedCount = Object.keys(ratings).length;

  async function rate(workId: string, value: number) {
    setError(null);
    const prev = ratings[workId];
    setRatings((r) => ({ ...r, [workId]: value }));
    const result = await rateWork(workId, value);
    if (!result.ok) {
      setRatings((r) => {
        const next = { ...r };
        if (prev === undefined) delete next[workId];
        else next[workId] = prev;
        return next;
      });
      setError(result.error);
    }
  }

  return (
    <div>
      {/* 進捗 */}
      <div className="sticky top-12 z-20 -mx-4 border-b border-line bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:top-0">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            <span className="font-display text-xl text-accent">{ratedCount}</span>
            <span className="text-subtle"> / {GOAL}作品</span>
          </p>
          {ratedCount >= GOAL ? (
            <Link href="/home">
              <Button>タイムラインへ →</Button>
            </Link>
          ) : (
            <Link href="/home" className="text-xs text-subtle hover:text-foreground">
              あとで(スキップ)
            </Link>
          )}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, (ratedCount / GOAL) * 100)}%` }}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-accent">{error}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {works.map((w) => {
          const current = ratings[w.id] ?? 0;
          return (
            <div
              key={w.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                current > 0 ? "border-accent/50 bg-accent/5" : "border-line bg-surface",
              )}
            >
              <span
                className="h-16 w-11 shrink-0 rounded-sm"
                style={{
                  background: `linear-gradient(160deg, ${w.coverFrom}, ${w.coverTo})`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold">{w.title}</p>
                <p className="truncate text-xs text-subtle">
                  {CATEGORY_LABELS[w.category]} / {w.creator}
                </p>
                <div className="mt-1.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-label={`星${v}`}
                      onClick={() => rate(w.id, v)}
                      className="cursor-pointer p-0.5"
                    >
                      <Star
                        size={18}
                        className={v <= current ? "text-accent" : "text-line"}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
