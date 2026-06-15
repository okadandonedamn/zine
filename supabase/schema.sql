-- =============================================================
-- ZINE データベーススキーマ (Supabase / Postgres) — 設計書v1.1準拠
-- 新規プロジェクトはこのファイルを SQL Editor で実行する。
-- v1.1以前のスキーマを適用済みの場合は migration-002-v1_1.sql を使う。
--
-- 設計判断(docs/DESIGN.md §0):
--  - 星評価は records(本棚)が唯一の真実。reviews は rating を持たない
--  - posts/comments/threads/thread_replies は deleted_at による論理削除
--  - 語り場(threads)は必ず作品に従属する(boardsは存在しない)
--  - フォローは 人/作品/タグ の多態
--  - 通知は Server Action が生成(トリガー禁止)。feed_items供給と採番関数のみ例外
-- =============================================================

create extension if not exists pg_trgm;

-- ---------- ユーザー ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null,
  bio text default '',
  website text,
  avatar_url text,
  header_url text,
  role text not null default 'user' check (role in ('user','moderator','admin')),
  created_at timestamptz not null default now()
);

-- moderator判定ヘルパー。各RLSポリシーから呼ぶ
create or replace function is_moderator() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('moderator','admin')
  );
$$;

create table user_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  default_record_visibility text not null default 'public' check (default_record_visibility in ('public','private')),
  share_goal_achievements boolean not null default true,
  collapse_spoilers boolean not null default true,
  theme text not null default 'dark'
);

-- フォロー: 人 / 作品 / タグ の三態(必ず一つだけ非NULL)
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_user_id uuid references profiles(id) on delete cascade,
  work_id uuid, -- FKは works 定義後に付与
  tag_id uuid,  -- FKは tags 定義後に付与
  created_at timestamptz not null default now(),
  check (num_nonnulls(followee_user_id, work_id, tag_id) = 1),
  check (follower_id <> followee_user_id)
);
create unique index follows_user_uniq on follows (follower_id, followee_user_id) where followee_user_id is not null;
create unique index follows_work_uniq on follows (follower_id, work_id) where work_id is not null;
create unique index follows_tag_uniq on follows (follower_id, tag_id) where tag_id is not null;

-- ---------- 作品 ----------
create table works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_kana text,
  category text not null check (category in ('film','music','literature','art','fashion','exhibition','stage','game','other')),
  creator text not null default '',
  year int,
  description text default '',
  cover_url text,
  external_ids jsonb, -- 例 {"tmdb":603,"isbn":"978..."}
  created_by uuid references profiles(id), -- シード由来はNULL
  merged_into_id uuid references works(id), -- 重複統合。非NULLなら統合先へ誘導
  created_at timestamptz not null default now()
);
create index works_title_trgm on works using gin (title gin_trgm_ops);
create index works_title_kana_trgm on works using gin (title_kana gin_trgm_ops);
create index works_creator_trgm on works using gin (creator gin_trgm_ops);

alter table follows add constraint follows_work_fk foreign key (work_id) references works(id) on delete cascade;

create table work_images (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  url text not null,
  display_order int not null default 0
);

create table work_aliases (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  alias text not null
);

-- ---------- タイムライン (中心テーブル) ----------
create table feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type text not null check (item_type in
    ('post','article','review','record','thread','reply','repost','quote','goal_achievement')),
  source_id uuid not null,                          -- 各テーブルの行ID (ポリモーフィック)
  work_id uuid references works(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','private','followers')),
  created_at timestamptz not null default now()
);
create index feed_items_created_idx on feed_items (created_at desc);
create index feed_items_type_idx on feed_items (item_type, created_at desc);
create index feed_items_user_idx on feed_items (user_id, created_at desc);

-- ---------- 投稿 ----------
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  tags text[] not null default '{}',
  post_type text not null default 'normal_post' check (post_type in
    ('normal_post','review_post','article_post','record_post','thread_post','quote_post')),
  quoted_feed_item_id uuid references feed_items(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','private','followers')),
  deleted_at timestamptz, -- 論理削除
  created_at timestamptz not null default now()
);
create index posts_body_trgm on posts using gin (body gin_trgm_ops);

