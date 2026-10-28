-- =====================================================================
-- CentraleMarket — ¿qué archivos SQL están ejecutados en Supabase?
--
-- Solo LEE: no cambia nada. Se puede ejecutar cuantas veces se quiera.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Sale una fila por archivo: ✅ ejecutado, ❌ falta (ejecútalo en orden).
-- Desde el 14, cada archivo se apunta solo: select * from private.scripts_aplicados;
-- =====================================================================

select archivo, case when ok then '✅' else '❌' end as estado, nota
from (values
  ('schema.sql',                 to_regclass('public.listings') is not null,               'perfiles y anuncios'),
  ('02_chat.sql',                to_regclass('public.messages') is not null,               'chat'),
  ('04_favorites.sql',           to_regclass('public.favorites') is not null,              'favoritos'),
  ('05_avatars.sql',             exists (select 1 from storage.buckets where id = 'avatars'), 'fotos de perfil'),
  ('06_delete_account.sql',      to_regprocedure('public.delete_my_account()') is not null, 'borrar cuenta'),
  ('07_mejoras_vinted.sql',      to_regclass('public.reviews') is not null
                                 and to_regclass('public.notifications') is not null,      'ofertas, valoraciones, avisos'),
  ('08_reports.sql',             to_regclass('public.reports') is not null,                'denuncias'),
  ('09_push.sql',                to_regclass('public.push_subscriptions') is not null,     'notificaciones push'),
  ('09_push.sql (pg_cron)',      exists (select 1 from pg_extension where extname = 'pg_cron'), 'recordatorios automáticos'),
  ('10_valoraciones_dobles.sql', exists (select 1 from information_schema.columns
                                         where table_schema = 'public' and table_name = 'reviews'
                                           and column_name = 'reviewee_id'),               'valoraciones en los dos sentidos'),
  ('11_admin.sql',               to_regclass('public.admins') is not null,                 'panel de administración'),
  ('11_admin.sql (admins)',      case when to_regclass('public.admins') is null then false
                                 else (xpath('/row/n/text()', query_to_xml(
                                   'select count(*) as n from public.admins', false, true, '')))[1]::text::int > 0 end,
                                                                                           'hay al menos un administrador'),
  ('12_errores.sql',             to_regclass('public.client_errors') is not null,          'registro de errores (Admin → Errors)'),
  ('13_antiabuso.sql',           to_regprocedure('public.has_link(text)') is not null,     'límites contra spam y estafas'),
  ('14_registro_e_historial.sql', to_regclass('public.admin_actions') is not null,         'registro de SQL e historial de moderación')
) as t(archivo, ok, nota);
