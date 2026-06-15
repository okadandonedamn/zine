do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'thread_reply_likes'
      and policyname = 'reply likes readable'
  ) then
    create policy "reply likes readable" on thread_reply_likes
      for select using (true);
  end if;
end $$;
