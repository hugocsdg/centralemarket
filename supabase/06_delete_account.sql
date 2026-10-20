-- =====================================================================
-- CentraleMarket — borrar tu cuenta (Profile → Delete account)
--
-- Una función que borra al usuario que la llama. Al borrar su usuario, la base de datos
-- borra en cadena todo lo suyo: perfil, anuncios (y sus filas de fotos), favoritos,
-- conversaciones y mensajes (todas las tablas usan "on delete cascade").
-- Las FOTOS (archivos del almacén) las borra la app justo antes de llamar a esta función.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run. Se ejecuta UNA vez.
-- =====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in to delete your account';
  end if;
  -- Solo puede borrarse a sí mismo: el id sale de la sesión, no de lo que mande la app.
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
