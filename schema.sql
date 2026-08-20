create extension if not exists pgcrypto;
create table if not exists products(id uuid primary key default gen_random_uuid(),slug text unique not null,category text not null,name text not null,subtitle text,day_price numeric(10,2) not null default 0,tier5_price numeric(10,2),tier20_price numeric(10,2),long_term boolean not null default false,image_url text,active boolean not null default true,sort_order integer not null default 100,created_at timestamptz not null default now());
create table if not exists units(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,internal_name text not null,serial_no text,active boolean not null default true,created_at timestamptz not null default now());
do $$ begin create type reservation_status as enum ('pending','confirmed','cancelled','blocked'); exception when duplicate_object then null; end $$;
create table if not exists reservations(id uuid primary key default gen_random_uuid(),unit_id uuid not null references units(id) on delete restrict,from_date date not null,to_date date not null,rental_mode text not null default 'full' check(rental_mode in ('full','half_am','half_pm')),status reservation_status not null default 'pending',admin_note text,created_at timestamptz not null default now(),constraint valid_period check(to_date>=from_date));
alter table reservations add column if not exists admin_note text;
create table if not exists reservation_customers(reservation_id uuid primary key references reservations(id) on delete cascade,name text not null,company text,email text not null,phone text not null,address text,note text,long_term boolean not null default false);
create or replace view products_with_quantity as select p.*,count(u.id) filter(where u.active) as quantity from products p left join units u on u.product_id=p.id group by p.id;
create or replace function rental_start(p_from date,p_mode text) returns timestamp language sql immutable as $$ select p_from::timestamp + case when p_mode='half_pm' then interval '12 hours' else interval '0 hours' end $$;
create or replace function rental_end(p_from date,p_to date,p_mode text) returns timestamp language sql immutable as $$ select case when p_mode='half_am' then p_from::timestamp+interval '12 hours' else (p_to+1)::timestamp end $$;
create or replace function available_quantity(p_product_id uuid,p_from date,p_to date,p_mode text) returns integer language sql stable security definer set search_path=public as $$ select count(*)::int from units u where u.product_id=p_product_id and u.active and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked') and rental_start(r.from_date,r.rental_mode)<rental_end(p_from,p_to,p_mode) and rental_end(r.from_date,r.to_date,r.rental_mode)>rental_start(p_from,p_mode)); $$;
create or replace function create_rental_request(p_product_id uuid,p_from date,p_to date,p_mode text,p_name text,p_company text,p_email text,p_phone text,p_address text,p_note text,p_long_term boolean) returns uuid language plpgsql security definer set search_path=public as $$ declare v_unit uuid;v_res uuid; begin if p_to<p_from then raise exception 'Ungültiger Mietzeitraum'; end if; select u.id into v_unit from units u where u.product_id=p_product_id and u.active and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked') and rental_start(r.from_date,r.rental_mode)<rental_end(p_from,p_to,p_mode) and rental_end(r.from_date,r.to_date,r.rental_mode)>rental_start(p_from,p_mode)) order by u.internal_name for update skip locked limit 1; if v_unit is null then return null; end if; insert into reservations(unit_id,from_date,to_date,rental_mode,status) values(v_unit,p_from,p_to,p_mode,'pending') returning id into v_res; insert into reservation_customers(reservation_id,name,company,email,phone,address,note,long_term) values(v_res,p_name,p_company,p_email,p_phone,p_address,p_note,p_long_term); return v_res; end; $$;
create or replace view admin_reservations as select r.id,r.from_date,r.to_date,r.rental_mode,r.status,r.created_at,u.internal_name,p.name as product_name,p.id as product_id,c.name,c.company,c.email,c.phone,c.address,coalesce(c.note,r.admin_note) as note,c.long_term from reservations r join units u on u.id=r.unit_id join products p on p.id=u.product_id left join reservation_customers c on c.reservation_id=r.id;

create or replace function create_rental_block(p_product_id uuid,p_from date,p_to date,p_mode text,p_note text) returns uuid language plpgsql security definer set search_path=public as $$ declare v_unit uuid;v_res uuid; begin if auth.role()<>'authenticated' then raise exception 'Nicht autorisiert'; end if; if p_to<p_from then raise exception 'Ungültiger Mietzeitraum'; end if; select u.id into v_unit from units u where u.product_id=p_product_id and u.active and not exists(select 1 from reservations r where r.unit_id=u.id and r.status in ('pending','confirmed','blocked') and rental_start(r.from_date,r.rental_mode)<rental_end(p_from,p_to,p_mode) and rental_end(r.from_date,r.to_date,r.rental_mode)>rental_start(p_from,p_mode)) order by u.internal_name for update skip locked limit 1; if v_unit is null then return null; end if; insert into reservations(unit_id,from_date,to_date,rental_mode,status,admin_note) values(v_unit,p_from,p_to,p_mode,'blocked',coalesce(nullif(p_note,''),'Interne Sperre')) returning id into v_res; return v_res; end; $$;

