/**
 * タイムラインのタブ定義。
 * クライアント(タブUI)とサーバー(データ取得)の両方から使うため、
 * サーバー専用コードを含む data.ts から分離している。
 */
export type TimelineTab =
  | "foryou"
  | "following"
  | "latest"
  | "reviews"
  | "records"
  | "discussions"
  | "articles";

export const TIMELINE_TABS: { key: TimelineTab; label: string }[] = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "latest", label: "Latest" },
  { key: "reviews", label: "Reviews" },
  { key: "records", label: "Records" },
  { key: "discussions", label: "Discussions" },
  { key: "articles", label: "Articles" },
];
