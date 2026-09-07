import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
let handler,isAdmin=false,created=0,bound=0;
let partner={id:'partner',user_id:null,email:'external@example.com',active:true};
const client={auth:{getUser:async()=>({data:{user:{id:'user'}},error:null}),admin:{createUser:async input=>{created++;assert.equal(input.email,'external@example.com');assert.equal(input.password,'test-start-password');return {data:{user:{id:'new-user'}},error:null};}}},rpc:async()=>({data:isAdmin,error:null}),from:()=>{
 let write=false;const q={select:()=>q,eq:()=>q,is:()=>q,update:()=>{write=true;return q},single:async()=>{if(write)bound++;return {data:write?{id:'partner'}:partner,error:null}}};return q;
}};
globalThis.__partnerClient=()=>client;
registerHooks({resolve(spec,context,next){return spec.startsWith('jsr:')?{url:'data:text/javascript,export const createClient=globalThis.__partnerClient',shortCircuit:true}:next(spec,context);}});
globalThis.Deno={env:{get:()=> 'test'},serve:h=>handler=h};
await import('../supabase/functions/rental-partner-account/index.ts');
const request=()=>new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({partner_id:'partner',password:'test-start-password'})});
test('sublessor cannot provision accounts',async()=>{assert.equal((await handler(request())).status,403);assert.equal(created,0);});
test('admin creates only selected partner login and binds its identity',async()=>{isAdmin=true;assert.equal((await handler(request())).status,200);assert.equal(created,1);assert.equal(bound,1);});
test('existing account is never reset or recreated',async()=>{partner.user_id='existing';assert.equal((await handler(request())).status,409);assert.equal(created,1);});
