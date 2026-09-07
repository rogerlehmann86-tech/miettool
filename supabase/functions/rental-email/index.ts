import { createClient } from 'jsr:@supabase/supabase-js@2.57.4';
import { buildEmail, routeEmails } from './mail-content.mjs';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  try {
    const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey=Deno.env.get('RESEND_API_KEY');
    if(!resendKey)throw new Error('RESEND_API_KEY ist nicht gesetzt.');
    const from=Deno.env.get('EMAIL_FROM')||'Lehmann Gerätetechnik <info@lehmann-gt.ch>';
    const companyEmail=Deno.env.get('COMPANY_EMAIL')||'info@lehmann-gt.ch';
    const website=Deno.env.get('WEBSITE_URL')||'https://rogerlehmann86-tech.github.io/miettool';
    const {reservation_id,event}=await req.json();
    if(!/^[0-9a-f-]{36}$/i.test(reservation_id||'')||!['request','confirmed','cancelled'].includes(event))return reply({error:'Ungültige Anfrage.'},400);
    const admin=createClient(url,key);
    if(event!=='request') {
      const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}});
      const {data,error}=await auth.auth.getUser();
      if(error||!data.user)return reply({error:'Nicht autorisiert.'},401);
      const allowed=await auth.rpc('rental_is_admin');
      if(allowed.error||!allowed.data)return reply({error:'Keine Adminberechtigung.'},403);
    }
    const {data:row,error:rowError}=await admin.from('admin_reservations').select('*').eq('id',reservation_id).single();
    if(rowError||!row)throw new Error('Reservation nicht gefunden.');
    if(!row.email||row.status==='blocked')return reply({error:'Keine Kunden-E-Mail vorhanden.'},400);
    if(row.status!==({request:'pending',confirmed:'confirmed',cancelled:'cancelled'} as Record<string,string>)[event])return reply({error:'Status passt nicht zum E-Mailereignis.'},409);
    const existing=await admin.from('email_events').select('sent_at').eq('reservation_id',reservation_id).eq('event_type',event).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data?.sent_at)return reply({ok:true,duplicate:true});
    const [p,t,l]=await Promise.all([
      admin.from('products').select('day_price,tier5_price,tier20_price,category').eq('id',row.product_id).single(),
      admin.from('rental_email_templates').select('key,subject,body'),
      admin.from('reservation_locations').select('pickup,return').eq('reservation_id',reservation_id).maybeSingle()
    ]);
    if(p.error||t.error||l.error)throw p.error||t.error||l.error;
    const templates=Object.fromEntries((t.data||[]).map(v=>[v.key,v]));
    const route=routeEmails(l.data,companyEmail);
    const jobs=event==='request' ? [
      ...route.recipients.map(to=>({key:'request_company',to,replyTo:row.email})),
      {key:'request_customer',to:row.email,replyTo:route.replyTo}
    ] : [{key:event,to:row.email,replyTo:route.replyTo}];
    for(const job of jobs) {
      const payload={from,to:[job.to],reply_to:job.replyTo,...buildEmail(job.key,templates[job.key],row,p.data,l.data,companyEmail,website)};
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(job.to.toLowerCase()));
      const recipientKey=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`${reservation_id}/${event}/${job.key}/${recipientKey}`},body:JSON.stringify(payload)});
      if(!response.ok) {console.error('E-Mailversand fehlgeschlagen',response.status,await response.text());throw new Error('E-Mailversand fehlgeschlagen. Bitte später erneut versuchen.');}
    }
    const saved=await admin.from('email_events').upsert({reservation_id,event_type:event,sent_at:new Date().toISOString()},{onConflict:'reservation_id,event_type'});
    if(saved.error)throw saved.error;
    return reply({ok:true});
  }catch(e){console.error(e);return reply({error:e instanceof Error?e.message:'Unbekannter Fehler'},500);}
});
