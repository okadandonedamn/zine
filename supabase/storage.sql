-- =============================================================
-- Storage: アバター画像用バケット (schema.sql の後に実行)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 誰でも閲覧できる(公開バケット)
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- ログインユーザーは自分のフォルダ(uid/)にだけアップロードできる
create policy "avatars self upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars self update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars self delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
