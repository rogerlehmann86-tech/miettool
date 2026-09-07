-- v5.8: Email templates and per-product pickup/return locations.
-- Applied through Supabase's migration API. Existing bookings remain unchanged.
create schema if not exists rental_private;
revoke all on schema rental_private from public;
-- New settings are restricted to the verified existing Miettool admin account.
-- No existing user roles, policies, or account records are changed.
create function rental_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid() and lower(email)='info@lehmann-gt.ch' and email_confirmed_at is not null and not coalesce(is_anonymous,false));
$$;
revoke all on function rental_private.is_admin() from public;
grant usage on schema rental_private to authenticated;
grant execute on function rental_private.is_admin() to authenticated;
create function public.rental_is_admin() returns boolean language sql stable security invoker set search_path='' as $$select rental_private.is_admin();$$;
revoke all on function public.rental_is_admin() from public,anon;
grant execute on function public.rental_is_admin() to authenticated;

create table public.product_locations(
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),
 address text not null default '' check(length(address)<=500),
 instructions text not null default '' check(length(instructions)<=2000),
 notification_email text not null default 'info@lehmann-gt.ch' check(length(notification_email)<=254 and notification_email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+[.][^[:space:]@,;<>]+$'),
 can_pickup boolean not null default true,
 can_return boolean not null default true,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 check(can_pickup or can_return)
);
create index product_locations_product_idx on public.product_locations(product_id);
alter table public.product_locations enable row level security;
revoke all on public.product_locations from anon,authenticated;
grant select(id,product_id,name,address,instructions,can_pickup,can_return,active) on public.product_locations to anon;
grant select,insert,update,delete on public.product_locations to authenticated;
grant all on public.product_locations to service_role;
create policy locations_public_read on public.product_locations for select to anon using(active and exists(select 1 from public.products p where p.id=product_id and p.active));
create policy locations_admin on public.product_locations for all to authenticated using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
create view public.public_rental_locations with(security_invoker=true) as
 select id,product_id,name,address,instructions,can_pickup,can_return from public.product_locations where active;
revoke all on public.public_rental_locations from public,anon,authenticated;
grant select on public.public_rental_locations to anon,authenticated,service_role;

create table public.rental_email_templates(
 key text primary key check(key in ('request_company','request_customer','confirmed','cancelled')),
 subject text not null check(length(trim(subject)) between 1 and 200 and subject !~ E'[\r\n]'),
 body text not null check(length(trim(body)) between 1 and 12000),
 updated_at timestamptz not null default now()
);
alter table public.rental_email_templates enable row level security;
revoke all on public.rental_email_templates from anon,authenticated;
grant select,insert,update on public.rental_email_templates to authenticated;
grant all on public.rental_email_templates to service_role;
create policy templates_admin on public.rental_email_templates for all to authenticated using((select rental_private.is_admin())) with check((select rental_private.is_admin()));

create table public.reservation_locations(
 reservation_id uuid primary key references public.reservations(id) on delete cascade,
 pickup jsonb,
 "return" jsonb
);
alter table public.reservation_locations enable row level security;
revoke all on public.reservation_locations from anon,authenticated;
grant select,insert,update on public.reservation_locations to authenticated;
grant all on public.reservation_locations to service_role;
create policy reservation_locations_admin on public.reservation_locations for all to authenticated using((select rental_private.is_admin())) with check((select rental_private.is_admin()));

