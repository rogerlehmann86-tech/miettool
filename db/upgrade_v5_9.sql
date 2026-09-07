-- v5.9: explicitly assigned sublessors; default admin rights no longer follow any login.
create table public.rental_partners(
 id uuid primary key default gen_random_uuid(),
 user_id uuid unique references auth.users(id) on delete set null,
 company text not null check(length(trim(company)) between 1 and 160),
 email text not null unique check(email=lower(trim(email)) and email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+[.][^[:space:]@,;<>]+$'),
 notification_email text not null check(notification_email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+[.][^[:space:]@,;<>]+$'),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.rental_partner_devices(
 partner_id uuid not null references public.rental_partners(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 primary key(partner_id,product_id)
);
create index rental_partner_devices_product_idx on public.rental_partner_devices(product_id);
alter table public.rental_partners enable row level security;
alter table public.rental_partner_devices enable row level security;
revoke all on public.rental_partners,public.rental_partner_devices from anon,authenticated;
grant select,insert,update,delete on public.rental_partners,public.rental_partner_devices to authenticated;
grant all on public.rental_partners,public.rental_partner_devices to service_role;
create policy partners_admin on public.rental_partners for all to authenticated using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
create policy partner_devices_admin on public.rental_partner_devices for all to authenticated using((select rental_private.is_admin())) with check((select rental_private.is_admin()));

create function rental_private.partner_id() returns uuid language sql stable security definer set search_path='' as $$
 select p.id from public.rental_partners p join auth.users u on u.id=p.user_id
 where p.user_id=auth.uid() and p.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false);
$$;
create function rental_private.partner_has_product(p_product uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.rental_partner_devices d where d.partner_id=rental_private.partner_id() and d.product_id=p_product);
$$;
revoke all on function rental_private.partner_id(),rental_private.partner_has_product(uuid) from public,anon;
grant execute on function rental_private.partner_id(),rental_private.partner_has_product(uuid) to authenticated;
create function public.rental_access_role() returns text language sql stable security invoker set search_path='' as $$
 select case when rental_private.is_admin() then 'admin' when rental_private.partner_id() is not null then 'sublessor' else 'none' end;
$$;
revoke all on function public.rental_access_role() from public,anon;
grant execute on function public.rental_access_role() to authenticated;

-- Preserve the current administrator; restrict every previous all-login admin policy.
alter policy "admin products all" on public.products using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
alter policy "admin units all" on public.units using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
alter policy "admin reservations all" on public.reservations using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
alter policy "admin customers all" on public.reservation_customers using((select rental_private.is_admin())) with check((select rental_private.is_admin()));
alter view public.admin_reservations set(security_invoker=true);
revoke all on public.admin_reservations from public,anon;
grant select on public.admin_reservations to authenticated,service_role;
alter policy "Angemeldete Benutzer laden Mietbilder hoch" on storage.objects with check(bucket_id='rental-product-images' and (select rental_private.is_admin()));
alter policy "Angemeldete Benutzer löschen Mietbilder" on storage.objects using(bucket_id='rental-product-images' and (select rental_private.is_admin()));
alter policy "Angemeldete Benutzer ändern Mietbilder" on storage.objects using(bucket_id='rental-product-images' and (select rental_private.is_admin())) with check(bucket_id='rental-product-images' and (select rental_private.is_admin()));

alter table public.reservations add column blocked_by uuid references auth.users(id) on delete set null;
create index reservations_blocked_by_idx on public.reservations(blocked_by) where blocked_by is not null;
create table public.rental_direct_notifications(
 reservation_id uuid primary key references public.reservations(id) on delete cascade,
 created_at timestamptz not null default now(),sent_at timestamptz,last_error text
);
alter table public.rental_direct_notifications enable row level security;
revoke all on public.rental_direct_notifications from anon,authenticated;
grant select on public.rental_direct_notifications to authenticated;
grant all on public.rental_direct_notifications to service_role;
create policy direct_notifications_admin on public.rental_direct_notifications for select to authenticated using((select rental_private.is_admin()));

create function rental_private.partner_inventory() returns table(id uuid,name text,category text,image_url text,quantity bigint)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or rental_private.partner_id() is null then raise exception 'Kein Untervermieter-Zugang';end if;
 return query select p.id,p.name,p.category,p.image_url,count(u.id) filter(where u.active)
 from public.products p join public.rental_partner_devices d on d.product_id=p.id and d.partner_id=rental_private.partner_id()
 left join public.units u on u.product_id=p.id where p.active group by p.id order by p.name;
end;$$;
create function rental_private.partner_calendar(p_product_id uuid,p_from date,p_days integer default 14)
returns table(calendar_date date,am_available integer,pm_available integer) language plpgsql stable security definer set search_path='' as $$
begin
 if not rental_private.partner_has_product(p_product_id) then raise exception 'Gerät nicht zugeteilt';end if;
 return query select * from public.public_product_calendar_v2(p_product_id,p_from,p_days);
end;$$;
create function rental_private.partner_blocks() returns table(id uuid,product_id uuid,product_name text,from_date date,to_date date,start_half text,end_half text,note text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or rental_private.partner_id() is null then raise exception 'Kein Untervermieter-Zugang';end if;
 return query select r.id,u.product_id,p.name,r.from_date,r.to_date,r.start_half,r.end_half,r.admin_note
 from public.reservations r join public.units u on u.id=r.unit_id join public.products p on p.id=u.product_id
 where r.status='blocked' and r.blocked_by=auth.uid() and rental_private.partner_has_product(u.product_id) order by r.from_date;
end;$$;
create function rental_private.partner_create_block(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_unit uuid;v_res uuid;v_mode text;
begin
 if auth.uid() is null or not rental_private.partner_has_product(p_product_id) then raise exception 'Gerät nicht zugeteilt';end if;
 if not exists(select 1 from public.products where id=p_product_id and active) then raise exception 'Gerät inaktiv';end if;
 if p_from is null or p_to is null or p_start_half is null or p_end_half is null or p_to<p_from or p_start_half not in ('am','pm') or p_end_half not in ('am','pm') or public.rental_start_v2(p_from,p_start_half)>=public.rental_end_v2(p_to,p_end_half) then raise exception 'Ungültiger Mietzeitraum';end if;
 if length(coalesce(p_note,''))>500 then raise exception 'Hinweis maximal 500 Zeichen';end if;
 select u.id into v_unit from public.units u where u.product_id=p_product_id and u.active
 and not exists(select 1 from public.reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked') and public.rental_start_v2(r.from_date,r.start_half)<public.rental_end_v2(p_to,p_end_half) and public.rental_end_v2(r.to_date,r.end_half)>public.rental_start_v2(p_from,p_start_half))
 order by u.internal_name for update skip locked limit 1;
 if v_unit is null then return null;end if;
 v_mode:=case when p_from=p_to and p_start_half=p_end_half then case when p_start_half='am' then 'half_am' else 'half_pm' end else 'full' end;
 insert into public.reservations(unit_id,from_date,to_date,start_half,end_half,rental_mode,status,admin_note,blocked_by)
 values(v_unit,p_from,p_to,p_start_half,p_end_half,v_mode,'blocked','Eigennutzung Untervermieter: '||coalesce(nullif(trim(p_note),''),'ohne weiteren Hinweis'),auth.uid()) returning public.reservations.id into v_res;
 return v_res;
end;$$;
create function rental_private.partner_remove_block(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Nicht angemeldet';end if;
 delete from public.reservations r using public.units u where r.id=p_id and r.unit_id=u.id and r.status='blocked' and r.blocked_by=auth.uid() and rental_private.partner_has_product(u.product_id);
 if not found then raise exception 'Diese Sperre darf nicht aufgehoben werden';end if;
 return true;
end;$$;
-- Atomic assignment replaces avoid partially saved permissions.
create function rental_private.admin_save_partner(p_id uuid,p_company text,p_email text,p_notification_email text,p_active boolean,p_products uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_user uuid;
begin
 if auth.uid() is null or not rental_private.is_admin() then raise exception 'Keine Adminberechtigung';end if;
 if lower(trim(p_email))='info@lehmann-gt.ch' then raise exception 'Das Admin-Konto kann kein Untervermieter sein';end if;
 if p_active is null then raise exception 'Aktivstatus erforderlich';end if;
 if p_id is not null and not exists(select 1 from public.rental_partners where id=p_id) then raise exception 'Untervermieter nicht gefunden';end if;
 select id into v_user from auth.users where lower(email)=lower(trim(p_email)) and not coalesce(is_anonymous,false);
 if p_id is null then
 insert into public.rental_partners(company,email,notification_email,active,user_id) values(trim(p_company),lower(trim(p_email)),lower(trim(p_notification_email)),p_active,v_user) returning id into v_id;
 else
 update public.rental_partners set company=trim(p_company),email=lower(trim(p_email)),notification_email=lower(trim(p_notification_email)),active=p_active,user_id=v_user where id=p_id returning id into v_id;
 end if;
 delete from public.rental_partner_devices where partner_id=v_id;
 insert into public.rental_partner_devices(partner_id,product_id) select v_id,unnest(coalesce(p_products,'{}'::uuid[])) on conflict do nothing;
 return v_id;
end;$$;

alter table public.rental_email_templates drop constraint rental_email_templates_key_check;
alter table public.rental_email_templates add constraint rental_email_templates_key_check check(key in ('request_company','request_customer','confirmed','cancelled','direct_company'));
insert into public.rental_email_templates(key,subject,body) values('direct_company','Direkterfassung: {{geraet}} · {{status}}',E'Eine Vermietung wurde durch Lehmann Gerätetechnik direkt erfasst.\n\nStatus: {{status}}\nBitte berücksichtigen Sie diesen Zeitraum bei der Geräteplanung.\n\nZugang: {{admin_link}}');

-- Secure legacy administrative entry points before any partner account is enabled.
CREATE OR REPLACE FUNCTION public.admin_create_rental(p_product_id uuid, p_from date, p_to date, p_mode text, p_name text, p_company text, p_email text, p_phone text, p_address text, p_note text, p_long_term boolean, p_status text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_unit uuid;
  v_res uuid;
  v_status reservation_status;
begin
  if auth.uid() is null or not rental_private.is_admin() then
    raise exception 'Nicht autorisiert';
  end if;

  if p_to<p_from then
    raise exception 'Ungültiger Mietzeitraum';
  end if;

  if p_mode not in ('full','half_am','half_pm') then
    raise exception 'Ungültige Mietdauer';
  end if;

  if nullif(trim(p_name),'') is null then
    raise exception 'Kunde / Name ist erforderlich';
  end if;

  if nullif(trim(p_phone),'') is null then
    raise exception 'Telefonnummer ist erforderlich';
  end if;

  if p_status not in ('pending','confirmed') then
    raise exception 'Ungültiger Status';
  end if;

  v_status := p_status::reservation_status;

  select u.id into v_unit
  from units u
  where u.product_id=p_product_id
    and u.active
    and not exists(
      select 1
      from reservations r
      where r.unit_id=u.id
        and r.status in ('pending','confirmed','blocked')
        and rental_start(r.from_date,r.rental_mode)<rental_end(p_from,p_to,p_mode)
        and rental_end(r.from_date,r.to_date,r.rental_mode)>rental_start(p_from,p_mode)
    )
  order by u.internal_name
  for update skip locked
  limit 1;

  if v_unit is null then
    return null;
  end if;

  insert into reservations(unit_id,from_date,to_date,rental_mode,status)
  values(v_unit,p_from,p_to,p_mode,v_status)
  returning id into v_res;

  insert into reservation_customers(
    reservation_id,name,company,email,phone,address,note,long_term
  ) values(
    v_res,
    trim(p_name),
    nullif(trim(p_company),''),
    nullif(trim(p_email),''),
    trim(p_phone),
    nullif(trim(p_address),''),
    nullif(trim(p_note),''),
    coalesce(p_long_term,false)
  );

  insert into public.rental_direct_notifications(reservation_id) values(v_res) on conflict do nothing;
  return v_res;
end;
$function$;

revoke all on function public.admin_create_rental from public,anon;
grant execute on function public.admin_create_rental to authenticated;
CREATE OR REPLACE FUNCTION public.admin_create_rental_v2(p_product_id uuid, p_from date, p_to date, p_start_half text, p_end_half text, p_name text, p_company text, p_email text, p_phone text, p_address text, p_note text, p_long_term boolean, p_status text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_unit uuid;v_res uuid;v_status reservation_status;v_mode text;
begin
  if auth.uid() is null or not rental_private.is_admin() then raise exception 'Nicht autorisiert'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Kunde / Name ist erforderlich'; end if;
  if nullif(trim(p_phone),'') is null then raise exception 'Telefonnummer ist erforderlich'; end if;
  if p_status not in ('pending','confirmed') then raise exception 'Ungültiger Status'; end if;
  if p_to<p_from or p_start_half not in ('am','pm') or p_end_half not in ('am','pm')
     or rental_start_v2(p_from,p_start_half)>=rental_end_v2(p_to,p_end_half) then raise exception 'Ungültiger Mietzeitraum'; end if;
  v_status:=p_status::reservation_status;
  v_mode:=case when p_from=p_to and p_start_half='am' and p_end_half='am' then 'half_am'
               when p_from=p_to and p_start_half='pm' and p_end_half='pm' then 'half_pm' else 'full' end;
  select u.id into v_unit from units u where u.product_id=p_product_id and u.active
    and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked')
      and rental_start_v2(r.from_date,r.start_half)<rental_end_v2(p_to,p_end_half)
      and rental_end_v2(r.to_date,r.end_half)>rental_start_v2(p_from,p_start_half))
    order by u.internal_name for update skip locked limit 1;
  if v_unit is null then return null; end if;
  insert into reservations(unit_id,from_date,to_date,rental_mode,start_half,end_half,status)
    values(v_unit,p_from,p_to,v_mode,p_start_half,p_end_half,v_status) returning id into v_res;
  insert into reservation_customers(reservation_id,name,company,email,phone,address,note,long_term)
    values(v_res,trim(p_name),nullif(trim(p_company),''),nullif(trim(p_email),''),trim(p_phone),nullif(trim(p_address),''),nullif(trim(p_note),''),coalesce(p_long_term,false));
  insert into public.rental_direct_notifications(reservation_id) values(v_res) on conflict do nothing;
  return v_res;
end; $function$;

revoke all on function public.admin_create_rental_v2 from public,anon;
grant execute on function public.admin_create_rental_v2 to authenticated;
CREATE OR REPLACE FUNCTION public.admin_save_product(p_id uuid, p_category text, p_name text, p_subtitle text, p_day_price numeric, p_tier5_price numeric, p_tier20_price numeric, p_long_term boolean, p_image_url text, p_active boolean, p_sort_order integer, p_quantity integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_slug text;
  v_current integer;
  v_reduce integer;
begin
  if auth.uid() is null or not rental_private.is_admin() then
    raise exception 'Nicht autorisiert';
  end if;

  if nullif(trim(p_name),'') is null
     or nullif(trim(p_category),'') is null then
    raise exception 'Name und Kategorie sind erforderlich';
  end if;

  if coalesce(p_day_price,-1)<0 then
    raise exception 'Ungültiger Tagespreis';
  end if;

  if coalesce(p_quantity,-1)<0 then
    raise exception 'Ungültiger Bestand';
  end if;

  if p_id is null then

    v_slug := lower(
      regexp_replace(
        regexp_replace(
          translate(
            trim(p_name),
            'ÄÖÜäöüÉÈéèÀÁàáÇç',
            'AOUaouEEeeAAaaCc'
          ),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '^-|-$',
        '',
        'g'
      )
    );

    if v_slug='' then
      v_slug:='mietgeraet';
    end if;

    if exists(select 1 from products where slug=v_slug) then
      v_slug:=v_slug||'-'||substr(gen_random_uuid()::text,1,8);
    end if;

    insert into products(
      slug,
      category,
      name,
      subtitle,
      day_price,
      tier5_price,
      tier20_price,
      long_term,
      image_url,
      active,
      sort_order
    )
    values(
      v_slug,
      trim(p_category),
      trim(p_name),
      nullif(trim(p_subtitle),''),
      p_day_price,
      p_tier5_price,
      p_tier20_price,
      coalesce(p_long_term,false),
      nullif(trim(p_image_url),''),
      coalesce(p_active,true),
      coalesce(p_sort_order,100)
    )
    returning id into v_id;

  else

    if not exists(select 1 from products where id=p_id) then
      raise exception 'Mietgerät nicht gefunden';
    end if;

    update products
    set
      category=trim(p_category),
      name=trim(p_name),
      subtitle=nullif(trim(p_subtitle),''),
      day_price=p_day_price,
      tier5_price=p_tier5_price,
      tier20_price=p_tier20_price,
      long_term=coalesce(p_long_term,false),
      image_url=nullif(trim(p_image_url),''),
      active=coalesce(p_active,true),
      sort_order=coalesce(p_sort_order,100)
    where id=p_id;

    v_id:=p_id;

  end if;

  select count(*)::int
  into v_current
  from units
  where product_id=v_id
    and active;

  if p_quantity>v_current then

    for i in (v_current+1)..p_quantity loop
      insert into units(product_id,internal_name)
      values(
        v_id,
        trim(p_name)||' #'||lpad(i::text,2,'0')
      );
    end loop;

  elsif p_quantity<v_current then

    v_reduce:=v_current-p_quantity;

    update units u
    set active=false
    where u.id in (
      select u2.id
      from units u2
      where u2.product_id=v_id
        and u2.active
        and not exists(
          select 1
          from reservations r
          where r.unit_id=u2.id
            and r.status in ('pending','confirmed','blocked')
        )
      order by u2.created_at desc
      limit v_reduce
    );

    select count(*)::int
    into v_current
    from units
    where product_id=v_id
      and active;

    if v_current>p_quantity then
      raise exception
        'Bestand kann nicht auf % reduziert werden: % Exemplar(e) sind durch Reservationen oder Sperren gebunden.',
        p_quantity,
        v_current-p_quantity;
    end if;

  end if;

  return v_id;
end;
$function$;

revoke all on function public.admin_save_product from public,anon;
grant execute on function public.admin_save_product to authenticated;
CREATE OR REPLACE FUNCTION public.create_rental_block(p_product_id uuid, p_from date, p_to date, p_mode text, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_unit uuid;v_res uuid; begin if auth.uid() is null or not rental_private.is_admin() then raise exception 'Nicht autorisiert'; end if; if p_to<p_from then raise exception 'Ungültiger Mietzeitraum'; end if; select u.id into v_unit from units u where u.product_id=p_product_id and u.active and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked') and rental_start(r.from_date,r.rental_mode)<rental_end(p_from,p_to,p_mode) and rental_end(r.from_date,r.to_date,r.rental_mode)>rental_start(p_from,p_mode)) order by u.internal_name for update skip locked limit 1; if v_unit is null then return null; end if; insert into reservations(unit_id,from_date,to_date,rental_mode,status,admin_note) values(v_unit,p_from,p_to,p_mode,'blocked',coalesce(nullif(p_note,''),'Interne Sperre')) returning id into v_res; return v_res; end; $function$;

revoke all on function public.create_rental_block from public,anon;
grant execute on function public.create_rental_block to authenticated;
CREATE OR REPLACE FUNCTION public.create_rental_block_v2(p_product_id uuid, p_from date, p_to date, p_start_half text, p_end_half text, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_unit uuid;v_res uuid;v_mode text;
begin
  if auth.uid() is null or not rental_private.is_admin() then raise exception 'Nicht autorisiert'; end if;
  if p_to<p_from or p_start_half not in ('am','pm') or p_end_half not in ('am','pm')
     or rental_start_v2(p_from,p_start_half)>=rental_end_v2(p_to,p_end_half) then raise exception 'Ungültiger Mietzeitraum'; end if;
  v_mode:=case when p_from=p_to and p_start_half='am' and p_end_half='am' then 'half_am'
               when p_from=p_to and p_start_half='pm' and p_end_half='pm' then 'half_pm' else 'full' end;
  select u.id into v_unit from units u where u.product_id=p_product_id and u.active
    and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked')
      and rental_start_v2(r.from_date,r.start_half)<rental_end_v2(p_to,p_end_half)
      and rental_end_v2(r.to_date,r.end_half)>rental_start_v2(p_from,p_start_half))
    order by u.internal_name for update skip locked limit 1;
  if v_unit is null then return null; end if;
  insert into reservations(unit_id,from_date,to_date,rental_mode,start_half,end_half,status,admin_note)
    values(v_unit,p_from,p_to,v_mode,p_start_half,p_end_half,'blocked',coalesce(nullif(p_note,''),'Interne Sperre')) returning id into v_res;
  return v_res;
end; $function$;

revoke all on function public.create_rental_block_v2 from public,anon;
grant execute on function public.create_rental_block_v2 to authenticated;

revoke all on function rental_private.partner_inventory from public,anon,authenticated;
grant execute on function rental_private.partner_inventory to authenticated;
create function public.partner_inventory() returns table(id uuid,name text,category text,image_url text,quantity bigint) language sql security invoker set search_path='' as $$select * from rental_private.partner_inventory();$$;
revoke all on function public.partner_inventory from public,anon;
grant execute on function public.partner_inventory to authenticated;

revoke all on function rental_private.partner_calendar from public,anon,authenticated;
grant execute on function rental_private.partner_calendar to authenticated;
create function public.partner_calendar(p_product_id uuid,p_from date,p_days integer default 14) returns table(calendar_date date,am_available integer,pm_available integer) language sql security invoker set search_path='' as $$select * from rental_private.partner_calendar(p_product_id,p_from,p_days);$$;
revoke all on function public.partner_calendar from public,anon;
grant execute on function public.partner_calendar to authenticated;

revoke all on function rental_private.partner_blocks from public,anon,authenticated;
grant execute on function rental_private.partner_blocks to authenticated;
create function public.partner_blocks() returns table(id uuid,product_id uuid,product_name text,from_date date,to_date date,start_half text,end_half text,note text) language sql security invoker set search_path='' as $$select * from rental_private.partner_blocks();$$;
revoke all on function public.partner_blocks from public,anon;
grant execute on function public.partner_blocks to authenticated;

revoke all on function rental_private.partner_create_block from public,anon,authenticated;
grant execute on function rental_private.partner_create_block to authenticated;
create function public.partner_create_block(p_product_id uuid,p_from date,p_to date,p_start_half text,p_end_half text,p_note text) returns uuid language sql security invoker set search_path='' as $$select rental_private.partner_create_block(p_product_id,p_from,p_to,p_start_half,p_end_half,p_note);$$;
revoke all on function public.partner_create_block from public,anon;
grant execute on function public.partner_create_block to authenticated;

revoke all on function rental_private.partner_remove_block from public,anon,authenticated;
grant execute on function rental_private.partner_remove_block to authenticated;
create function public.partner_remove_block(p_id uuid) returns boolean language sql security invoker set search_path='' as $$select rental_private.partner_remove_block(p_id);$$;
revoke all on function public.partner_remove_block from public,anon;
grant execute on function public.partner_remove_block to authenticated;

revoke all on function rental_private.admin_save_partner from public,anon,authenticated;
grant execute on function rental_private.admin_save_partner to authenticated;
create function public.admin_save_partner(p_id uuid,p_company text,p_email text,p_notification_email text,p_active boolean,p_products uuid[]) returns uuid language sql security invoker set search_path='' as $$select rental_private.admin_save_partner(p_id,p_company,p_email,p_notification_email,p_active,p_products);$$;
revoke all on function public.admin_save_partner from public,anon;
grant execute on function public.admin_save_partner to authenticated;

