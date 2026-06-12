/**
 * 書籍シードスクリプト(openBD API・キー不要)
 *
 * ローカルから手動で実行する「儀式」。アプリのデプロイには含めない。
 *   1. scripts/.env.example を scripts/.env にコピーして値を入れる
 *   2. scripts/isbn-list.txt にISBN(13桁)を1行1つで並べる
 *   3. npm run seed:openbd
 *
 * ISBNリストの作り方: 文庫の定番(新潮文庫の100冊、岩波文庫の名作など)を
 * 手で集めるのが確実。書影の利用条件は openBD の規約を確認すること。
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";

config({ path: path.join(import.meta.dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("scripts/.env に SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface OpenBdItem {
  summary?: {
    isbn: string;
    title: string;
    author?: string;
    pubdate?: string;
    cover?: string;
  };
}

async function main() {
  const listPath = path.join(import.meta.dirname, "isbn-list.txt");
  let isbns: string[];
  try {
    isbns = readFileSync(listPath, "utf-8")
      .split(/\r?\n/)
      .map((l) => l.trim().replaceAll("-", ""))
      .filter((l) => /^97[89]\d{10}$/.test(l));
  } catch {
    console.error(`scripts/isbn-list.txt が見つかりません。ISBN(13桁)を1行1つで並べてください`);
    process.exit(1);
  }
  console.log(`${isbns.length}件のISBNを処理します`);

  let inserted = 0;
  // openBDは最大10,000件まで一括取得できるが、礼儀として1,000件ずつ
  for (let i = 0; i < isbns.length; i += 1000) {
    const chunk = isbns.slice(i, i + 1000);
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${chunk.join(",")}`);
    if (!res.ok) throw new Error(`openBD ${res.status}`);
    const items = (await res.json()) as (OpenBdItem | null)[];

    for (const item of items) {
      const s = item?.summary;
      if (!s?.title) continue;
      const { data: existing } = await supabase
        .from("works")
        .select("id")
        .eq("external_ids->>isbn", s.isbn)
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabase.from("works").insert({
        title: s.title,
        category: "literature",
        creator: (s.author ?? "").replace(/／.*$/, ""), // 「著／訳」表記の前半だけ
        year: s.pubdate ? Number(s.pubdate.slice(0, 4)) : null,
        description: "",
        cover_url: s.cover || null,
        external_ids: { isbn: s.isbn },
      });
      if (error) {
        console.error(`  NG: ${s.title} — ${error.message}`);
      } else {
        inserted++;
      }
    }
  }
  console.log(`完了: ${inserted}件の書籍を投入しました`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
