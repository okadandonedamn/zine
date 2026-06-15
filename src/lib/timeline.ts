/**
 * Timeline primitives shared by server data fetchers and UI controls.
 *
 * Feed answers "which timeline?", while content types answer "which ZINE
 * feature should be visible inside that timeline?"
 */

export type TimelineFeed = "following" | "latest" | "recommended";

export type TimelineContentType = "post" | "article" | "review" | "record" | "thread";

export const TIMELINE_FEEDS: { key: TimelineFeed; label: string }[] = [
  { key: "following", label: "フォロー中" },
  { key: "latest", label: "最新" },
  { key: "recommended", label: "おすすめ" },
];

export const TIMELINE_CONTENT_TYPES: {
  key: TimelineContentType;
  label: string;
  shortLabel: string;
}[] = [
  { key: "post", label: "短文投稿", shortLabel: "短文" },
  { key: "article", label: "長文記事", shortLabel: "記事" },
  { key: "review", label: "レビュー", shortLabel: "レビュー" },
  { key: "record", label: "鑑賞記録", shortLabel: "記録" },
  { key: "thread", label: "語り場", shortLabel: "語り場" },
];

export const DEFAULT_TIMELINE_TYPES: TimelineContentType[] = TIMELINE_CONTENT_TYPES.map(
  (type) => type.key,
);

const FEED_KEYS = new Set(TIMELINE_FEEDS.map((feed) => feed.key));
const CONTENT_TYPE_KEYS = new Set(TIMELINE_CONTENT_TYPES.map((type) => type.key));

export function normalizeTimelineFeed(value?: string | null): TimelineFeed {
  if (value === "foryou") return "recommended";
  if (value && FEED_KEYS.has(value as TimelineFeed)) return value as TimelineFeed;
  return "recommended";
}

export function parseTimelineTypes(value?: string | null): TimelineContentType[] {
  if (value == null) return DEFAULT_TIMELINE_TYPES;
  if (value.trim() === "") return [];
  const selected = value
    .split(",")
    .map((type) => type.trim())
    .filter((type): type is TimelineContentType =>
      CONTENT_TYPE_KEYS.has(type as TimelineContentType),
    );
  const unique = [...new Set(selected)];
  return TIMELINE_CONTENT_TYPES.map((type) => type.key).filter((type) =>
    unique.includes(type),
  );
}

export function serializeTimelineTypes(types: TimelineContentType[]): string {
  return TIMELINE_CONTENT_TYPES.map((type) => type.key)
    .filter((type) => types.includes(type))
    .join(",");
}

export function areDefaultTimelineTypes(types: TimelineContentType[]): boolean {
  return (
    types.length === DEFAULT_TIMELINE_TYPES.length &&
    DEFAULT_TIMELINE_TYPES.every((type) => types.includes(type))
  );
}
