const cfg=window.RENTAL_CONFIG||{},db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const el=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let partnerProducts=[];
const show=(text,error=false)=>{el('partnerNotice').textContent=text;el('partnerNotice').className='notice '+(error?'error':'success');};
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zurich'}).format(new Date());
async function rpc(name,args={}){const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data;}
async function loadPartner(){
 try{
  partnerProducts=await rpc('partner_inventory')||[];
  const selected=el('partnerProduct').value;
  el('partnerProduct').innerHTML=partnerProducts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if(partnerProducts.some(p=>p.id===selected))el('partnerProduct').value=selected;
  el('partnerDevices').innerHTML=partnerProducts.map(p=>`<article class="product-admin-card"><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${Number(p.quantity)} Exemplar(e)</p></div></article>`).join('')||'<p>Noch keine aktiven Geräte zugeteilt. Bitte Lehmann Gerätetechnik kontaktieren.</p>';
  el('partnerBlockForm').querySelector('button').disabled=!partnerProducts.length;
  await loadCalendar();await loadBlocks();await loadRequests();
 }catch(e){show(e.message,true);}
}
async function loadCalendar(){
 const product=el('partnerProduct').value;
 if(!product){el('partnerCalendar').textContent='Keine Geräte zugeteilt.';return;}
 try{
  const rows=await rpc('partner_calendar',{p_product_id:product,p_from:el('partnerCalendarFrom').value||today(),p_days:14});
  el('partnerCalendar').innerHTML=(rows||[]).map(r=>`<article class="customer-cal-day"><div class="customer-cal-date">${esc(r.calendar_date)}</div>${[['VM',r.am_available],['NM',r.pm_available]].map(([label,n])=>`<div class="customer-cal-half ${n>0?'free':'busy'}"><strong>${label}</strong><small>${Number(n)} frei</small></div>`).join('')}</article>`).join('');
 }catch(e){el('partnerCalendar').textContent=e.message;show(e.message,true);}
}
async function loadBlocks(){
 const rows=await rpc('partner_blocks');
 el('partnerBlocks').innerHTML=(rows||[]).map(r=>`<article class="location-card"><div><strong>${esc(r.product_name)}</strong><p>${esc(r.from_date)} ${r.start_half==='pm'?'Nachmittag':'Vormittag'} bis ${esc(r.to_date)} ${r.end_half==='am'?'Mittag':'Abend'}</p><p>${esc(r.note)}</p></div><button class="btn" type="button" data-remove-block="${r.id}">Eigene Sperre aufheben</button></article>`).join('')||'<p>Keine eigenen Nutzungssperren vorhanden.</p>';
 el('partnerBlocks').querySelectorAll('[data-remove-block]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await rpc('partner_remove_block',{p_id:b.dataset.removeBlock});await loadPartner();show('Eigene Nutzungssperre aufgehoben.');}catch(e){show(e.message,true);b.disabled=false;}}));
}
el('partnerBlockForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const b=ev.submitter;b.disabled=true;
 try{
  if(!el('partnerProduct').value)throw new Error('Bitte ein Gerät auswählen.');
  const id=await rpc('partner_create_block',{p_product_id:el('partnerProduct').value,p_from:el('partnerFrom').value,p_to:el('partnerTo').value,p_start_half:el('partnerStartHalf').value,p_end_half:el('partnerEndHalf').value,p_note:el('partnerNote').value.trim()});
  if(!id)throw new Error('Für diesen Zeitraum ist kein Exemplar mehr frei.');
  await loadPartner();el('partnerNote').value='';show('Eigennutzung gespeichert. Das Exemplar ist für Vermietungen gesperrt.');
 }catch(e){show(e.message,true);}finally{b.disabled=!partnerProducts.length;}
});
el('partnerPasswordForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const b=ev.submitter;b.disabled=true;
 try{if(el('partnerPassword').value!==el('partnerPasswordRepeat').value)throw new Error('Die Passwörter stimmen nicht überein.');const {error}=await db.auth.updateUser({password:el('partnerPassword').value});if(error)throw error;ev.target.reset();show('Passwort geändert.');}catch(e){show(e.message,true);}finally{b.disabled=false;}
});
el('partnerRefresh').addEventListener('click',loadPartner);el('partnerProduct').addEventListener('change',loadCalendar);el('partnerCalendarLoad').addEventListener('click',loadCalendar);
el('partnerLogout').addEventListener('click',async()=>{await db.auth.signOut();location.href='admin.html';});
['partnerFrom','partnerTo','partnerCalendarFrom'].forEach(id=>{el(id).value=today();});
el('partnerFrom').addEventListener('change',()=>{el('partnerTo').min=el('partnerFrom').value;if(el('partnerTo').value<el('partnerFrom').value)el('partnerTo').value=el('partnerFrom').value;});
(async()=>{try{const {data}=await db.auth.getSession();if(!data.session){location.replace('admin.html');return;}const role=await rpc('rental_access_role');if(role==='admin'){location.replace('admin.html');return;}if(role!=='sublessor')throw new Error('Für dieses Konto ist kein Untervermieter-Zugang freigegeben.');el('partnerApp').classList.remove('hidden');await loadPartner();show('Angemeldet als Untervermieter.');}catch(e){show(e.message,true);}})();

async function loadRequests(){
 const rows=await rpc('partner_reservations');
 const date=v=>String(v||'').split('-').reverse().join('.');
 const card=r=>`<article class="reservation ${esc(r.status)}"><div class="reservation-head"><div><h3>${esc(r.product_name)}</h3><p>${date(r.from_date)} ${r.start_half==='pm'?'Nachmittag':'Vormittag'} bis ${date(r.to_date)} ${r.end_half==='am'?'Mittag':'Abend'}</p></div><span class="status-pill">${({pending:'Anfrage',confirmed:'Bestätigt',cancelled:'Abgelehnt / storniert'})[r.status]||esc(r.status)}</span></div><p class="small muted">Anfrage-Nr. ${esc(r.id)}</p></article>`;
 el('partnerRequests').innerHTML=rows.filter(r=>r.status==='pending').map(card).join('')||'<p>Keine offenen Anfragen.</p>';
 el('partnerCompleted').innerHTML=rows.filter(r=>r.status!=='pending').map(card).join('')||'<p>Noch keine bearbeiteten Reservationen.</p>';
}
