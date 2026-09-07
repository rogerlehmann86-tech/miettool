import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
let handler;
const sent=[];
let isPartner=false,isAdmin=true,alreadySent=false,partnerData=[],directQueued=true,failMail=false;
const row={id:'11111111-1111-4111-8111-111111111111',status:'pending',product_id:'p1',product_name:'Testgerät',name:'Testkunde',email:'test@example.com',from_date:'2026-09-14',to_date:'2026-09-15',start_half:'pm',end_half:'pm'};
const query=(name)=>{
 const q={select:()=>q,eq:()=>q,upsert:()=>q,update:()=>q,single:()=>q,maybeSingle:()=>q,then:resolve=>Promise.resolve({data:name==='admin_reservations'?row:name==='products'?{day_price:100}:name==='rental_email_templates'?[]:name==='rental_partner_devices'?partnerData:name==='rental_direct_notifications'?(directQueued?{sent_at:alreadySent?'2026-01-01':null}:null):name==='reservation_locations'?{pickup:{name:'A',notification_email:'a@example.com'},return:{name:'B',notification_email:'b@example.com'}}:alreadySent?{sent_at:'2026-01-01'}:null,error:null}).then(resolve)};
 return q;
};
globalThis.__testCreateClient=()=>({from:query,auth:{getUser:async()=>({data:{user:{id:'admin'}},error:null})},rpc:async(name)=>({data:name==='rental_is_admin'?isAdmin:isPartner,error:null})});
registerHooks({resolve(spec,context,next){if(spec.startsWith('jsr:'))return {url:'data:text/javascript,export const createClient=globalThis.__testCreateClient',shortCircuit:true};return next(spec,context);}});
globalThis.Deno={env:{get:name=>({RESEND_API_KEY:'test',SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test',SUPABASE_ANON_KEY:'test'}[name])},serve:h=>handler=h};
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push({payload:JSON.parse(options.body),headers:options.headers});return new Response('{}',{status:failMail?503:200});};
await import('../supabase/functions/rental-email/index.ts');
const req=event=>new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reservation_id:row.id,event})});
test('request sends to both locations and customer, uses snapshots and 1.5-day price',async()=>{
 const response=await handler(req('request'));assert.equal(response.status,200);
 assert.deepEqual(sent.map(s=>s.payload.to[0]),['a@example.com','b@example.com','test@example.com']);
 assert.equal(sent[2].payload.reply_to,'a@example.com');assert.match(sent[2].payload.text,/150/);
 assert.equal(new Set(sent.map(s=>s.headers['Idempotency-Key'])).size,3);
});
test('repeated event does not send and non-admin cannot confirm',async()=>{
 sent.length=0;alreadySent=true;await handler(req('request'));assert.equal(sent.length,0);
 alreadySent=false;isAdmin=false;row.status='confirmed';assert.equal((await handler(req('confirmed'))).status,403);assert.equal(sent.length,0);
});

test('direct confirmed rental informs sublessor without customer email and deduplicates location',async()=>{
 sent.length=0;isAdmin=true;alreadySent=false;row.status='confirmed';row.email=null;
 partnerData=[{rental_partners:{active:true,notification_email:'external@example.com'}},{rental_partners:{active:true,notification_email:'a@example.com'}},{rental_partners:{active:false,notification_email:'disabled@example.com'}}];
 assert.equal((await handler(req('direct'))).status,200);
 assert.deepEqual(sent.map(s=>s.payload.to[0]),['a@example.com','external@example.com']);
 assert.match(sent[1].payload.subject,/Bestätigte Vermietung/);assert.match(sent[1].payload.text,/Keine Kunden-E-Mail hinterlegt/);
});
test('direct notification requires admin and queued direct booking',async()=>{
 sent.length=0;isAdmin=false;assert.equal((await handler(req('direct'))).status,403);assert.equal(sent.length,0);
 isAdmin=true;directQueued=false;assert.equal((await handler(req('direct'))).status,400);assert.equal(sent.length,0);directQueued=true;
});
test('public request also informs active assigned sublessor',async()=>{
 sent.length=0;row.status='pending';row.email='test@example.com';
 assert.equal((await handler(req('request'))).status,200);
 assert.ok(sent.some(s=>s.payload.to[0]==='external@example.com'));
 assert.ok(sent.some(s=>s.payload.to[0]==='test@example.com'));
 assert.ok(!sent.some(s=>s.payload.to[0]==='disabled@example.com'));
});

test('partner requests exclude unrelated locations and link to partner inbox',async()=>{
 sent.length=0;row.status='pending';row.email='test@example.com';
 partnerData=[{rental_partners:{active:true,company:'Partnerfirma',notification_email:'external@example.com'}}];
 assert.equal((await handler(req('request'))).status,200);
 assert.deepEqual(sent.map(s=>s.payload.to[0]),['external@example.com','test@example.com']);
 assert.match(sent[0].payload.text,/partner.html/);
 assert.equal(sent[1].payload.reply_to,'external@example.com');
 assert.ok(sent[1].payload.text.endsWith('Freundliche Grüsse\nPartnerfirma'));
});
