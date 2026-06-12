/**
 * 映画シードスクリプト(TMDB API)
 *
 * ローカルから手動で実行する「儀式」。アプリのデプロイには含めない。
 *   1. scripts/.env.example を scripts/.env にコピーして値を入れる
 *   2. npm run seed:tmdb
 *
 * TMDB帰属表示の義務: サイトのフッターまたはaboutに
 * "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * を掲示すること。
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_TOKEN = process.env.TMDB_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_KEY || !TMDB_TOKEN) {
  console.error("scripts/.env に SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / TMDB_API_TOKEN を設定してください");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PAGES = 50; // 1ページ20件 × 50 = 約1,000件

interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string;
}

async function fetchPage(page: number): Promise<TmdbMovie[]> {
  const url = `https://api.themoviedb.org/3/movie/top_rated?language=ja-JP&page=${page}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { results: TmdbMovie[] };
  return json.results;
}

async function main() {
  let inserted = 0;
  for (let page = 1; page <= PAGES; page++) {
    const movies = await fetchPage(page);
    const rows = movies
      .filter((m) => m.title)
      .map((m) => ({
        title: m.title,
        category: "film",
        creator: "", // 監督名はdetailエンドポイントが必要なため空。後から補完可能
        year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
        description: m.overview ?? "",
        cover_url: m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : null,
        external_ids: { tmdb: m.id },
      }));

    // external_ids->tmdb で重複チェックしてから挿入
    for (const row of rows) {
      const { data: existing } = await supabase
        .from("works")
        .select("id")
        .eq("external_ids->>tmdb", String(row.external_ids.tmdb))
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabase.from("works").insert(row);
      if (error) {
        console.error(`  NG: ${row.title} — ${error.message}`);
      } else {
        inserted++;
      }
    }
    console.log(`page ${page}/${PAGES} 完了(累計 ${inserted}件挿入)`);
    await new Promise((r) => setTimeout(r, 300)); // レート制限への礼儀
  }
  console.log(`完了: ${inserted}件の映画を投入しました`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
