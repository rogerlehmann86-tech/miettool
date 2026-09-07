-- Explicitly approved partner contact access and pending-request decisions.
-- Partner request inbox. Raw reservation/customer tables remain admin-only.
create or replace function rental_private.partner_can_manage_reservation(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.reservations r join public.units u on u.id=r.unit_id
  where r.id=p_id and r.status<>'blocked' and rental_private.partner_has_product(u.product_id)
 );
$$;
create or replace function public.partner_can_manage_reservation(p_id uuid) returns boolean
language sql stable security invoker set search_path='' as $$ select rental_private.partner_can_manage_reservation(p_id); $$;

create or replace function rental_private.partner_reservations() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if rental_private.partner_id() is null then raise exception 'Kein Untervermieter-Zugang'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
  'id',r.id,'product_name',r.product_name,'from_date',r.from_date,'to_date',r.to_date,
  'start_half',r.start_half,'end_half',r.end_half,'status',r.status,
  'name',r.name,'company',r.company,'email',r.email,'phone',r.phone,'address',r.address,'note',r.note,
  'pickup',l.pickup - 'notification_email','return',l."return" - 'notification_email',
  'email_sent',exists(select 1 from public.email_events e where e.reservation_id=r.id and e.event_type=r.status::text and e.sent_at is not null)
 ) order by (r.status='pending') desc,r.created_at desc)
 from public.admin_reservations r left join public.reservation_locations l on l.reservation_id=r.id
 where r.status<>'blocked' and rental_private.partner_has_product(r.product_id)), '[]'::jsonb);
end $$;
create or replace function public.partner_reservations() returns jsonb language sql stable security invoker set search_path='' as $$ select rental_private.partner_reservations(); $$;

create or replace function rental_private.partner_set_reservation_status(p_id uuid,p_status text) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not rental_private.partner_can_manage_reservation(p_id) then raise exception 'Keine Berechtigung für diese Anfrage'; end if;
 if p_status='confirmed' then
  update public.reservations set status='confirmed' where id=p_id and status='pending';
 elsif p_status='cancelled' then
  update public.reservations set status='cancelled' where id=p_id and status='pending';
 else raise exception 'Ungültiger Status'; end if;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Diese Anfrage wurde bereits bearbeitet. Bitte aktualisieren.'; end if;
 return true;
end $$;
create or replace function public.partner_set_reservation_status(p_id uuid,p_status text) returns boolean
language sql security invoker set search_path='' as $$ select rental_private.partner_set_reservation_status(p_id,p_status); $$;
revoke all on function rental_private.partner_can_manage_reservation(uuid),public.partner_can_manage_reservation(uuid),rental_private.partner_reservations(),public.partner_reservations(),rental_private.partner_set_reservation_status(uuid,text),public.partner_set_reservation_status(uuid,text) from public,anon;
grant execute on function rental_private.partner_can_manage_reservation(uuid),public.partner_can_manage_reservation(uuid),rental_private.partner_reservations(),public.partner_reservations(),rental_private.partner_set_reservation_status(uuid,text),public.partner_set_reservation_status(uuid,text) to authenticated;

