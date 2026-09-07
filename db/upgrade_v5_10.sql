-- Read-only assigned-device requests; no customer data or new write permissions.
create function rental_private.partner_reservations() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if rental_private.partner_id() is null then raise exception 'Kein Untervermieter-Zugang'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
  'id',r.id,'product_name',p.name,'from_date',r.from_date,'to_date',r.to_date,
  'start_half',r.start_half,'end_half',r.end_half,'status',r.status
 ) order by (r.status='pending') desc,r.created_at desc)
 from public.reservations r join public.units u on u.id=r.unit_id join public.products p on p.id=u.product_id
 where r.status<>'blocked' and rental_private.partner_has_product(u.product_id)), '[]'::jsonb);
end $$;
create function public.partner_reservations() returns jsonb language sql stable security invoker set search_path='' as $$ select rental_private.partner_reservations(); $$;
revoke all on function rental_private.partner_reservations(),public.partner_reservations() from public,anon;
grant execute on function rental_private.partner_reservations(),public.partner_reservations() to authenticated;

-- Update only unchanged standard templates; preserve edited texts.
update public.rental_email_templates set body='Guten Tag {{name}}

Besten Dank für Ihre Mietanfrage.

Freundliche Grüsse
{{vermieter}}',updated_at=now() where key='request_customer' and body='Guten Tag {{name}}

Besten Dank für Ihre Mietanfrage bei Lehmann Gerätetechnik GmbH.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH
{{kontakt_email}}';

-- Update only unchanged standard templates; preserve edited texts.
update public.rental_email_templates set body='Guten Tag {{name}}

Ihre Mietreservation wurde von uns bestätigt.
Bei Fragen oder Änderungen erreichen Sie uns unter {{kontakt_email}}.

Freundliche Grüsse
{{vermieter}}',updated_at=now() where key='confirmed' and body='Guten Tag {{name}}

Ihre Mietreservation wurde von uns bestätigt.
Bei Fragen oder Änderungen erreichen Sie uns unter {{kontakt_email}}.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH';

-- Update only unchanged standard templates; preserve edited texts.
update public.rental_email_templates set body='Guten Tag {{name}}

Ihre Mietanfrage bzw. Reservation wurde abgelehnt bzw. storniert.
Falls Sie einen anderen Zeitraum oder ein alternatives Gerät wünschen, melden Sie sich gerne unter {{kontakt_email}}.

Freundliche Grüsse
{{vermieter}}',updated_at=now() where key='cancelled' and body='Guten Tag {{name}}

Ihre Mietanfrage bzw. Reservation wurde abgelehnt bzw. storniert.
Falls Sie einen anderen Zeitraum oder ein alternatives Gerät wünschen, melden Sie sich gerne unter {{kontakt_email}}.

Freundliche Grüsse
Lehmann Gerätetechnik GmbH';
