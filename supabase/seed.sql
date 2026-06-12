-- =============================================================
-- ZINE 初期データ (schema.sql の後に実行)
-- 最初の作品たちと評価軸テンプレート。
-- 本格的な作品シードは scripts/seed-tmdb.ts / seed-openbd.ts で行う。
-- =============================================================

insert into works (title, category, creator, year, description) values
  ('花様年華', 'film', 'ウォン・カーウァイ', 2000, '1962年の香港。隣同士に越してきた男女が、互いの配偶者の不貞を知る。すれ違いと抑制の果てに残る、語られなかった恋の記録。'),
  ('ノルウェイの森', 'literature', '村上春樹', 1987, '「死は生の対極としてではなく、その一部として存在している」。喪失と再生をめぐる、永遠の青春小説。'),
  ('犬王', 'film', '湯浅政明', 2022, '室町の世、異形の能楽師・犬王と盲目の琵琶法師・友魚。歴史から消された者たちの声が、ロックオペラとして蘇る。'),
  ('LONG SEASON', 'music', 'フィッシュマンズ', 1996, '35分1曲。反復と浮遊の果てに季節が巡る、日本のロック史に屹立する長編。深夜に聴くための音楽。'),
  ('ゲルハルト・リヒター展', 'exhibition', '東京国立近代美術館', 2022, 'フォト・ペインティングからアブストラクト・ペインティング、そして「ビルケナウ」へ。見ることの不可能性を見にいく展覧会。'),
  ('百年の孤独', 'literature', 'ガブリエル・ガルシア=マルケス', 1967, '蜃気楼の村マコンドとブエンディア一族、百年の物語。魔術的リアリズムの金字塔。'),
  ('OK Computer', 'music', 'Radiohead', 1997, 'テクノロジーと疎外、来るべき世紀への予感。97年に鳴らされた、いまだ古びない警鐘。'),
  ('Yohji Yamamoto 2024-25AW', 'fashion', 'Yohji Yamamoto', 2024, '黒、ドレープ、非対称。「完璧は醜い」という思想の最新形。パリで発表されたコレクション。'),
  ('ELDEN RING', 'game', 'FromSoftware', 2022, '狭間の地を巡る褪せ人の旅。断片化された神話と、広大な孤独。死にながら読む物語。'),
  ('桜の園', 'stage', 'アントン・チェーホフ / 新国立劇場', 2026, '失われゆく屋敷と桜の園。時代の変わり目に立ち尽くす人々の喜劇、あるいは悲劇。');

-- システム提供の評価軸テンプレート (owner_id = null)
with t as (
  insert into review_axis_templates (owner_id, name, category) values
    (null, '映画の基本軸', 'film'),
    (null, '音楽の基本軸', 'music'),
    (null, '文学の基本軸', 'literature'),
    (null, 'ファッションの基本軸', 'fashion'),
    (null, '美術の基本軸', 'art'),
    (null, '展示の基本軸', 'exhibition'),
    (null, '舞台の基本軸', 'stage'),
    (null, 'ゲームの基本軸', 'game'),
    (null, '汎用軸', 'other')
  returning id, category
)
insert into review_axis_template_items (template_id, axis_name, display_order)
select t.id, axis.name, axis.ord
from t
join lateral (
  select * from unnest(
    case t.category
      when 'film' then array['映像','脚本','演技','音楽','余韻']
      when 'music' then array['メロディ','歌詞','音像','革新性','中毒性']
      when 'literature' then array['文体','構成','思想','人物','余白']
      when 'fashion' then array['造形','素材','色彩','着用性','批評性']
      when 'art' then array['着想','技法','構図','強度','余韻']
      when 'exhibition' then array['企画','空間','作品','解説','余韻']
      when 'stage' then array['演出','戯曲','演技','美術','熱量']
      when 'game' then array['物語','操作','映像','音楽','没入']
      else array['着想','構成','表現','完成度','余韻']
    end
  ) with ordinality as u(name, ord)
) axis on true;
