-- =============================================================
-- migration-003: 記録(record_sessions)の feed_items に work_id を持たせる
-- 目的: 「フォロー中」タイムラインで作品フォロー(follows.work_id)が
--       視聴・読書記録も拾えるようにする。reviews / threads は当初から
--       work_id を供給しているため対象外。
-- 適用済みDBに対して SQL Editor で実行する。新規DBは schema.sql のみでよい。
-- =============================================================

-- 1) 供給トリガーを差し替え(record_sessions 分岐のみ変更)
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

-- 2) 既存の記録 feed_items を埋め戻す
update feed_items f
set work_id = r.work_id
from record_sessions s
join records r on r.id = s.record_id
where f.item_type = 'record'
  and f.source_id = s.id
  and f.work_id is null;
