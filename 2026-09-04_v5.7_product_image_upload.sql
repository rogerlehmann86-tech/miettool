-- Lehmann Miettool v5.7: Bilder direkt im Adminbereich hochladen

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rental-product-images','rental-product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Angemeldete Benutzer laden Mietbilder hoch" on storage.objects;
create policy "Angemeldete Benutzer laden Mietbilder hoch" on storage.objects for insert to authenticated
with check (bucket_id='rental-product-images');

drop policy if exists "Angemeldete Benutzer ändern Mietbilder" on storage.objects;
create policy "Angemeldete Benutzer ändern Mietbilder" on storage.objects for update to authenticated
using (bucket_id='rental-product-images') with check (bucket_id='rental-product-images');

drop policy if exists "Angemeldete Benutzer löschen Mietbilder" on storage.objects;
create policy "Angemeldete Benutzer löschen Mietbilder" on storage.objects for delete to authenticated
using (bucket_id='rental-product-images');

select 'v5.7 product image upload installed' as result;
