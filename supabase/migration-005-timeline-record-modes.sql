-- =============================================================
-- migration-005: タイムライン再整理と記録フォーム2モード化のための列追加
-- 既存DBに対して Supabase SQL Editor で実行する。
-- =============================================================

alter table record_sessions
  add column if not exists entry_mode text not null default 'expert'
    check (entry_mode in ('rough','expert')),
  add column if not exists comment text default '',
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists focus_score int check (focus_score between 0 and 10),
  add column if not exists satisfaction_score int check (satisfaction_score between 0 and 10),
  add column if not exists revisit_score int check (revisit_score between 0 and 10),
  add column if not exists custom_metrics jsonb not null default '[]'::jsonb;

update record_sessions
set entry_mode = 'expert'
where entry_mode is null;