create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  body text not null,
  deleted_at timestamptz, -- 論理削除
  created_at timestamptz not null default now()
);

create table likes (
  user_id uuid not null references profiles(id) on delete cascade,
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, feed_item_id)
);

create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, feed_item_id)
);

create table reposts (
  user_id uuid not null references profiles(id) on delete cascade,
  feed_item_id uuid not null references feed_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, feed_item_id)
);

-- ---------- 長文記事 ----------
create table articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  visibility text not null default 'public' check (visibility in ('public','private','followers')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_title_trgm on articles using gin (title gin_trgm_ops);

create table article_works (
  article_id uuid not null references articles(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  primary key (article_id, work_id)
);

-- ---------- レビュー ----------
-- 星(rating)は持たない。星は records(本棚)が唯一の真実(判断4)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  body text not null default '',
  tags text[] not null default '{}',
  spoiler boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public','private','followers')),
  created_at timestamptz not null default now()
);

create table review_scores (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  axis_name text not null check (char_length(axis_name) <= 8),
  score int not null check (score between 1 and 10),
  display_order int not null default 0
);
create index review_scores_review_idx on review_scores (review_id, display_order);

create table review_axis_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade, -- null=システム提供
  name text not null,
  category text check (category in ('film','music','literature','art','fashion','exhibition','stage','game','other')),
  created_at timestamptz not null default now()
);

create table review_axis_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references review_axis_templates(id) on delete cascade,
  axis_name text not null,
  display_order int not null default 0
);

-- ---------- 鑑賞記録 ----------
-- records = 本棚。ステータスと星評価の唯一の真実(ユーザー×作品で1行)
create table records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  status text not null check (status in ('want','doing','done','stacked','paused','rewatch')),
  rating numeric(2,1) check (rating between 0.5 and 5), -- 星。作品の平均評価はこの列の平均
  started_at date,
  finished_at date,
  memo text,
  rewatch_count int not null default 0,
  visibility text not null default 'public' check (visibility in ('public','private','followers')), -- 本棚は既定公開
  updated_at timestamptz not null default now(),
  unique (user_id, work_id)
);

-- record_sessions = 時間/量の日記。既定非公開(判断11)
create table record_sessions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  consumed_at timestamptz not null default now(),
  entry_mode text not null default 'expert' check (entry_mode in ('rough','expert')),
  duration_minutes int check (duration_minutes >= 0),
  pages int check (pages >= 0),
  episodes int check (episodes >= 0),
  tracks int check (tracks >= 0),
  memo text default '',
  comment text default '',
  image_urls text[] not null default '{}',
  emotion_tags text[] not null default '{}',
  place text,
  focus_score int check (focus_score between 0 and 10),
  satisfaction_score int check (satisfaction_score between 0 and 10),
  revisit_score int check (revisit_score between 0 and 10),
  custom_metrics jsonb not null default '[]'::jsonb,
  visibility text not null default 'private' check (visibility in ('public','private','followers')),
  created_at timestamptz not null default now()
);
create index record_sessions_user_date_idx on record_sessions (user_id, consumed_at desc);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  category text,
  period text not null check (period in ('weekly','monthly','yearly')),
  target int not null check (target > 0),
  unit text not null default '本',
  created_at timestamptz not null default now()
);

create table goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  period_start date not null,
  current int not null default 0,
  unique (goal_id, period_start)
);

create table streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_days int not null default 0,
  longest_days int not null default 0,
  last_recorded_on date
);

-- ---------- コレクション(作品リスト。UIはPhase 5) ----------
create table collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  cover_image_url text,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  position int not null default 0,
  note text,
  primary key (collection_id, work_id)
);

-- ---------- 一冊に編む(zines。Phase 7) ----------
-- 自分の記事・レビューを束ねたデジタル冊子。/zines/[id] で人に手渡す
create table zines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table zine_items (
  zine_id uuid not null references zines(id) on delete cascade,
  item_type text not null check (item_type in ('article','review')),
  source_id uuid not null, -- articles.id / reviews.id (ポリモーフィック)
  position int not null default 0,
  primary key (zine_id, item_type, source_id)
);

