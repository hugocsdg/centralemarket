-- =====================================================================
-- CentraleMarket — datos para hacer seguimiento de la app (Admin → Data)
--
-- Una sola función, admin_data(), que solo pueden usar los administradores:
--   - Totales: cuentas, anuncios (en venta / reservados / vendidos), euros vendidos,
--     chats, mensajes, favoritos, valoraciones, fotos, eventos y comida.
--   - Anuncios por categoría (total, en venta, vendidos).
--   - TODAS las cuentas (sin límite), cada una con: email, alta, última vez que abrió la app,
--     anuncios, en venta, vendidos, comprados, mensajes, valoración, denuncias abiertas y si está suspendida.
--
-- No guarda nada nuevo ni cambia permisos: solo lee lo que ya existe.
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run. Después de 14_registro_e_historial.sql.
-- Se puede ejecutar dos veces sin problema.
-- =====================================================================

create or replace function public.admin_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;

  with last_seen as (
    -- Última vez que cada estudiante abrió la app (igual que en Admin → Growth).
    select u.id,
      greatest(u.last_sign_in_at, (select max(s.updated_at) from auth.sessions s where s.user_id = u.id)) as at
    from auth.users u
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'accounts', (select count(*) from public.profiles),
      'suspended', (select count(*) from public.profiles where banned_at is not null),
      'sellers', (select count(distinct seller_id) from public.listings),
      'listings', (select count(*) from public.listings),
      'available', (select count(*) from public.listings where status = 'available'),
      'reserved', (select count(*) from public.listings where status = 'reserved'),
      'sold', (select count(*) from public.listings where status = 'sold'),
      -- Euros: solo productos (los servicios cobran por hora o por sesión).
      'value_sold', (select coalesce(sum(price), 0) from public.listings where status = 'sold' and price_unit is null),
      'value_on_sale', (select coalesce(sum(price), 0) from public.listings where status = 'available' and price_unit is null),
      'free', (select count(*) from public.listings where price = 0),
      'photos', (select count(*) from public.listing_images),
      'events', (select count(*) from public.listings where category = 'tickets'),
      'food', (select count(*) from public.listings where category = 'food'),
      'conversations', (select count(*) from public.conversations),
      'messages', (select count(*) from public.messages),
      'favorites', (select count(*) from public.favorites),
      'reviews', (select count(*) from public.reviews),
      'rating', (select round(avg(rating)::numeric, 1) from public.reviews)
    ),
    'by_category', (
      select coalesce(jsonb_agg(c order by c.total desc), '[]'::jsonb)
      from (
        select category,
          count(*)::int as total,
          count(*) filter (where status = 'available')::int as available,
          count(*) filter (where status = 'sold')::int as sold
        from public.listings
        group by category
      ) c
    ),
    'accounts', (
      select coalesce(jsonb_agg(a order by a.created_at desc), '[]'::jsonb)
      from (
        select p.id, p.display_name, u.email::text as email, p.avatar_url, p.created_at,
          ls.at as last_seen, p.banned_at, p.ban_reason,
          (select count(*) from public.listings l where l.seller_id = p.id)::int as listings,
          (select count(*) from public.listings l where l.seller_id = p.id and l.status = 'available')::int as on_sale,
          (select count(*) from public.listings l where l.seller_id = p.id and l.status = 'sold')::int as sold,
          (select count(*) from public.listings l where l.sold_to = p.id)::int as bought,
          (select count(*) from public.messages m where m.sender_id = p.id)::int as messages,
          (select round(avg(rv.rating)::numeric, 1) from public.reviews rv where rv.reviewee_id = p.id) as rating,
          (select count(*) from public.reports r
             left join public.listings l on l.id = r.listing_id
             where (r.reported_user_id = p.id or l.seller_id = p.id) and r.status = 'open')::int as reports
        from public.profiles p
        join auth.users u on u.id = p.id
        left join last_seen ls on ls.id = p.id
      ) a
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_data() from public, anon;
grant execute on function public.admin_data() to authenticated;

select private.apuntar_script('16_datos.sql');
