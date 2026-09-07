-- Integration checks; no emails are sent and all fixture writes are rolled back.
begin;
do $$
declare p uuid; other_p uuid; unit_id uuid; pickup_id uuid; return_id uuid; other_id uuid; reservation uuid; n int;
begin
 insert into public.products(slug,category,name,day_price,active) values('test-'||gen_random_uuid(),'Gartengeräte','Integrationstest',100,true) returning id into p;
 insert into public.products(slug,category,name,day_price,active) values('test-'||gen_random_uuid(),'Gartengeräte','Anderes Testgerät',100,true) returning id into other_p;
 insert into public.units(product_id,internal_name) values(p,'Test #1') returning id into unit_id;
 insert into public.product_locations(product_id,name,address,notification_email,can_pickup,can_return) values(p,'Abholung Test','Testadresse A','a@example.com',true,false) returning id into pickup_id;
 insert into public.product_locations(product_id,name,address,notification_email,can_pickup,can_return) values(p,'Rückgabe Test','Testadresse B','b@example.com',false,true) returning id into return_id;
 insert into public.product_locations(product_id,name,address,notification_email) values(other_p,'Fremdes Gerät','Testadresse C','c@example.com') returning id into other_id;
 perform set_config('request.jwt.claims','{"role":"anon"}',true);
 set local role anon;
 select count(*) into n from public.public_rental_locations where product_id=p;
 if n<>2 then raise exception 'Public location read failed';end if;
 begin
   perform notification_email from public.product_locations where id=pickup_id;
   raise exception 'Private email readable by anon';
 exception when insufficient_privilege then null;end;
 begin
   perform * from public.rental_email_templates;
   raise exception 'Templates readable by anon';
 exception when insufficient_privilege then null;end;
 begin
   insert into public.product_locations(product_id,name,notification_email) values(p,'Unauthorized','bad@example.com');
   raise exception 'Anon location write permitted';
 exception when insufficient_privilege then null;end;
 begin
   perform public.create_rental_request_v3(p,'2090-01-02','2090-01-03','pm','pm','Test',null,'test@example.com','000',null,null,false,other_id,return_id);
   raise exception 'Cross-product location accepted';
 exception when raise_exception then if SQLERRM='Cross-product location accepted' then raise;end if;end;
 begin
   perform public.create_rental_request_v3(p,'2090-01-02','2090-01-03','pm','pm','Test',null,'test@example.com','000',null,null,false,pickup_id,pickup_id);
   raise exception 'Pickup-only location accepted as return';
 exception when raise_exception then if SQLERRM='Pickup-only location accepted as return' then raise;end if;end;
 begin
   perform public.create_rental_request_v3(p,'2090-01-02','2090-01-03','pm','pm','Test',null,'test@example.com','000',null,null,false,null,null);
   raise exception 'Required locations omitted';
 exception when raise_exception then if SQLERRM='Required locations omitted' then raise;end if;end;
 reservation:=public.create_rental_request_v3(p,'2090-01-02','2090-01-03','pm','pm','Test',null,'test@example.com','000',null,null,false,pickup_id,return_id);
 if reservation is null then raise exception 'Valid request failed';end if;
 if public.create_rental_request_v3(p,'2090-01-02','2090-01-03','pm','pm','Test',null,'test@example.com','000',null,null,false,pickup_id,return_id) is not null then raise exception 'Overbooking permitted';end if;
 reset role;
 update public.product_locations set address='Neue Adresse' where id=pickup_id;
 if (select pickup->>'address' from public.reservation_locations where reservation_id=reservation)<>'Testadresse A' then raise exception 'Snapshot changed';end if;
 if (select "return"->>'notification_email' from public.reservation_locations where reservation_id=reservation)<>'b@example.com' then raise exception 'Recipient snapshot missing';end if;
 -- Authenticated users without the existing admin identity receive no settings access.
 perform set_config('request.jwt.claims',json_build_object('role','authenticated','sub',gen_random_uuid())::text,true);
 set local role authenticated;
 if public.rental_is_admin() then raise exception 'Unknown account treated as admin';end if;
 select count(*) into n from public.rental_email_templates;
 if n<>0 then raise exception 'Non-admin can read templates';end if;
 begin
   update public.rental_email_templates set subject='Forbidden';
   get diagnostics n=row_count;
   if n<>0 then raise exception 'Non-admin can update templates';end if;
 end;
 reset role;
 perform set_config('request.jwt.claims',(select json_build_object('role','authenticated','sub',id)::text from auth.users where lower(email)='info@lehmann-gt.ch'),true);
 set local role authenticated;
 if not public.rental_is_admin() then raise exception 'Existing admin denied';end if;
 select count(*) into n from public.rental_email_templates;
 if n<>4 then raise exception 'Admin templates unavailable';end if;
 update public.rental_email_templates set subject='Test {{geraet}}' where key='confirmed';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Template save failed';end if;
 if public.admin_create_rental_v3(p,'2090-01-04','2090-01-04','am','am','Test',null,null,'000',null,null,false,'confirmed',pickup_id,return_id) is null then raise exception 'Admin rental failed';end if;
 reset role;
end $$;
rollback;
select 'PASS: anonymous/admin access, routing snapshots, required locations, cross-product rejection, capacity and admin booking; all fixtures rolled back' as result;