-- ---------- 語り場(作品に従属。boardsは存在しない) ----------
create table threads (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) <= 60),
  reply_count int not null default 0, -- レス番号の採番台帳
  deleted_at timestamptz, -- 論理削除
  created_at timestamptz not null default now(),
  last_reply_at timestamptz not null default now()
);

create table thread_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  number int not null, -- res番号。採番は post_thread_reply() のみ
  display_name text not null, -- ハンドル制(匿名は提供しない)
  body text not null,
  quote_number int,
  deleted_at timestamptz, -- 論理削除。行とres番号は残り「削除済み」表示
  created_at timestamptz not null default now(),
  unique (thread_id, number)
);

create table thread_reply_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  reply_id uuid not null references thread_replies(id) on delete cascade,
  primary key (user_id, reply_id)
);

-- ---------- タグ / 通知 / 通報 ----------
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);
alter table follows add constraint follows_tag_fk foreign key (tag_id) references tags(id) on delete cascade;

create table taggings (
  tag_id uuid not null references tags(id) on delete cascade,
  target_type text not null check (target_type in ('post','article','review','work','record_session')),
  target_id uuid not null,
  primary key (tag_id, target_type, target_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('like','comment','follow','repost','quote','reply','goal','new_review_on_followed_work')),
  actor_id uuid references profiles(id) on delete cascade,
  feed_item_id uuid references feed_items(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  handled_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =============================================================
-- 関数: レス投稿(採番をトランザクション内で行う。§6-6)
-- count+1 方式は同時書き込みで衝突するため、この関数だけが採番できる
-- =============================================================
create or replace function post_thread_reply(
  p_thread_id uuid,
  p_body text,
  p_quote_number int default null
) returns thread_replies
language plpgsql security definer as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_number int;
  v_reply thread_replies;
begin
  if v_user is null then
    raise exception 'login required';
  end if;
  select display_name into v_name from profiles where id = v_user;

  update threads
    set reply_count = reply_count + 1, last_reply_at = now()
    where id = p_thread_id and deleted_at is null
    returning reply_count into v_number;
  if v_number is null then
    raise exception 'thread not found';
  end if;

  insert into thread_replies (thread_id, user_id, number, display_name, body, quote_number)
    values (p_thread_id, v_user, v_number, coalesce(v_name, '名無しの批評家'), p_body, p_quote_number)
    returning * into v_reply;
  return v_reply;
end $$;

-- =============================================================
-- トリガー: 活動を feed_items に自動で流す (Timeline First の心臓部)
-- ※通知はここでは作らない(Server Actionの仕事)
-- =============================================================
create or replace function push_to_feed() returns trigger
language plpgsql security definer as $$
begin
  if tg_table_name = 'posts' then
    insert into feed_items (user_id, item_type, source_id, visibility)
    values (new.user_id, case when new.quoted_feed_item_id is null then 'post' else 'quote' end, new.id, new.visibility);
  elsif tg_table_name = 'reviews' then
    insert into feed_items (user_id, item_type, source_id, work_id, visibility)
    values (new.user_id, 'review', new.id, new.work_id, new.visibility);
  elsif tg_table_name = 'record_sessions' then
    insert into feed_items (user_id, item_type, source_id, work_id, visibility)
    values (new.user_id, 'record', new.id,
            (select work_id from records where id = new.record_id), new.visibility);
  elsif tg_table_name = 'articles' then
    if new.status = 'published' then
      insert into feed_items (user_id, item_type, source_id, visibility)
      values (new.user_id, 'article', new.id, new.visibility);
    end if;
  elsif tg_table_name = 'threads' then
    insert into feed_items (user_id, item_type, source_id, work_id)
    values (new.user_id, 'thread', new.id, new.work_id, 'public');
  end if;
  return new;
end $$;

create trigger posts_to_feed after insert on posts for each row execute function push_to_feed();
create trigger reviews_to_feed after insert on reviews for each row execute function push_to_feed();
create trigger sessions_to_feed after insert on record_sessions for each row execute function push_to_feed();
create trigger articles_to_feed after insert on articles for each row execute function push_to_feed();
create trigger threads_to_feed after insert on threads for each row execute function push_to_feed();

-- =============================================================
-- Row Level Security
-- =============================================================
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table follows enable row level security;
alter table works enable row level security;
alter table work_images enable row level security;
alter table work_aliases enable row level security;
alter table feed_items enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table bookmarks enable row level security;
alter table reposts enable row level security;
alter table articles enable row level security;
alter table article_works enable row level security;
alter table reviews enable row level security;
alter table review_scores enable row level security;
alter table review_axis_templates enable row level security;
alter table review_axis_template_items enable row level security;
alter table records enable row level security;
alter table record_sessions enable row level security;
alter table goals enable row level security;
alter table goal_progress enable row level security;
alter table streaks enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table zines enable row level security;
alter table zine_items enable row level security;
alter table threads enable row level security;
alter table thread_replies enable row level security;
alter table thread_reply_likes enable row level security;
alter table tags enable row level security;
alter table taggings enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

-- プロフィール(role列の変更はダッシュボードからのみ。アプリにUIを作らない)
create policy "profiles readable" on profiles for select using (true);
create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on profiles for update using (auth.uid() = id);

create policy "settings self" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "follows readable" on follows for select using (true);
create policy "follows self insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows self delete" on follows for delete using (auth.uid() = follower_id);

-- 作品: INSERTはログインユーザー / UPDATEは登録者本人かmoderator(判断1)
create policy "works readable" on works for select using (true);
create policy "works insert" on works for insert with check (auth.uid() is not null);
create policy "works update by owner or mod" on works for update
  using (created_by = auth.uid() or is_moderator());
create policy "work images readable" on work_images for select using (true);
create policy "work images insert" on work_images for insert with check (auth.uid() is not null);
create policy "work aliases readable" on work_aliases for select using (true);
create policy "work aliases insert" on work_aliases for insert with check (auth.uid() is not null);

create policy "feed public readable" on feed_items for select
  using (visibility = 'public' or user_id = auth.uid());
create policy "feed self insert" on feed_items for insert with check (auth.uid() = user_id);
create policy "feed self delete" on feed_items for delete using (auth.uid() = user_id);

-- 投稿: 論理削除はUPDATE。moderatorは deleted_at の更新のみ想定
create policy "posts readable" on posts for select
  using (visibility = 'public' or user_id = auth.uid());
create policy "posts self insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts update by owner or mod" on posts for update
  using (auth.uid() = user_id or is_moderator());

create policy "comments readable" on comments for select using (true);
create policy "comments self" on comments for insert with check (auth.uid() = user_id);
create policy "comments update by owner or mod" on comments for update
  using (auth.uid() = user_id or is_moderator());

create policy "likes readable" on likes for select using (true);
create policy "likes self" on likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bookmarks self only" on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reposts readable" on reposts for select using (true);
create policy "reposts self" on reposts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "articles readable" on articles for select
  using ((status = 'published' and visibility = 'public') or user_id = auth.uid());
create policy "articles self insert" on articles for insert with check (auth.uid() = user_id);
create policy "articles self update" on articles for update using (auth.uid() = user_id);
create policy "articles self delete" on articles for delete using (auth.uid() = user_id);
create policy "article works readable" on article_works for select using (true);
create policy "article works self" on article_works for insert
  with check (exists (select 1 from articles a where a.id = article_id and a.user_id = auth.uid()));

create policy "reviews readable" on reviews for select
  using (visibility = 'public' or user_id = auth.uid());
create policy "reviews self insert" on reviews for insert with check (auth.uid() = user_id);
create policy "reviews self update" on reviews for update using (auth.uid() = user_id);
create policy "reviews self delete" on reviews for delete using (auth.uid() = user_id);

create policy "scores follow review" on review_scores for select
  using (exists (select 1 from reviews r where r.id = review_id
                 and (r.visibility = 'public' or r.user_id = auth.uid())));
create policy "scores self write" on review_scores for insert
  with check (exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "scores self delete" on review_scores for delete
  using (exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid()));

create policy "templates readable" on review_axis_templates for select
  using (owner_id is null or owner_id = auth.uid());
create policy "templates self" on review_axis_templates for insert with check (auth.uid() = owner_id);
create policy "templates self update" on review_axis_templates for update using (auth.uid() = owner_id);
create policy "templates self delete" on review_axis_templates for delete using (auth.uid() = owner_id);
create policy "template items readable" on review_axis_template_items for select
  using (exists (select 1 from review_axis_templates t where t.id = template_id
                 and (t.owner_id is null or t.owner_id = auth.uid())));
create policy "template items self write" on review_axis_template_items for insert
  with check (exists (select 1 from review_axis_templates t where t.id = template_id and t.owner_id = auth.uid()));

-- 本棚: 既定公開。非公開は本人のみ
create policy "records readable" on records for select
  using (visibility = 'public' or user_id = auth.uid());
create policy "records self write" on records for insert with check (auth.uid() = user_id);
create policy "records self update" on records for update using (auth.uid() = user_id);
create policy "records self delete" on records for delete using (auth.uid() = user_id);

-- 時間ログ: 既定非公開(判断11)
create policy "sessions readable" on record_sessions for select
  using (visibility = 'public' or user_id = auth.uid());
create policy "sessions self write" on record_sessions for insert with check (auth.uid() = user_id);
create policy "sessions self update" on record_sessions for update using (auth.uid() = user_id);
create policy "sessions self delete" on record_sessions for delete using (auth.uid() = user_id);

create policy "goals self" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal progress self" on goal_progress for all
  using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()))
  with check (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "streaks readable" on streaks for select using (true);
create policy "streaks self write" on streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections readable" on collections for select
  using (is_private = false or owner_id = auth.uid());
create policy "collections self" on collections for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "collection items readable" on collection_items for select
  using (exists (select 1 from collections c where c.id = collection_id
                 and (c.is_private = false or c.owner_id = auth.uid())));
create policy "collection items self" on collection_items for all
  using (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()));

