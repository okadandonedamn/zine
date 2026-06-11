import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { CATEGORY_COLORS, type RecordEntry, type Work } from "@/lib/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * 月間鑑賞カレンダー。
 * 活動のあった日にカテゴリ色のドットを置く。数字とドットだけの静かな設計。
 */
export function RecordCalendar({
  records,
  workOf,
  month,
}: {
  records: RecordEntry[];
  workOf: (workId: string) => Work | undefined;
  month: Date;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = getDay(days[0]); // 月初の曜日ぶん空ける

  const byDay = new Map<string, RecordEntry[]>();
  for (const r of records) {
    const key = format(new Date(r.date), "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }

  return (
    <div>
      <p className="font-display text-lg font-semibold">{format(month, "yyyy年M月")}</p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-subtle">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayRecords = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-line/60 text-xs"
            >
              <span className={dayRecords.length > 0 ? "font-semibold" : "text-subtle"}>
                {format(day, "d")}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {dayRecords.slice(0, 4).map((r) => {
                  const w = workOf(r.workId);
                  return (
                    <span
                      key={r.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: w ? CATEGORY_COLORS[w.category] : "var(--subtle)" }}
                    />
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
