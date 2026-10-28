-- =====================================================================
-- CentraleMarket — crecimiento: quién se une y quién usa la app (Admin → Growth)
--
-- Una sola función, admin_growth(), que solo pueden usar los administradores:
--   - Totales: estudiantes, nuevos hoy / esta semana, activos hoy / esta semana.
--     "Activo" = ha abierto la app (su sesión se renueva mientras la usa) o ha iniciado sesión.
--   - Por día (últimos N días, hora de París): altas, anuncios nuevos, mensajes y personas activas*.
--   - Embudo: se registran → publican o escriben → venden.
--   - Últimos estudiantes que se han unido, con cuándo abrieron la app por última vez.
--   (*) "activos por día" solo cuenta a quien publicó o escribió ese día (las sesiones no guardan historial).
--
-- No guarda nada nuevo ni cambia permisos: solo lee lo que ya existe.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run. Después de 14_registro_e_historial.sql.
-- Se puede ejecutar dos veces sin problema.
-- =====================================================================

create or replace function public.admin_growth(days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz constant text := 'Europe/Paris';
  today date := (now() at time zone tz)::date;
  span integer := least(greatest(coalesce(days, 30), 7), 180);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;

  with last_seen as (
    -- Última vez que cada estudiante abrió la app.
    select u.id,
      greatest(u.last_sign_in_at, (select max(s.updated_at) from auth.sessions s where s.user_id = u.id)) as at
    from auth.users u
  ),
  doers as (
    select seller_id as id, created_at from public.listings
    union all
    select sender_id, created_at from public.messages
  ),
  series as (
    select d::date as day from generate_series(today - (span - 1), today, interval '1 day') d
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'joined_today', (select count(*) from public.profiles where (created_at at time zone tz)::date = today),
      'joined_week', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'joined_prev_week', (select count(*) from public.profiles
                           where created_at <= now() - interval '7 days' and created_at > now() - interval '14 days'),
      'active_today', (select count(*) from last_seen where (at at time zone tz)::date = today),
      'active_week', (select count(*) from last_seen where at > now() - interval '7 days'),
      'never_back', (select count(*) from public.profiles p join last_seen ls on ls.id = p.id
                     where p.created_at < now() - interval '2 days'
                       and (ls.at is null or ls.at < p.created_at + interval '1 day'))
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', s.day,
        'joined', (select count(*) from public.profiles p where (p.created_at at time zone tz)::date = s.day),
        'listings', (select count(*) from public.listings l where (l.created_at at time zone tz)::date = s.day),
        'messages', (select count(*) from public.messages m where (m.created_at at time zone tz)::date = s.day),
        'active', (select count(distinct d.id) from doers d where (d.created_at at time zone tz)::date = s.day)
      ) order by s.day)
      from series s
    ),
    'funnel', jsonb_build_object(
      'joined', (select count(*) from public.profiles),
      'acted', (select count(distinct id) from doers),
      'listed', (select count(distinct seller_id) from public.listings),
      'sold', (select count(distinct seller_id) from public.listings where status = 'sold')
    ),
    'latest', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
      from (
        select p.id, p.display_name, p.avatar_url, u.email::text as email, p.created_at,
          ls.at as last_seen,
          (select count(*) from public.listings l where l.seller_id = p.id)::int as listings,
          (select count(*) from public.messages m where m.sender_id = p.id)::int as messages,
          exists (select 1 from public.push_subscriptions ps where ps.user_id = p.id) as push
        from public.profiles p
        join auth.users u on u.id = p.id
        left join last_seen ls on ls.id = p.id
        order by p.created_at desc
        limit 40
      ) x
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_growth(integer) from public, anon;
grant execute on function public.admin_growth(integer) to authenticated;

select private.apuntar_script('15_crecimiento.sql');
