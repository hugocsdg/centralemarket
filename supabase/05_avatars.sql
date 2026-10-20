-- =====================================================================
-- CentraleMarket — fotos de perfil
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se ejecuta UNA vez, después de schema.sql. (Puede salir el aviso de
-- "destructive operations" por los "drop policy if exists": es seguro.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Almacén de fotos de perfil: avatars/<id del usuario>/avatar-….jpg
--    Máximo 2 MB; solo JPG, PNG o WebP. La app ya las sube recortadas a 400×400.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Students can view their own avatar files" on storage.objects;
create policy "Students can view their own avatar files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can upload their own avatar" on storage.objects;
create policy "Students can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can update their own avatar" on storage.objects;
create policy "Students can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can delete their own avatar" on storage.objects;
create policy "Students can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));


-- ---------------------------------------------------------------------
-- 2. La foto de perfil solo puede ser una del almacén "avatars" de CentraleMarket
--    (así nadie puede poner como foto un enlace a otra web).
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_avatar_url_from_storage;
alter table public.profiles add constraint profiles_avatar_url_from_storage check (
  avatar_url is null
  or avatar_url like 'https://qlhalomjqpfpyqpczszn.supabase.co/storage/v1/object/public/avatars/%'
);
