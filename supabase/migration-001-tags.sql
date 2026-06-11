-- =============================================================
-- マイグレーション 001: タグ列 + 通知INSERTポリシー
-- schema.sql を「2026-06-12より前」に実行済みのプロジェクトだけ、これを実行する。
-- (新規プロジェクトは最新の schema.sql に含まれているので不要)
-- =============================================================
alter table posts add column if not exists tags text[] not null default '{}';
alter table reviews add column if not exists tags text[] not null default '{}';
alter table articles add column if not exists tags text[] not null default '{}';

-- いいね・コメントしたユーザー(actor)が相手宛の通知を作成できるようにする
create policy "notifications insert by actor" on notifications for insert
  with check (auth.uid() = actor_id);
