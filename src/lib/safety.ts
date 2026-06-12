/**
 * 安全三点セット(設計書v1.1 Phase 6)のうち、コードで完結する2つ。
 * - NGワードフィルタ: findNgWord(純粋関数。モックモードでも効く)
 * - 連投制限: 秒数の定義のみここに置き、判定は actions.ts(DBの created_at を見る)
 * 残る1つの CAPTCHA(Turnstile)は Supabase Auth のダッシュボード設定で行う。
 *
 * これは「荒らしへの最低限の盾」であり完全な防壁ではない。
 * 本格的な対策(DB側での強制・IP制限など)は一般公開後の状況を見て足す。
 */

/**
 * 検出時に投稿を拒否する語(正規化後の部分一致)。
 * 短い語は誤検出するため、明確に攻撃・スパムである語句だけを置く。運用しながら足す。
 */
const NG_WORDS = [
  // 攻撃・脅迫
  "死ね",
  "氏ね",
  "市ね",
  "殺すぞ",
  "殺してやる",
  "ぶっ殺",
  "消えろ",
  // スパム定型
  "出会い系",
  "簡単に稼げる",
  "稼げる副業",
  "今すぐ登録",
  "lineで連絡",
];

/** 表記ゆれの吸収: 全角半角の統一・小文字化・空白除去("死 ね"も拾う) */
function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

/** NGワードを含むか調べる。含むなら最初の一語、含まなければ null */
export function findNgWord(...texts: (string | undefined)[]): string | null {
  for (const text of texts) {
    if (!text) continue;
    const normalized = normalize(text);
    for (const word of NG_WORDS) {
      if (normalized.includes(normalize(word))) return word;
    }
  }
  return null;
}

export const NG_WORD_ERROR =
  "不適切な表現が含まれているため投稿できません。表現を変えてお試しください";

/** 連投制限: 同一ユーザーが同種の投稿を続けるのに必要な間隔(秒) */
export const RATE_LIMIT_SECONDS = {
  posts: 30,
  comments: 15,
  reviews: 60,
  articles: 60,
  threads: 120,
  thread_replies: 20,
} as const;

export type RateLimitedTable = keyof typeof RATE_LIMIT_SECONDS;

export function rateLimitError(waitSeconds: number): string {
  return `投稿の間隔が短すぎます。あと${waitSeconds}秒ほど待ってからお試しください`;
}
