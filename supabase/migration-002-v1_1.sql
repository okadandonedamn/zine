-- =============================================================
-- マイグレーション 002: 設計書v1.1対応
-- 旧schema.sql(v1.0系)を適用済みのプロジェクトだけ実行する。
-- 新規プロジェクトは最新の schema.sql を使えばよい(これは不要)。
-- =============================================================

create extension if not exists pg_trgm;

-- 判断2: profiles.role + is_moderator()。moderatorsテーブル廃止
alter table profiles add column if not exists role text not null default 'user'
  check (role in ('user','moderator','admin'));
alter table profiles add column if not exists website text;
alter table profiles add column if not exists header_url text;

create or replace function is_moderator() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('moderator','admin')
  );
$$;

drop policy if exists "replies readable" on thread_replies;
drop policy if exists "replies moderate" on thread_replies;
drop policy if exists "reports readable by mods" on reports;
drop policy if exists "moderators readable" on moderators;
drop table if exists moderators;

-- 判断3: 論理削除
alter table posts add column if not exists deleted_at timestamptz;
alter table comments add column if not exists deleted_at timestamptz;
alter table threads add column if not exists deleted_at timestamptz;
alter table thread_replies add column if not exists deleted_at timestamptz;

-- 判断4: 星評価を records(本棚)に一本化
alter table records add column if not exists rating numeric(2,1) check (rating between 0.5 and 5);
alter table records add column if not exists memo text;
-- 既存レビューの星を本棚へ移してから列を落とす
update records r set rating = sub.rating
from (
  select distinct on (user_id, work_id) user_id, work_id, rating
  from reviews order by user_id, work_id, created_at desc
) sub
where r.user_id = sub.user_id and r.work_id = sub.work_id and r.rating is null;
insert into records (user_id, work_id, status, rating)
select rv.user_id, rv.work_id, 'done', rv.rating from reviews rv
on conflict (user_id, work_id) do nothing;
alter table reviews drop column if exists rating;

-- 判断6: boards廃止。threadsは作品に従属
alter table threads add column if not exists reply_count int not null default 0;
update threads t set reply_count = coalesce(
  (select max(number) from thread_replies x where x.thread_id = t.id), 0);
-- 作品に紐づかない既存スレは削除される点に注意(必要なら手動で work_id を埋めてから実行)
delete from threads where work_id is null;
alter table threads alter column work_id set not null;
alter table threads drop column if exists anonymous;
alter table threads drop column if exists board_id;
drop table if exists boards cascade;

-- 判断8: 多態フォロー
alter table follows drop constraint if exists follows_pkey;
alter table follows add column if not exists id uuid default gen_random_uuid();
alter table follows add primary key (id);
alter table follows rename column followee_id to followee_user_id;
alter table follows alter column followee_user_id drop not null;
alter table follows add column if not exists work_id uuid references works(id) on delete cascade;
alter table follows add column if not exists tag_id uuid references tags(id) on delete cascade;
alter table follows add constraint follows_one_target
  check (num_nonnulls(followee_user_id, work_id, tag_id) = 1);
create unique index if not exists follows_user_uniq on follows (follower_id, followee_user_id) where followee_user_id is not null;
create unique index if not exists follows_work_uniq on follows (follower_id, work_id) where work_id is not null;
create unique index if not exists follows_tag_uniq on follows (follower_id, tag_id) where tag_id is not null;

-- 判断9/重複統合: works拡張
alter table works add column if not exists title_kana text;
alter table works add column if not exists external_ids jsonb;
alter table works add column if not exists merged_into_id uuid references works(id);

-- 判断11: 時間ログは既定非公開
alter table record_sessions alter column visibility set default 'private';

-- 通報: 処理者
alter table reports add column if not exists handled_by uuid references profiles(id);

-- collections(UIはPhase 5)
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  cover_image_url text,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  position int not null default 0,
  note text,
  primary key (collection_id, work_id)
);
alter table collections enable row level security;
alter table collection_items enable row level security;

-- pg_trgm インデックス
create index if not exists works_title_trgm on works using gin (title gin_trgm_ops);
create index if not exists works_title_kana_trgm on works using gin (title_kana gin_trgm_ops);
create index if not exists works_creator_trgm on works using gin (creator gin_trgm_ops);
create index if not exists posts_body_trgm on posts using gin (body gin_trgm_ops);
create index if not exists articles_title_trgm on articles using gin (title gin_trgm_ops);

-- レス採番関数(§6-6)
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

-- ポリシー再構築(変更分)
drop policy if exists "works insert" on works;
create policy "works insert" on works for insert with check (auth.uid() is not null);
create policy "works update by owner or mod" on works for update
  using (created_by = auth.uid() or is_moderator());

drop policy if exists "posts self update" on posts;
drop policy if exists "posts self delete" on posts;
create policy "posts update by owner or mod" on posts for update
  using (auth.uid() = user_id or is_moderator());

drop policy if exists "comments self delete" on comments;
create policy "comments update by owner or mod" on comments for update
  using (auth.uid() = user_id or is_moderator());

drop policy if exists "threads insert" on threads;
create policy "threads insert" on threads for insert with check (auth.uid() = user_id);
create policy "threads update by owner or mod" on threads for update
  using (auth.uid() = user_id or is_moderator());

create policy "replies readable" on thread_replies for select using (true);
create policy "replies update by owner or mod" on thread_replies for update
  using (auth.uid() = user_id or is_moderator());

drop policy if exists "reports readable" on reports;
create policy "reports readable" on reports for select
  using (reporter_id = auth.uid() or is_moderator());
create policy "reports handled by mods" on reports for update using (is_moderator());

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
