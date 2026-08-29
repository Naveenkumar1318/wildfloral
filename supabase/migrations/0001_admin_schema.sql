-- =========================================================
-- WILDFLORAL ADMIN DATABASE
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- BOOKING STATUS
-- =========================================================

do $$
begin
  create type public.booking_status as enum (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;


-- =========================================================
-- SERVICES
-- =========================================================

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  category text not null,

  description text not null,

  price numeric(10, 2) not null
    check (price >= 0),

  duration_minutes integer not null
    check (duration_minutes > 0),

  image_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================================
-- PORTFOLIO
-- =========================================================

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  slug text not null unique,

  category text not null,

  description text,

  image_url text not null,

  is_published boolean not null default false,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================================
-- BOOKINGS
-- =========================================================

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  service_id uuid not null
    references public.services(id)
    on delete restrict,

  booking_date date not null,

  booking_time time not null,

  customer_name text not null,

  customer_email text not null,

  customer_phone text,

  notes text,

  price numeric(10, 2) not null
    check (price >= 0),

  status public.booking_status not null default 'pending',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists services_category_idx
on public.services(category);

create index if not exists services_active_idx
on public.services(is_active);

create index if not exists portfolio_category_idx
on public.portfolio(category);

create index if not exists portfolio_published_idx
on public.portfolio(is_published);

create index if not exists bookings_customer_id_idx
on public.bookings(customer_id);

create index if not exists bookings_service_id_idx
on public.bookings(service_id);

create index if not exists bookings_status_idx
on public.bookings(status);

create index if not exists bookings_date_idx
on public.bookings(booking_date);

create index if not exists bookings_created_at_idx
on public.bookings(created_at desc);


-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  return new;
end;
$$;


-- =========================================================
-- SERVICES UPDATED TRIGGER
-- =========================================================

drop trigger if exists services_set_updated_at
on public.services;

create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();


-- =========================================================
-- PORTFOLIO UPDATED TRIGGER
-- =========================================================

drop trigger if exists portfolio_set_updated_at
on public.portfolio;

create trigger portfolio_set_updated_at
before update on public.portfolio
for each row
execute function public.set_updated_at();


-- =========================================================
-- BOOKINGS UPDATED TRIGGER
-- =========================================================

drop trigger if exists bookings_set_updated_at
on public.bookings;

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();


-- =========================================================
-- ADMIN CHECK
-- Uses your existing:
-- public.profiles.role
-- user_role enum:
-- customer / admin
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


revoke execute
on function public.is_admin()
from anon;

grant execute
on function public.is_admin()
to authenticated;


-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.services
enable row level security;

alter table public.portfolio
enable row level security;

alter table public.bookings
enable row level security;


-- =========================================================
-- SERVICES POLICIES
-- =========================================================

drop policy if exists "Public can view active services"
on public.services;

create policy "Public can view active services"
on public.services
for select
to anon, authenticated
using (
  is_active = true
  or public.is_admin()
);


drop policy if exists "Admins can insert services"
on public.services;

create policy "Admins can insert services"
on public.services
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists "Admins can update services"
on public.services;

create policy "Admins can update services"
on public.services
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


drop policy if exists "Admins can delete services"
on public.services;

create policy "Admins can delete services"
on public.services
for delete
to authenticated
using (
  public.is_admin()
);


-- =========================================================
-- PORTFOLIO POLICIES
-- =========================================================

drop policy if exists "Public can view published portfolio"
on public.portfolio;

create policy "Public can view published portfolio"
on public.portfolio
for select
to anon, authenticated
using (
  is_published = true
  or public.is_admin()
);


drop policy if exists "Admins can insert portfolio"
on public.portfolio;

create policy "Admins can insert portfolio"
on public.portfolio
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists "Admins can update portfolio"
on public.portfolio;

create policy "Admins can update portfolio"
on public.portfolio
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


drop policy if exists "Admins can delete portfolio"
on public.portfolio;

create policy "Admins can delete portfolio"
on public.portfolio
for delete
to authenticated
using (
  public.is_admin()
);


-- =========================================================
-- BOOKINGS POLICIES
-- =========================================================

drop policy if exists "Customers can view own bookings"
on public.bookings;

create policy "Customers can view own bookings"
on public.bookings
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);


drop policy if exists "Customers can create bookings"
on public.bookings;

create policy "Customers can create bookings"
on public.bookings
for insert
to authenticated
with check (
  customer_id = auth.uid()
);


drop policy if exists "Admins can update bookings"
on public.bookings;

create policy "Admins can update bookings"
on public.bookings
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- =========================================================
-- SEED SERVICES
-- =========================================================

insert into public.services (
  name,
  category,
  description,
  price,
  duration_minutes,
  image_url,
  is_active
)
values
(
  'Hair Styling',
  'Hair',
  'Professional styling for everyday looks and special occasions.',
  800,
  60,
  '/src/assets/wildfloral/beauty/hair/hair1.jpg',
  true
),
(
  'Bridal Makeup',
  'Bridal',
  'Complete bridal beauty styling for your most memorable moments.',
  8500,
  120,
  '/src/assets/wildfloral/beauty/bridal/bridal1.jpg',
  true
),
(
  'Party Makeup',
  'Makeup',
  'A polished makeup look created for celebrations and events.',
  2500,
  90,
  '/src/assets/wildfloral/beauty/makeup/makeup1.jpg',
  true
),
(
  'Facial & Skin Care',
  'Skin Care',
  'Professional treatments for healthy, refreshed-looking skin.',
  1200,
  60,
  '/src/assets/wildfloral/beauty/skin-care/skincare1.jpg',
  true
);