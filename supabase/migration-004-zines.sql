-- =============================================================
-- migration-004: 一冊に編む(zines / zine_items)Phase 7
-- 自分の記事・レビューを束ねたデジタル冊子。/zines/[id] で人に手渡す。
-- 適用済みDBに対して SQL Editor で実行する。新規DBは schema.sql のみでよい。
-- =============================================================

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

alter table zines enable row level security;
alter table zine_items enable row level security;

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
