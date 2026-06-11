import type { RecordStatus, WorkCategory } from "./types";

/** カテゴリごとの語彙: [したい, している, した, しました(丁寧形)] */
const VERBS: Record<WorkCategory, [string, string, string, string]> = {
  film: ["観たい", "観ている", "観た", "観ました"],
  music: ["聴きたい", "聴いている", "聴いた", "聴きました"],
  literature: ["読みたい", "読んでいる", "読んだ", "読みました"],
  art: ["観たい", "鑑賞している", "観た", "観ました"],
  fashion: ["観たい", "追っている", "観た", "観ました"],
  exhibition: ["行きたい", "巡っている", "行った", "行きました"],
  stage: ["観たい", "通っている", "観た", "観ました"],
  game: ["遊びたい", "遊んでいる", "遊んだ", "遊びました"],
  other: ["体験したい", "体験している", "体験した", "体験しました"],
};

export function statusLabel(category: WorkCategory, status: RecordStatus): string {
  const [want, doing, done] = VERBS[category];
  switch (status) {
    case "want":
      return want;
    case "doing":
      return doing;
    case "done":
      return done;
    case "stacked":
      return "積んでいる";
    case "paused":
      return "中断した";
    case "rewatch":
      return "再鑑賞したい";
  }
}

/** タイムライン用の文。「『花様年華』を観ました」の「を観ました」部分 */
export function statusFeedText(category: WorkCategory, status: RecordStatus): string {
  const [want, doing, , donePolite] = VERBS[category];
  switch (status) {
    case "want":
      return `を「${want}」に追加しました`;
    case "doing":
      return `を${doing.replace(/いる$/, "います")}`;
    case "done":
      return `を${donePolite}`;
    case "stacked":
      return "を積みました";
    case "paused":
      return "を中断しました";
    case "rewatch":
      return "を再鑑賞リストに入れました";
  }
}

export const ALL_STATUSES: RecordStatus[] = [
  "want",
  "doing",
  "done",
  "stacked",
  "paused",
  "rewatch",
];

export const EMOTION_TAGS = [
  "震えた",
  "泣いた",
  "静かに効いた",
  "ざわついた",
  "途方に暮れた",
  "笑った",
  "考え込んだ",
  "眠れなくなった",
  "救われた",
  "苦かった",
];
