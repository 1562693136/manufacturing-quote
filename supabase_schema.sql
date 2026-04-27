-- Supabase schema for Manufacturing Quote System
-- Run this in Supabase SQL Editor

-- Enable RLS
drop policy if exists "Users can only view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Enable insert for authenticated users only" on profiles;
drop table if exists bom_relations;
drop table if exists bom_items;
drop table if exists quotations;
drop table if exists profiles;
drop table if exists roles;

-- Roles table
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  perm_quote_create boolean default true,
  perm_quote_edit boolean default true,
  perm_bom boolean default true,
  perm_settings boolean default true,
  perm_sop boolean default true,
  perm_user_manage boolean default false,
  created_at timestamp with time zone default now()
);

-- Insert default roles
insert into roles (name, perm_quote_create, perm_quote_edit, perm_bom, perm_settings, perm_sop, perm_user_manage) values
  ('admin', true, true, true, true, true, true),
  ('quoter', true, true, true, true, true, false),
  ('viewer', false, false, false, true, true, false);

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'quoter',
  created_at timestamp with time zone default now()
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'quoter');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Admin can view all profiles
create policy "Admin can view all profiles"
  on profiles for select
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Quotations table
create table quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  quote_no text not null,
  product_code text not null,
  product_name text not null,
  customer text,
  volume integer not null default 0,
  unit_cost numeric(12,2) not null default 0,
  quote_price numeric(12,2) not null default 0,
  margin_rate numeric(5,2) not null default 0,
  data_snapshot jsonb default '{}',
  created_at timestamp with time zone default now()
);

alter table quotations enable row level security;

create policy "Users can CRUD own quotations"
  on quotations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- BOM items table
create table bom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  code text not null,
  name text not null,
  spec text,
  type text check (type in ('semi', 'raw')) default 'raw',
  source_type text check (source_type in ('purchase', 'selfmade')) default 'purchase',
  unit_price numeric(12,2) default 0,
  process_fee numeric(12,2) default 0,
  loss_rate numeric(5,2) default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, code)
);

alter table bom_items enable row level security;

create policy "Users can CRUD own bom_items"
  on bom_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- BOM relations table
create table bom_relations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  parent_code text not null,
  child_code text not null,
  qty numeric(10,4) default 1,
  created_at timestamp with time zone default now()
);

alter table bom_relations enable row level security;

create policy "Users can CRUD own bom_relations"
  on bom_relations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Custom fields table (per quote template)
create table quote_custom_fields (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotations on delete cascade not null,
  field_name text not null,
  field_type text check (field_type in ('text','number','date','select','multiselect','currency')) default 'text',
  is_required boolean default false,
  default_value text,
  options jsonb default '[]',
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

alter table quote_custom_fields enable row level security;

create policy "Users can CRUD own custom fields"
  on quote_custom_fields for all
  to authenticated
  using (quote_id in (select id from quotations where user_id = auth.uid()))
  with check (quote_id in (select id from quotations where user_id = auth.uid()));

-- Quote relations table (version lineage)
create table quote_relations (
  id uuid primary key default gen_random_uuid(),
  parent_quote_id uuid references quotations on delete cascade,
  child_quote_id uuid references quotations on delete cascade not null,
  relation_type text check (relation_type in ('version','copy','edit')) default 'copy',
  created_at timestamp with time zone default now()
);

alter table quote_relations enable row level security;

create policy "Users can view own quote relations"
  on quote_relations for select
  to authenticated
  using (child_quote_id in (select id from quotations where user_id = auth.uid()));

-- Add search index on quotations
create index idx_quotations_search on quotations(user_id, product_name, product_code, customer, quote_no);
create index idx_quotations_created on quotations(user_id, created_at desc);