create policy "zines readable" on zines for select
  using (is_private = false or owner_id = auth.uid());
create policy "zines self" on zines for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "zine items readable" on zine_items for select
  using (exists (select 1 from zines z where z.id = zine_id
                 and (z.is_private = false or z.owner_id = auth.uid())));
create policy "zine items self" on zine_items for all
  using (exists (select 1 from zines z where z.id = zine_id and z.owner_id = auth.uid()))
  with check (exists (select 1 from zines z where z.id = zine_id and z.owner_id = auth.uid()));

-- 語り場: 読みは全員(deleted_atの行も返し、表示側で「削除済み」処理)
create policy "threads readable" on threads for select using (true);
create policy "threads insert" on threads for insert with check (auth.uid() = user_id);
create policy "threads update by owner or mod" on threads for update
  using (auth.uid() = user_id or is_moderator());
create policy "replies readable" on thread_replies for select using (true);
create policy "replies insert" on thread_replies for insert with check (auth.uid() = user_id);
create policy "replies update by owner or mod" on thread_replies for update
  using (auth.uid() = user_id or is_moderator());
create policy "reply likes readable" on thread_reply_likes for select using (true);
create policy "reply likes self" on thread_reply_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags readable" on tags for select using (true);
create policy "tags insert" on tags for insert with check (auth.uid() is not null);
create policy "taggings readable" on taggings for select using (true);
create policy "taggings insert" on taggings for insert with check (auth.uid() is not null);

-- 通知: 読み書きは受信者本人 / 作成は行動した本人(actor)
create policy "notifications self" on notifications for select using (auth.uid() = user_id);
create policy "notifications update self" on notifications for update using (auth.uid() = user_id);
create policy "notifications insert by actor" on notifications for insert
  with check (auth.uid() = actor_id);

-- 通報: 自分の通報 + moderatorは全件。status更新はmoderator
create policy "reports insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "reports readable" on reports for select
  using (reporter_id = auth.uid() or is_moderator());
create policy "reports handled by mods" on reports for update using (is_moderator());

-- =============================================================
-- Auth: サインアップ時に profiles / user_settings / streaks を自動作成
-- =============================================================
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
declare
  base text;
begin
  base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if base = '' or char_length(base) < 3 then
    base := 'user';
  end if;
  base := left(base, 15) || '_' || left(replace(new.id::text, '-', ''), 4);

  insert into profiles (id, username, display_name)
  values (new.id, base, split_part(new.email, '@', 1));
  insert into user_settings (user_id) values (new.id);
  insert into streaks (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
