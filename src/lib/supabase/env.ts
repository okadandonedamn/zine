/**
 * Supabaseの環境変数が設定されているかどうか。
 * false のときアプリ全体がモックデータで動く(lib/data.ts が自動フォールバック)。
 */
export const supabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
