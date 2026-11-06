-- Run this script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Sarees','Kurtis','Dress Materials','Blouses')),
  price numeric(10,2) not null check (price > 0),
  description text not null default '',
  image_url text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;

create or replace function public.is_store_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_store_admin());

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
for insert to authenticated with check (id = auth.uid() and role = 'customer');

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products
for select to anon, authenticated using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products
for insert to authenticated with check (public.is_store_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products
for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products
for delete to authenticated using (public.is_store_admin());

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews" on public.reviews
for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review" on public.reviews
for insert to anon, authenticated with check (rating between 1 and 5 and length(customer_name) between 1 and 80 and length(comment) between 1 and 1200);

-- Public bucket for product photos. Admin-only uploads/deletes.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_store_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_store_admin())
with check (bucket_id = 'product-images' and public.is_store_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_store_admin());

-- New signups get a customer profile automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
