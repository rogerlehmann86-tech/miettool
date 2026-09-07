import { createClient } from 'jsr:@supabase/supabase-js@2.57.4';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')!;
  const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}});
  const user=await client.auth.getUser();if(user.error||!user.data.user)return reply({error:'Nicht angemeldet'},401);
  const permission=await client.rpc('rental_is_admin');if(permission.error||!permission.data)return reply({error:'Keine Adminberechtigung'},403);
  const {partner_id,password}=await req.json();
  if(typeof password!=='string'||password.length<12||password.length>128)return reply({error:'Startpasswort: 12 bis 128 Zeichen.'},400);
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const p=await admin.from('rental_partners').select('id,user_id,email,active').eq('id',partner_id).single();
  if(p.error||!p.data||!p.data.active)return reply({error:'Aktiver Untervermieter nicht gefunden'},404);
  if(p.data.user_id)return reply({error:'Für diesen Untervermieter besteht bereits ein Zugang. Das Passwort wurde nicht geändert.'},409);
  if(p.data.email.toLowerCase()==='info@lehmann-gt.ch')return reply({error:'Admin-Konto nicht zulässig'},400);
  // Admin provisions a selected partner account. No invitation or password email is sent.
  const created=await admin.auth.admin.createUser({email:p.data.email,password,email_confirm:true});
  if(created.error||!created.data.user)return reply({error:created.error?.message||'Zugang konnte nicht angelegt werden'},400);
  const saved=await admin.from('rental_partners').update({user_id:created.data.user.id}).eq('id',p.data.id).eq('email',p.data.email).is('user_id',null).select('id').single();
  if(saved.error)return reply({error:'Zugang angelegt, aber Zuordnung fehlgeschlagen. Untervermieter erneut speichern, um das bestehende Konto zuzuordnen.'},409);
  return reply({ok:true});
 }catch(_e){return reply({error:'Zugang konnte nicht angelegt werden.'},500);}
});
