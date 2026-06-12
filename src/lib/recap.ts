/**
 * 月間総括(Wrapped型カード)の集計。
 * DBアクセスは行わない純粋関数 — getRecords()/getWorks() の結果から導出する。
 * 年間総括(Phase 7)も同じ形で月→年に広げて再利用する想定。
 */
import type { RecordEntry, Work, WorkCategory } from "./types";
import { CATEGORY_LABELS } from "./types";

export interface RecapWork {
  title: string;
  creator: string;
  category: WorkCategory;
  rating?: number;
}

export interface RecapCategory {
  category: WorkCategory;
  label: string;
  count: number;
}

export interface MonthlyRecap {
  year: number;
  month: number; // 1-12
  totalMinutes: number;
  totalPages: number;
  sessionCount: number;
  /** その月に「完了」した作品(重複なし・星の高い順) */
  doneWorks: RecapWork[];
  /** 記録数の多いカテゴリ順 */
  categories: RecapCategory[];
  /** その月に最も多く記された感情タグ */
  topEmotion?: string;
}

/** 記録のある最新の月を返す(記録が無ければ今月) */
export function latestRecordMonth(records: RecordEntry[]): { year: number; month: number } {
  const latest =
    records.map((r) => new Date(r.date)).sort((a, b) => +b - +a)[0] ?? new Date();
  return { year: latest.getFullYear(), month: latest.getMonth() + 1 };
}

export function buildMonthlyRecap(
  records: RecordEntry[],
  works: Work[],
  year: number,
  month: number,
): MonthlyRecap {
  const workMap = new Map(works.map((w) => [w.id, w]));
  const monthly = records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const totalMinutes = monthly.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
  const totalPages = monthly.reduce((s, r) => s + (r.pages ?? 0), 0);

  // 完了した作品(同じ作品の再鑑賞は1つに)
  const doneMap = new Map<string, RecapWork>();
  for (const r of monthly) {
    if (r.status !== "done") continue;
    const work = workMap.get(r.workId);
    if (!work || doneMap.has(work.id)) continue;
    doneMap.set(work.id, {
      title: work.title,
      creator: work.creator,
      category: work.category,
      rating: r.rating,
    });
  }
  const doneWorks = [...doneMap.values()].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  );

  // カテゴリ別の記録数
  const byCategory = new Map<WorkCategory, number>();
  for (const r of monthly) {
    const c = workMap.get(r.workId)?.category;
    if (c) byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
  }
  const categories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, label: CATEGORY_LABELS[category], count }));

  // 感情タグの最頻値
  const emotionCounts = new Map<string, number>();
  for (const r of monthly)
    for (const e of r.emotionTags) emotionCounts.set(e, (emotionCounts.get(e) ?? 0) + 1);
  const topEmotion = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    year,
    month,
    totalMinutes,
    totalPages,
    sessionCount: monthly.length,
    doneWorks,
    categories,
    topEmotion,
  };
}
