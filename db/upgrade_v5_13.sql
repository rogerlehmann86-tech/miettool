-- Geräteinformationen und öffentliche PDF-Anleitungen.
-- Voraussetzung: bestehende Miettool-Upgrades v5.8 bis v5.11.
begin;
-- Validate document metadata and restrict each path to its own product folder.
create or replace function rental_private.valid_product_documents(p_product uuid, p_documents jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare d jsonb;
begin
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) > 10 then return false; end if;
  for d in select value from jsonb_array_elements(p_documents) loop
    if jsonb_typeof(d) <> 'object' or jsonb_typeof(d->'title') is distinct from 'string'
      or length(trim(d->>'title')) not between 1 and 160
      or jsonb_typeof(d->'path') is distinct from 'string'
      or (d->>'path') !~ ('^' || p_product::text || '/[a-f0-9-]{36}[.]pdf$') then return false; end if;
  end loop;
  return true;
end; $$;
revoke all on function rental_private.valid_product_documents(uuid,jsonb) from public, anon;
grant execute on function rental_private.valid_product_documents(uuid,jsonb) to authenticated, service_role;
create table if not exists public.product_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  description text not null default '' check (length(description) <= 12000),
  specifications text not null default '' check (length(specifications) <= 12000),
  documents jsonb not null default '[]'::jsonb check (rental_private.valid_product_documents(product_id, documents))
);
alter table public.product_details enable row level security;
revoke all on public.product_details from public, anon, authenticated;
grant select on public.product_details to anon, authenticated;
grant insert, update, delete on public.product_details to authenticated;
grant all on public.product_details to service_role;
drop policy if exists product_details_public_read on public.product_details;
create policy product_details_public_read on public.product_details for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.active));
drop policy if exists product_details_admin on public.product_details;
create policy product_details_admin on public.product_details for all to authenticated
using ((select rental_private.is_admin())) with check ((select rental_private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rental-product-documents', 'rental-product-documents', true, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists product_documents_admin_select on storage.objects;
create policy product_documents_admin_select on storage.objects for select to authenticated
using (bucket_id = 'rental-product-documents' and (select rental_private.is_admin()));
drop policy if exists product_documents_admin_insert on storage.objects;
create policy product_documents_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'rental-product-documents' and (select rental_private.is_admin()));
drop policy if exists product_documents_admin_delete on storage.objects;
create policy product_documents_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'rental-product-documents' and (select rental_private.is_admin()));
notify pgrst, 'reload schema';
commit;
select 'v5.13 Geräteinformationen und PDF-Upload eingerichtet' as result;