-- Private helper freezes server-validated location details with each reservation.
create function rental_private.location_snapshot(p_product uuid,p_location uuid,p_kind text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.product_locations; has_options boolean;
begin
 select exists(select 1 from public.product_locations where product_id=p_product and active and case when p_kind='pickup' then can_pickup else can_return end) into has_options;
 if p_location is null then
   if has_options then raise exception 'Bitte einen gültigen Abhol- und Rückgabestandort wählen.';end if;
   return null;
 end if;
 select * into l from public.product_locations where id=p_location and product_id=p_product and active and case when p_kind='pickup' then can_pickup else can_return end for share;
 if not found then raise exception 'Der gewählte Standort ist für dieses Gerät nicht verfügbar.';end if;
 return jsonb_build_object('id',l.id,'name',l.name,'address',l.address,'instructions',l.instructions,'notification_email',l.notification_email);
end;$$;
revoke all on function rental_private.location_snapshot(uuid,uuid,text) from public;

create function rental_private.create_rental_request_v3(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_name text,p_company text,p_email text,p_phone text,p_address text,p_note text,p_long_term boolean,p_pickup_location uuid default null,p_return_location uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_res uuid; v_pickup jsonb; v_return jsonb;
begin
 if nullif(trim(p_email),'') is null or p_email !~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+[.][^[:space:]@,;<>]+$' then raise exception 'Bitte eine gültige E-Mailadresse angeben.';end if;
 if nullif(trim(p_name),'') is null or nullif(trim(p_phone),'') is null then raise exception 'Name und Telefonnummer sind erforderlich.';end if;
 if p_from is null or p_to is null or p_start_half is null or p_end_half is null then raise exception 'Ungültiger Mietzeitraum.';end if;
 if not exists(select 1 from public.products where id=p_product_id and active) then raise exception 'Mietgerät nicht verfügbar.';end if;
 v_pickup:=rental_private.location_snapshot(p_product_id,p_pickup_location,'pickup');
 v_return:=rental_private.location_snapshot(p_product_id,p_return_location,'return');
 v_res:=public.create_rental_request_v2(p_product_id,p_from,p_to,p_start_half,p_end_half,p_name,p_company,p_email,p_phone,p_address,p_note,p_long_term);
 if v_res is not null then insert into public.reservation_locations(reservation_id,pickup,"return") values(v_res,v_pickup,v_return);end if;
 return v_res;
end;$$;
revoke all on function rental_private.create_rental_request_v3 from public,anon,authenticated;
grant execute on function rental_private.create_rental_request_v3 to anon,authenticated;

create function rental_private.admin_create_rental_v3(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_name text,p_company text,p_email text,p_phone text,p_address text,p_note text,p_long_term boolean,p_status text,p_pickup_location uuid default null,p_return_location uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_res uuid; v_pickup jsonb; v_return jsonb;
begin
 if auth.uid() is null or not rental_private.is_admin() then raise exception 'Nicht autorisiert';end if;
 if nullif(trim(p_name),'') is null or nullif(trim(p_phone),'') is null then raise exception 'Name und Telefonnummer sind erforderlich.';end if;
 if p_from is null or p_to is null or p_start_half is null or p_end_half is null then raise exception 'Ungültiger Mietzeitraum.';end if;
 if not exists(select 1 from public.products where id=p_product_id and active) then raise exception 'Mietgerät nicht verfügbar.';end if;
 v_pickup:=rental_private.location_snapshot(p_product_id,p_pickup_location,'pickup');
 v_return:=rental_private.location_snapshot(p_product_id,p_return_location,'return');
 v_res:=public.admin_create_rental_v2(p_product_id,p_from,p_to,p_start_half,p_end_half,p_name,p_company,p_email,p_phone,p_address,p_note,p_long_term,p_status);
 if v_res is not null then insert into public.reservation_locations(reservation_id,pickup,"return") values(v_res,v_pickup,v_return);end if;
 return v_res;
end;$$;
revoke all on function rental_private.admin_create_rental_v3 from public,anon,authenticated;
grant execute on function rental_private.admin_create_rental_v3 to authenticated;

insert into public.rental_email_templates(key,subject,body) values
('request_company','Neue Mietanfrage: {{geraet}} · {{abholung}}','Eine neue Mietanfrage ist eingegangen.

Bitte prüfen Sie die Anfrage im Adminbereich:
{{admin_link}}'),
('request_customer','Ihre Mietanfrage – {{geraet}}','Guten Tag {{name}}

Besten Dank für Ihre Mietanfrage bei Lehmann Gerätetechnik GmbH.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH
{{kontakt_email}}'),
('confirmed','Mietreservation bestätigt – {{geraet}}','Guten Tag {{name}}

Ihre Mietreservation wurde von uns bestätigt.
Bei Fragen oder Änderungen erreichen Sie uns unter {{kontakt_email}}.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH'),
('cancelled','Mietanfrage / Reservation – {{geraet}}','Guten Tag {{name}}

Ihre Mietanfrage bzw. Reservation wurde abgelehnt bzw. storniert.
Falls Sie einen anderen Zeitraum oder ein alternatives Gerät wünschen, melden Sie sich gerne unter {{kontakt_email}}.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH');

create function public.create_rental_request_v3(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_name text,p_company text,p_email text,p_phone text,p_address text,p_note text,p_long_term boolean,p_pickup_location uuid default null,p_return_location uuid default null) returns uuid language sql security invoker set search_path='' as $$select rental_private.create_rental_request_v3(p_product_id,p_from,p_to,p_start_half,p_end_half,p_name,p_company,p_email,p_phone,p_address,p_note,p_long_term,p_pickup_location,p_return_location);$$;
revoke all on function public.create_rental_request_v3 from public,anon,authenticated;
grant execute on function public.create_rental_request_v3 to anon,authenticated;

create function public.admin_create_rental_v3(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_name text,p_company text,p_email text,p_phone text,p_address text,p_note text,p_long_term boolean,p_status text,p_pickup_location uuid default null,p_return_location uuid default null) returns uuid language sql security invoker set search_path='' as $$select rental_private.admin_create_rental_v3(p_product_id,p_from,p_to,p_start_half,p_end_half,p_name,p_company,p_email,p_phone,p_address,p_note,p_long_term,p_status,p_pickup_location,p_return_location);$$;
revoke all on function public.admin_create_rental_v3 from public,anon,authenticated;
grant execute on function public.admin_create_rental_v3 to authenticated;

grant usage on schema rental_private to anon;