alter table products enable row level security;alter table units enable row level security;alter table reservations enable row level security;alter table reservation_customers enable row level security;
create policy "public products read" on products for select using(active=true);create policy "admin products all" on products for all to authenticated using(true) with check(true);create policy "admin units all" on units for all to authenticated using(true) with check(true);create policy "admin reservations all" on reservations for all to authenticated using(true) with check(true);create policy "admin customers all" on reservation_customers for all to authenticated using(true) with check(true);
grant select on products_with_quantity to anon,authenticated;grant execute on function available_quantity(uuid,date,date,text) to anon,authenticated;grant execute on function create_rental_request(uuid,date,date,text,text,text,text,text,text,text,boolean) to anon,authenticated;grant select on admin_reservations to authenticated;grant execute on function create_rental_block(uuid,date,date,text,text) to authenticated;
insert into products(slug,category,name,subtitle,day_price,tier5_price,tier20_price,long_term,image_url,sort_order) values
('vertikutierer','Gartengeräte','Vertikutierer','4-Takt Benzinmotor · 40 cm Arbeitsbreite',95,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/85/Eliet-e401-8549a162.jpeg',10),
('holzhaecksler','Gartengeräte','Holzhäcksler','4-Takt Benzinmotor · max. 45 mm Astdurchmesser',140,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/c8/eliet-country-c8efdb44.jpeg',20),
('heckenschere','Gartengeräte','Heckenschere','2-Takt Benzinmotor · 60 cm Messerlänge',80,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/f2/hs-82r-f223a6b9.jpeg',30),
('balkenmaeher','Gartengeräte','Balkenmäher','4-Takt Benzinmotor · 120 cm Arbeitsbreite',150,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/1f/koeppl-500er-1fa8a247.jpeg',40),
('bodenfraese','Gartengeräte','Bodenfräse','4-Takt Benzinmotor · 50 cm Arbeitsbreite',150,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/d6/koeppl-fraeseII-d67fd786.jpeg',50),
('motorhacke','Gartengeräte','Motorhacke','4-Takt Benzinmotor · 40 cm Arbeitsbreite · 1V/1R',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/7b/0700-7b136b84.jpeg',60),
('motorsaege-462','Gartengeräte','Motorsäge 50 cm','2-Takt Benzinmotor · 50 cm Schwert',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/fe/Stihl_MS362C-M-fea01e26.jpeg',70),
('motorsaege-211','Gartengeräte','Motorsäge 35 cm','2-Takt Benzinmotor · 35 cm Schwert',60,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/12/ms162-1226cbca.jpeg',80),
('stabheckenschere','Gartengeräte','Stabheckenschere','inkl. Motoreinheit · 50 cm Messer · 135° schwenkbar',70,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/3d/hl94c-e_4-3de4a3b7.jpeg',90),
('fadenmaeher','Gartengeräte','Fadenmäher','inkl. Motoreinheit · Halbautomat-Fadenkopf',50,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/ca/fs94r-ca8b8f10.jpeg',100),
('motorsense','Gartengeräte','Rücktragbare Motorsense','2-Takt Benzinmotor · Fadenkopf oder Dickichtmesser',80,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/9f/fr480-9fd8d9bd.jpeg',110),
('plattenvibrator','Baugeräte','Plattenvibrator','4-Takt Benzinmotor · 36 cm · 83 kg',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/0e/bvp-10-36-0e400188.jpeg',120),
('erdbohrer','Baugeräte','Erdbohrer','Bohrer 40/90/150/250 mm',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/93/STIHL_BT_130-101-81-93ae5991.jpeg',130),
('hochdruckreiniger','Baugeräte','Hochdruckreiniger','230 V · 115 bar · 500 l/h',70,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/ae/hd5-12cxplus-fr-2-ac2db799-ae6de96a.jpeg',140),
('tauchpumpe','Baugeräte','Tauchpumpe','230 V · 9600 l/h',75,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/9c/citypump-9cd77a2f.jpeg',150),
('holzspalter','Diverse Geräte','Holzspalter','380 V · 6 Tonnen',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/25/Bindeberger-258f34b8.jpeg',160),
('unkrautbuerste','Diverse Geräte','Unkrautbürste','56 V Akku · 35 cm · inkl. 3 Zopfbürsten',90,null,null,false,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/1d/as-weedhex-1dabfa55.jpeg',170),
('honda-eu20i','Generatoren','Honda EU20i','1.6 / 2.0 kVA · 230 V · Benzin · Inverter',50,40,30,true,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/2f/23_1390_02-2f8ff4c4.jpeg',180),
('cgm-cx7000t','Generatoren','CGM CX7000T','7 kVA · 230/400 V · Benzin · AVR',150,120,90,true,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/e6/cx7000t_auspuff_seitlich-e6d9c2bb.jpeg',190),
('cgm-v18y','Generatoren','CGM V18Y','18 kVA · 230/400 V · Diesel · inkl. Transportanhänger',250,200,160,true,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/b7/CGM-10kVA-Industrial-b72de830.jpeg',200),
('cgm-v60f','Generatoren','CGM V60F','60 kVA · 230/400 V · Diesel · exkl. Transport & Zubehör',490,392,294,true,'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/35/CGM-60kVA-Rental-357aca0b.jpeg',210)
on conflict(slug) do update set category=excluded.category,name=excluded.name,subtitle=excluded.subtitle,day_price=excluded.day_price,tier5_price=excluded.tier5_price,tier20_price=excluded.tier20_price,long_term=excluded.long_term,image_url=excluded.image_url,sort_order=excluded.sort_order;
insert into units(product_id,internal_name) select id,name||' #01' from products p where not exists(select 1 from units u where u.product_id=p.id);
insert into units(product_id,internal_name) select id,name||' #02' from products p where slug='vertikutierer' and (select count(*) from units u where u.product_id=p.id)<2;

-- Version 4: Protokoll für automatische E-Mail-Benachrichtigungen
create table if not exists email_events(
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  event_type text not null check(event_type in ('request','confirmed','cancelled')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(reservation_id,event_type)
);
alter table email_events enable row level security;
-- Kein öffentlicher Direktzugriff. Die Edge Function arbeitet serverseitig mit dem Service-Role-Key.

-- Version 5: sichere Verwaltung von Mietgeräten und Bestand im Adminbereich
-- Dieses Upgrade löscht oder verändert keine bestehenden Reservationen.
create or replace function admin_save_product(
  p_id uuid,
  p_category text,
  p_name text,
  p_subtitle text,
  p_day_price numeric,
  p_tier5_price numeric,
  p_tier20_price numeric,
  p_long_term boolean,
  p_image_url text,
  p_active boolean,
  p_sort_order integer,
  p_quantity integer
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_id uuid;
  v_slug text;
  v_current integer;
  v_reduce integer;
begin
  if auth.role()<>'authenticated' then raise exception 'Nicht autorisiert'; end if;
  if nullif(trim(p_name),'') is null or nullif(trim(p_category),'') is null then raise exception 'Name und Kategorie sind erforderlich'; end if;
  if coalesce(p_day_price,-1)<0 then raise exception 'Ungültiger Tagespreis'; end if;
  if coalesce(p_quantity,-1)<0 then raise exception 'Ungültiger Bestand'; end if;

  if p_id is null then
    v_slug := lower(regexp_replace(regexp_replace(translate(trim(p_name),'ÄÖÜäöüÉÈéèÀÁàáÇç','AOUaouEEeeAAaaCc'),'[^a-zA-Z0-9]+','-','g'),'^-|-$','','g'));
    if v_slug='' then v_slug:='mietgeraet'; end if;
    if exists(select 1 from products where slug=v_slug) then v_slug:=v_slug||'-'||substr(gen_random_uuid()::text,1,8); end if;
    insert into products(slug,category,name,subtitle,day_price,tier5_price,tier20_price,long_term,image_url,active,sort_order)
      values(v_slug,trim(p_category),trim(p_name),nullif(trim(p_subtitle),''),p_day_price,p_tier5_price,p_tier20_price,coalesce(p_long_term,false),nullif(trim(p_image_url),''),coalesce(p_active,true),coalesce(p_sort_order,100)) returning id into v_id;
  else
    if not exists(select 1 from products where id=p_id) then raise exception 'Mietgerät nicht gefunden'; end if;
    update products set category=trim(p_category),name=trim(p_name),subtitle=nullif(trim(p_subtitle),''),day_price=p_day_price,tier5_price=p_tier5_price,tier20_price=p_tier20_price,long_term=coalesce(p_long_term,false),image_url=nullif(trim(p_image_url),''),active=coalesce(p_active,true),sort_order=coalesce(p_sort_order,100) where id=p_id;
    v_id:=p_id;
  end if;

  select count(*)::int into v_current from units where product_id=v_id and active;
  if p_quantity>v_current then
    for i in (v_current+1)..p_quantity loop
      insert into units(product_id,internal_name) values(v_id,trim(p_name)||' #'||lpad(i::text,2,'0'));
    end loop;
  elsif p_quantity<v_current then
    v_reduce:=v_current-p_quantity;
    update units u set active=false where u.id in (
      select u2.id from units u2 where u2.product_id=v_id and u2.active
      and not exists(select 1 from reservations r where r.unit_id=u2.id and r.status in ('pending','confirmed','blocked'))
      order by u2.created_at desc limit v_reduce
    );
    select count(*)::int into v_current from units where product_id=v_id and active;
    if v_current>p_quantity then raise exception 'Bestand kann nicht auf % reduziert werden: % Exemplar(e) sind durch Reservationen oder Sperren gebunden.',p_quantity,v_current-p_quantity; end if;
  end if;
  return v_id;
end; $$;
grant execute on function admin_save_product(uuid,text,text,text,numeric,numeric,numeric,boolean,text,boolean,integer,integer) to authenticated;
