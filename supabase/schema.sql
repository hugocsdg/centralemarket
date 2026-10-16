-- =====================================================================
-- CentraleMarket — estructura de la base de datos (versión 1)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Solo hay que ejecutarlo UNA vez en un proyecto nuevo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Dominios de email permitidos
--    Solo pueden registrarse emails que acaben en uno de estos dominios.
--    Para añadir otro (p. ej. el de los Erasmus), basta con un INSERT.
-- ---------------------------------------------------------------------
create table public.allowed_email_domains (
  domain text primary key
);

insert into public.allowed_email_domains (domain) values ('student-cs.fr');

-- Sin políticas: nadie puede leer ni cambiar esta tabla desde la web.
alter table public.allowed_email_domains enable row level security;


-- ---------------------------------------------------------------------
-- 2. Perfiles: la información pública de cada estudiante
--    (el email y la contraseña los guarda Supabase Auth aparte).
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text,
  -- Opcional. Solo lo ven otros estudiantes con sesión iniciada.
  whatsapp text check (whatsapp ~ '^\+?[0-9 ]{6,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Students can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Students can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 3. Al registrarse: comprobar el email y crear el perfil automáticamente
-- ---------------------------------------------------------------------

-- Rechaza el registro si el email no es de un dominio permitido.
create function public.check_email_domain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.allowed_email_domains d
    where lower(split_part(new.email, '@', 2)) = d.domain
  ) then
    raise exception 'Only CentraleSupélec student emails can sign up';
  end if;
  return new;
end;
$$;

create trigger check_email_domain
  before insert on auth.users
  for each row execute function public.check_email_domain();

-- Crea el perfil. El nombre sale del formulario de registro
-- o, si no hay, de la parte del email antes de la @.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 50)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 4. Anuncios
-- ---------------------------------------------------------------------
create table public.listings (
  id bigint generated always as identity primary key,
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null check (
    category in ('furniture', 'electronics', 'kitchen', 'food', 'tickets', 'clothing',
                 'books', 'bikes', 'sports', 'services', 'other')
  ),
  price numeric(8, 2) not null check (price >= 0 and price <= 10000),
  -- Solo para servicios: '/h' o '/session'. Vacío para productos.
  price_unit text check (price_unit in ('/h', '/session')),
  -- Opcional porque los servicios no tienen estado.
  condition text check (condition in ('New', 'Like new', 'Good', 'Fair')),
  location text not null check (char_length(location) between 2 and 60),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  moving_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_created_at_idx on public.listings (created_at desc);
create index listings_category_idx on public.listings (category);
create index listings_seller_id_idx on public.listings (seller_id);

alter table public.listings enable row level security;

-- Solo estudiantes con sesión (y por tanto con email de la uni) ven los anuncios.
create policy "Students can view listings"
  on public.listings for select
  to authenticated
  using (true);

-- Solo puedes publicar a tu nombre.
create policy "Students can create their own listings"
  on public.listings for insert
  to authenticated
  with check (seller_id = (select auth.uid()));

-- Solo el dueño puede editar (precio, reservado/vendido...) o borrar.
create policy "Sellers can update their own listings"
  on public.listings for update
  to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy "Sellers can delete their own listings"
  on public.listings for delete
  to authenticated
  using (seller_id = (select auth.uid()));

-- Actualiza updated_at cada vez que se modifica un anuncio.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 5. Fotos de los anuncios
--    La imagen va en Storage; aquí solo guardamos su ruta y su orden.
-- ---------------------------------------------------------------------
create table public.listing_images (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on public.listing_images (listing_id, position);

alter table public.listing_images enable row level security;

create policy "Students can view listing images"
  on public.listing_images for select
  to authenticated
  using (true);

-- Solo el dueño del anuncio puede añadir, cambiar o quitar sus fotos.
create policy "Sellers can add images to their listings"
  on public.listing_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.seller_id = (select auth.uid())
    )
  );

create policy "Sellers can update images of their listings"
  on public.listing_images for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.seller_id = (select auth.uid())
    )
  );

create policy "Sellers can delete images of their listings"
  on public.listing_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.seller_id = (select auth.uid())
    )
  );


-- ---------------------------------------------------------------------
-- 6. Permisos de la API para usuarios con sesión
--    (las políticas de arriba deciden QUÉ filas; esto decide QUÉ acciones).
-- ---------------------------------------------------------------------
-- Los visitantes sin sesión (anon) no pueden tocar nada.
revoke all on public.profiles, public.listings, public.listing_images, public.allowed_email_domains from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update, delete on public.listing_images to authenticated;


-- ---------------------------------------------------------------------
-- 7. Almacén de fotos (Storage)
--    Cada usuario sube a su propia carpeta: listing-images/<su id>/foto.jpg
--    Máximo 5 MB por foto; solo JPG, PNG o WebP.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Students can view their own uploaded photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Students can upload photos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Students can update their own photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Students can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
