const cfg = window.RENTAL_CONFIG || {};
const isDemo = !cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR_');
const db = isDemo ? null : window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
const el=id=>document.getElementById(id);let reservations=[];let products=[];let calendarStart=today();
function show(msg,error=false,success=false){const n=el('adminNotice');n.textContent=msg;n.className='notice'+(error?' error':'')+(success?' success':'')}
function modeName(m){return {full:'Ganzer Tag / mehrere Tage',half_am:'½ Tag Vormittag',half_pm:'½ Tag Nachmittag'}[m]||m}
function startHalf(r){return r?.start_half||(r?.rental_mode==='half_pm'?'pm':'am')}
function endHalf(r){return r?.end_half||(r?.rental_mode==='half_am'?'am':'pm')}
function startHalfName(h){return h==='pm'?'Nachmittag':'Vormittag'}
function endHalfName(h){return h==='am'?'Mittag':'Abend'}
function dayNumber(s){return Math.round(new Date(s+'T12:00:00Z').getTime()/86400000)}
function halfIndex(date,half){return dayNumber(date)*2+(half==='pm'?1:0)}
function periodUnits(from,to,sh,eh){if(!from||!to)return 0;const n=halfIndex(to,eh)-halfIndex(from,sh)+1;return n>0?n/2:0}
function unitsLabel(u){return Number.isInteger(u)?`${u} Tag(e)`: `${String(u).replace('.',',')} Tag(e)`}
function periodText(r){const sh=startHalf(r),eh=endHalf(r),u=periodUnits(r.from_date,r.to_date,sh,eh);if(r.from_date===r.to_date&&sh==='am'&&eh==='am')return `${r.from_date} · ½ Tag Vormittag`;if(r.from_date===r.to_date&&sh==='pm'&&eh==='pm')return `${r.from_date} · ½ Tag Nachmittag`;return `${r.from_date} ${startHalfName(sh)} bis ${r.to_date} ${endHalfName(eh)} · ${unitsLabel(u)}`}
function statusName(s){return {pending:'Anfrage',confirmed:'Bestätigt',cancelled:'Abgelehnt / storniert',blocked:'Gesperrt / Service'}[s]||s}
function today(){return new Date().toISOString().slice(0,10)}
function rentalEnd(r){if(!r?.to_date)return null;const d=new Date(`${r.to_date}T00:00:00`);if(endHalf(r)==='am')d.setHours(12);else d.setDate(d.getDate()+1);return d}
function isArchived(r){const end=rentalEnd(r);return r.status==='confirmed'&&end&&end.getTime()<Date.now()}
function dateSearchValue(v){if(!v)return '';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}.${m[2]}.${m[1]}`:String(v)}
function searchableText(r){return [r.product_name,r.product_id,r.name,r.company,r.email,r.phone,r.note,r.pickup_location_text,r.return_location_text,r.from_date,r.to_date,dateSearchValue(r.from_date),dateSearchValue(r.to_date),periodText(r),modeName(r.rental_mode),startHalfName(startHalf(r)),endHalfName(endHalf(r)),statusName(r.status),isArchived(r)?'archiv':''].filter(Boolean).join(' ').toLocaleLowerCase('de-CH')}
function delegatedRequest(r){return r.status==='pending'&&partnerAssignments.some(d=>d.product_id===r.product_id&&rentalPartners.some(p=>p.id===d.partner_id&&p.active));}
function updateFilterLabels(){
  const counts={
    pending:reservations.filter(r=>r.status==='pending'&&!delegatedRequest(r)).length,
    confirmed:reservations.filter(r=>r.status==='confirmed'&&!isArchived(r)).length,
    archive:reservations.filter(isArchived).length,
    blocked:reservations.filter(r=>r.status==='blocked').length,
    cancelled:reservations.filter(r=>r.status==='cancelled').length,
    all:reservations.length
  };
  const labels={pending:'Anfragen',confirmed:'Bestätigte / aktuelle Mieten',archive:'Archiv',blocked:'Gesperrt / Service',cancelled:'Abgelehnt / storniert',all:'Alle'};
  for(const [value,label] of Object.entries(labels)){const o=el('statusFilter')?.querySelector(`option[value="${value}"]`);if(o)o.textContent=`${label} (${counts[value]||0})`}
}

async function sendStatusEmail(reservationId,eventType){
  if(isDemo)return {demo:true};
  const fn=cfg.emailFunctionName||'rental-email';
  const {data,error}=await db.functions.invoke(fn,{body:{reservation_id:reservationId,event:eventType}});
  if(error)throw error;
  return data;
}

function initBlockDates(){const t=today();el('blockFrom').min=t;el('blockTo').min=t;el('blockFrom').value=t;el('blockTo').value=t;el('blockStartHalf').value='am';el('blockEndHalf').value='pm';const sync=()=>{el('blockTo').min=el('blockFrom').value;if(el('blockTo').value<el('blockFrom').value)el('blockTo').value=el('blockFrom').value;if(el('blockFrom').value===el('blockTo').value&&el('blockStartHalf').value==='pm'&&el('blockEndHalf').value==='am')el('blockEndHalf').value='pm'};['blockFrom','blockTo','blockStartHalf','blockEndHalf'].forEach(id=>el(id).addEventListener('change',sync));sync()}
async function login(){if(isDemo){el('loginPanel').classList.add('hidden');el('adminApp').classList.remove('hidden');await loadAll();return}const {error}=await db.auth.signInWithPassword({email:el('adminEmail').value,password:el('adminPassword').value});if(error){el('loginNotice').textContent=error.message;el('loginNotice').className='notice error';return}showAdmin()}
async function showAdmin(){const {data:role,error}=await db.rpc('rental_access_role');if(!error&&role==='sublessor'){location.replace('partner.html');return;}if(error||role!=='admin'){el('loginNotice').textContent=error?.message||'Für dieses Konto ist kein Zugang freigegeben.';el('loginNotice').className='notice error';return;}el('loginNotice').classList.add('hidden');el('loginPanel').classList.add('hidden');el('adminApp').classList.remove('hidden');await loadAll()}
async function loadAll(){try{await loadRentalLocations();await loadProducts();await loadPartnerAdmin();await loadReservations();await loadAdminSettings()}catch(e){show(e.message,true)}}
async function loadProducts(){if(isDemo){products=[{id:'vertikutierer',name:'Vertikutierer'},{id:'holzhaecksler',name:'Holzhäcksler'},{id:'heckenschere',name:'Heckenschere'},{id:'balkenmaeher',name:'Balkenmäher'},{id:'bodenfraese',name:'Bodenfräse'},{id:'motorhacke',name:'Motorhacke'},{id:'motorsaege-462',name:'Motorsäge 50 cm'},{id:'motorsaege-211',name:'Motorsäge 35 cm'},{id:'stabheckenschere',name:'Stabheckenschere'},{id:'fadenmaeher',name:'Fadenmäher'},{id:'motorsense',name:'Rücktragbare Motorsense'},{id:'plattenvibrator',name:'Plattenvibrator'},{id:'erdbohrer',name:'Erdbohrer'},{id:'hochdruckreiniger',name:'Hochdruckreiniger'},{id:'tauchpumpe',name:'Tauchpumpe'},{id:'holzspalter',name:'Holzspalter'},{id:'unkrautbuerste',name:'Unkrautbürste'},{id:'eu20i',name:'Honda EU20i'},{id:'cx7000t',name:'CGM CX7000T'},{id:'v18y',name:'CGM V18Y'},{id:'v60f',name:'CGM V60F'}]}else{const {data,error}=await db.from('products_with_quantity').select('*').order('sort_order');if(error)return show(error.message,true);products=data||[]}const activeProducts=products.filter(p=>p.active!==false);el('blockProduct').innerHTML=activeProducts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');if(el('quickProduct'))el('quickProduct').innerHTML=activeProducts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');renderProductAdmin();fillLocationSelects(el('quickProduct').value,'quick');updateQuickPrice();renderOccupancyCalendar()}
async function loadReservations(){if(isDemo)reservations=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]').map(r=>({...r,product_name:r.product_name||products.find(p=>p.id===r.product_id)?.name||r.product_id}));else{const {data,error}=await db.from('admin_reservations').select('*').order('from_date',{ascending:true});if(error)return show(error.message,true);const loc=await db.from('reservation_locations').select('reservation_id,pickup,return');if(loc.error)throw loc.error;const locationMap=new Map((loc.data||[]).map(l=>[l.reservation_id,l]));reservations=(data||[]).map(r=>{const l=locationMap.get(r.id);const text=x=>x?[x.name,x.address,x.instructions].filter(Boolean).join('\n'):null;return {...r,pickup_location_text:text(l?.pickup),return_location_text:text(l?.return)}})}updateFilterLabels();render();renderOccupancyCalendar()}
function render(){
  const f=el('statusFilter').value;
  const q=(el('reservationSearch')?.value||'').trim().toLocaleLowerCase('de-CH');
  let rs=reservations.filter(r=>{
    const statusOk=f==='all'||(f==='archive'?isArchived(r):(f==='confirmed'?r.status==='confirmed'&&!isArchived(r):r.status===f));
    return statusOk&&!(f==='pending'&&delegatedRequest(r))&&(!q||searchableText(r).includes(q));
  });
  if(f==='pending')rs.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  else if(f==='archive')rs.sort((a,b)=>(rentalEnd(b)?.getTime()||0)-(rentalEnd(a)?.getTime()||0));
  else if(f==='confirmed')rs.sort((a,b)=>String(a.from_date||'').localeCompare(String(b.from_date||'')));
  el('reservationList').innerHTML=rs.map(r=>`<article class="reservation ${r.status}${isArchived(r)?' archived':''}"><div class="reservation-head"><div><h3>${esc(r.product_name||r.product_id)}</h3><div class="muted">${periodText(r)}${r.long_term?' · Langzeit-Anfrage':''}</div></div><span class="status-pill">${isArchived(r)?'Archiv':statusName(r.status)}</span></div><div class="reservation-details"><div><strong>${r.status==='blocked'?'Sperrgrund':'Kunde'}</strong><br>${esc(r.status==='blocked'?(r.note||'Interne Sperre'):(r.name||'–'))}${r.company?'<br>'+esc(r.company):''}</div><div><strong>Kontakt</strong><br>${r.status==='blocked'?'–':`${esc(r.email||'–')}<br>${esc(r.phone||'–')}`}</div><div><strong>Bemerkung</strong><br>${esc(r.note||'–')}</div></div>${r.pickup_location_text||r.return_location_text?`<div class="reservation-details"><div><strong>Abholung</strong><p class="location-hint">${esc(r.pickup_location_text||'Nach Vereinbarung')}</p></div><div><strong>Rückgabe</strong><p class="location-hint">${esc(r.return_location_text||'Nach Vereinbarung')}</p></div></div>`:''}${directNotificationHtml(r.id)}<div class="reservation-actions">${r.status==='blocked'?`<button class="btn danger smallbtn" onclick="deleteBlock('${r.id}')">Sperre aufheben</button>`:`${r.status!=='confirmed'?`<button class="btn success smallbtn" onclick="setStatus('${r.id}','confirmed')">Bestätigen</button>`:''}${r.status!=='cancelled'?`<button class="btn danger smallbtn" onclick="setStatus('${r.id}','cancelled')">Ablehnen / stornieren</button>`:''}`}</div></article>`).join('')||'<div class="panel">Keine passenden Einträge.</div>'
}
window.setStatus=async function(id,status){const current=reservations.find(r=>String(r.id)===String(id));if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]');const r=rs.find(x=>x.id===id);if(r)r.status=status;localStorage.setItem('rental_demo_reservations',JSON.stringify(rs));show('Status wurde geändert.',false,true);await loadReservations();return}const {error}=await db.from('reservations').update({status}).eq('id',id);if(error)return show(error.message,true);const canMail=!!String(current?.email||'').trim();try{if(canMail&&(status==='confirmed'||status==='cancelled'))await sendStatusEmail(id,status);show(canMail?(status==='confirmed'?'Reservation bestätigt und Bestätigung an den Kunden versendet.':'Status geändert und Kunde per E-Mail informiert.'):'Status wurde gespeichert. Keine Kunden-E-Mail hinterlegt – es wurde keine E-Mail versendet.',false,true)}catch(mailError){console.error(mailError);show('Status wurde gespeichert, die automatische E-Mail konnte aber nicht versendet werden.',true)}await loadReservations()}
window.deleteBlock=async function(id){if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]').filter(r=>r.id!==id);localStorage.setItem('rental_demo_reservations',JSON.stringify(rs));show('Sperrzeit wurde aufgehoben.',false,true);await loadReservations();return}const {error}=await db.from('reservations').delete().eq('id',id).eq('status','blocked');if(error)return show(error.message,true);show('Sperrzeit wurde aufgehoben.',false,true);await loadReservations()}
async function createBlock(){const productId=el('blockProduct').value,from=el('blockFrom').value,to=el('blockTo').value,sh=el('blockStartHalf').value,eh=el('blockEndHalf').value,reason=el('blockReason').value.trim()||'Interne Sperre';if(!productId||!from||!to||to<from||periodUnits(from,to,sh,eh)<=0)return show('Bitte einen gültigen Zeitraum wählen.',true);try{if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]');const p=products.find(x=>x.id===productId);rs.push({id:crypto.randomUUID(),product_id:productId,product_name:p?.name||productId,from_date:from,to_date:to,start_half:sh,end_half:eh,rental_mode:(from===to&&sh===eh?(sh==='am'?'half_am':'half_pm'):'full'),status:'blocked',note:reason,created_at:new Date().toISOString()});localStorage.setItem('rental_demo_reservations',JSON.stringify(rs))}else{const {data,error}=await db.rpc('create_rental_block_v2',{p_product_id:productId,p_from:from,p_to:to,p_start_half:sh,p_end_half:eh,p_note:reason});if(error)throw error;if(!data)throw new Error('Für diesen Zeitraum ist kein freies Exemplar vorhanden.')}el('blockReason').value='';show('Sperrzeit wurde eingetragen.',false,true);await loadReservations()}catch(e){show(e.message||'Sperrzeit konnte nicht erstellt werden.',true)}}


function parseLocalDate(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d)}
function dateISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function addDaysISO(s,n){const d=parseLocalDate(s);d.setDate(d.getDate()+n);return dateISO(d)}
function formatCalendarDate(s,short=false){const d=parseLocalDate(s);return new Intl.DateTimeFormat('de-CH',short?{weekday:'short',day:'2-digit',month:'2-digit'}:{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}
function reservationInterval(r){const start=parseLocalDate(r.from_date),end=parseLocalDate(r.to_date||r.from_date);if(startHalf(r)==='pm')start.setHours(12);if(endHalf(r)==='am')end.setHours(12);else end.setDate(end.getDate()+1);return [start,end]}
function halfInterval(date,half){const s=parseLocalDate(date),e=parseLocalDate(date);if(half==='am'){e.setHours(12)}else{s.setHours(12);e.setDate(e.getDate()+1)}return [s,e]}
function reservationOverlapsHalf(r,date,half){const [rs,re]=reservationInterval(r),[hs,he]=halfInterval(date,half);return rs<he&&re>hs}
function activeCalendarReservations(productId,date,half){return reservations.filter(r=>String(r.product_id)===String(productId)&&['pending','confirmed','blocked'].includes(r.status)&&reservationOverlapsHalf(r,date,half))}
function slotState(product,date,half){
  const qty=Math.max(0,Number(product.quantity||0));
  const rs=activeCalendarReservations(product.id,date,half);
  const unitKeys=new Set(rs.map(r=>r.internal_name||r.id));const occupied=Math.min(qty,unitKeys.size),free=Math.max(0,qty-occupied);
  let cls='free',label=qty>1?`${qty} frei`:'frei';
  if(rs.length){
    if(free>0){cls='partial';label=`${free}/${qty} frei`}
    else if(rs.every(r=>r.status==='blocked')){cls='blocked';label='gesperrt'}
    else if(rs.some(r=>r.status==='confirmed')){cls='confirmed';label='belegt'}
    else{cls='pending';label='Anfrage'}
  }
  const detail=rs.map(r=>r.status==='blocked'?`Service: ${r.note||'interne Sperre'}`:`${statusName(r.status)}: ${r.name||r.company||'Kunde'}`).join(' · ');
  return {qty,rs,occupied,free,cls,label,detail};
}
function canCalendarBook(product,date,mode){
  const am=slotState(product,date,'am'),pm=slotState(product,date,'pm');
  if(mode==='half_am')return am.free>0;
  if(mode==='half_pm')return pm.free>0;
  const occupiedUnits=new Set([...am.rs,...pm.rs].map(r=>r.internal_name||r.id));
  return occupiedUnits.size<Math.max(0,Number(product.quantity||0));
}
function calendarCellTitle(product,date){
  const am=slotState(product,date,'am'),pm=slotState(product,date,'pm');
  const line=(name,s)=>`${name}: ${s.label}${s.detail?' – '+s.detail:''}`;
  return `${product.name} · ${formatCalendarDate(date)}\n${line('Vormittag',am)}\n${line('Nachmittag',pm)}`;
}
function renderOccupancyCalendar(){
  const box=el('occupancyCalendar');if(!box||!products.length)return;
  const days=Math.max(1,Number(el('calendarDays')?.value||14));
  const cat=el('calendarCategory')?.value||'all';
  const list=products.filter(p=>p.active!==false&&(cat==='all'||p.category===cat));
  const dates=Array.from({length:days},(_,i)=>addDaysISO(calendarStart,i));
  const last=dates[dates.length-1];
  if(el('calendarRangeLabel'))el('calendarRangeLabel').textContent=`${formatCalendarDate(calendarStart)} – ${formatCalendarDate(last)}`;
  const cols=`minmax(190px, 1.55fr) repeat(${dates.length}, minmax(58px, .48fr))`;
  const head=`<div class="calendar-row calendar-head" style="grid-template-columns:${cols}"><div class="calendar-device-head">Mietgerät</div>${dates.map(d=>{const dt=parseLocalDate(d),weekend=[0,6].includes(dt.getDay()),isToday=d===today();return `<div class="calendar-day-head${weekend?' weekend':''}${isToday?' today':''}"><strong>${new Intl.DateTimeFormat('de-CH',{weekday:'short'}).format(dt)}</strong><span>${new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit'}).format(dt)}</span></div>`}).join('')}</div>`;
  const rows=list.map(p=>`<div class="calendar-row" style="grid-template-columns:${cols}"><div class="calendar-device"><strong>${esc(p.name)}</strong><span>${esc(p.category)} · ${Number(p.quantity||0)} Stk.</span></div>${dates.map(d=>{const am=slotState(p,d,'am'),pm=slotState(p,d,'pm'),mode=el('calendarClickMode')?.value||'full',can=canCalendarBook(p,d,mode);return `<button type="button" class="calendar-cell${can?' bookable':' not-bookable'}" data-product="${p.id}" data-date="${d}" title="${esc(calendarCellTitle(p,d))}" aria-label="${esc(p.name+' '+d)}"><span class="calendar-half am ${am.cls}"><b>VM</b><small>${esc(am.label)}</small></span><span class="calendar-half pm ${pm.cls}"><b>NM</b><small>${esc(pm.label)}</small></span></button>`}).join('')}</div>`).join('');
  box.innerHTML=head+(rows||'<div class="calendar-empty">Keine aktiven Mietgeräte in dieser Kategorie.</div>');
  box.querySelectorAll('.calendar-cell.bookable').forEach(btn=>btn.addEventListener('click',()=>prefillQuickRentalFromCalendar(btn.dataset.product,btn.dataset.date)));
}
function prefillQuickRentalFromCalendar(productId,date){
  if(!el('quickRentalForm'))return;
  const mode=el('calendarClickMode')?.value||'full';
  const map={full:['am','pm'],half_am:['am','am'],half_pm:['pm','pm']};const [sh,eh]=map[mode]||map.full;
  el('quickProduct').value=productId;el('quickFrom').value=date;el('quickTo').value=date;el('quickStartHalf').value=sh;el('quickEndHalf').value=eh;el('quickTo').min=date;
  fillLocationSelects(productId,'quick');updateQuickPrice();
  el('quickRentalForm').scrollIntoView({behavior:'smooth',block:'center'});
  el('quickName')?.focus({preventScroll:true});
}
function initOccupancyCalendar(){
  if(!el('occupancyCalendar'))return;
  calendarStart=today();
  el('calendarCategory')?.addEventListener('change',renderOccupancyCalendar);
  el('calendarDays')?.addEventListener('change',renderOccupancyCalendar);
  el('calendarClickMode')?.addEventListener('change',renderOccupancyCalendar);
  el('calendarPrev')?.addEventListener('click',()=>{calendarStart=addDaysISO(calendarStart,-Number(el('calendarDays')?.value||14));renderOccupancyCalendar()});
  el('calendarNext')?.addEventListener('click',()=>{calendarStart=addDaysISO(calendarStart,Number(el('calendarDays')?.value||14));renderOccupancyCalendar()});
  el('calendarToday')?.addEventListener('click',()=>{calendarStart=today();renderOccupancyCalendar()});
  renderOccupancyCalendar();
}

function quickRentalUnits(){return periodUnits(el('quickFrom')?.value,el('quickTo')?.value,el('quickStartHalf')?.value||'am',el('quickEndHalf')?.value||'pm')}
function quickRateFor(p){
  if(!p)return 0;
  const u=quickRentalUnits();
  const tier20=p.tier20_price??p.tier20;
  const tier5=p.tier5_price??p.tier5;
  if(p.category==='Generatoren'&&u>=20&&tier20!=null)return Number(tier20);
  if(p.category==='Generatoren'&&u>=5&&tier5!=null)return Number(tier5);
  return Number(p.day_price||0);
}
function quickMoney(n){return new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF'}).format(Number(n||0))}
function updateQuickPrice(){
  if(!el('quickPriceBox'))return;
  const p=products.find(x=>String(x.id)===String(el('quickProduct')?.value));
  const u=quickRentalUnits();
  if(!p||!u){el('quickPriceBox').textContent='Mietpreis wird nach Geräte- und Datumswahl berechnet.';return}
  const rate=quickRateFor(p),total=rate*u;
  const generatorNote=p.category==='Generatoren'?` · Tarif ${quickMoney(rate)}/Tag`:'';
  el('quickPriceBox').innerHTML=`Voraussichtlicher Mietpreis: <strong>${quickMoney(total)}</strong><span>${unitsLabel(u)}${generatorNote}</span>`;
}
function initQuickRental(){
  if(!el('quickRentalForm'))return;
  const t=today();el('quickFrom').min=t;el('quickTo').min=t;el('quickFrom').value=t;el('quickTo').value=t;el('quickStartHalf').value='am';el('quickEndHalf').value='pm';
  const sync=()=>{el('quickTo').min=el('quickFrom').value;if(el('quickTo').value<el('quickFrom').value)el('quickTo').value=el('quickFrom').value;if(el('quickFrom').value===el('quickTo').value&&el('quickStartHalf').value==='pm'&&el('quickEndHalf').value==='am')el('quickEndHalf').value='pm';updateQuickPrice()};
  ['quickFrom','quickTo','quickStartHalf','quickEndHalf','quickProduct'].forEach(id=>el(id).addEventListener('change',sync));sync();
}
async function createQuickRental(ev){
  ev.preventDefault();const submit=ev.submitter;if(submit.disabled)return;
  if(isDemo)return show('Die Schnellerfassung benötigt die Live-Datenbank.',true);
  const args={
    p_product_id:el('quickProduct').value,
    p_from:el('quickFrom').value,
    p_to:el('quickTo').value,
    p_start_half:el('quickStartHalf').value,
    p_end_half:el('quickEndHalf').value,
    p_name:el('quickName').value.trim(),
    p_company:el('quickCompany').value.trim()||null,
    p_email:el('quickEmail').value.trim()||null,
    p_phone:el('quickPhone').value.trim(),
    p_address:el('quickAddress').value.trim()||null,
    p_note:el('quickNote').value.trim()||null,
    p_long_term:el('quickLongTerm').checked,
    p_pickup_location:el('quickPickup').value||null,
    p_return_location:el('quickReturn').value||null,
    p_status:el('quickStatus').value
  };
  if(!args.p_product_id||!args.p_from||!args.p_to||args.p_to<args.p_from||periodUnits(args.p_from,args.p_to,args.p_start_half,args.p_end_half)<=0)return show('Bitte einen gültigen Mietzeitraum wählen.',true);
  if(!args.p_name||!args.p_phone)return show('Kunde/Name und Telefonnummer sind erforderlich.',true);
  try{
    submit.disabled=true;const {data,error}=await db.rpc('admin_create_rental_v3',args);
    if(error)throw error;
    if(!data)throw new Error('Für den gewählten Zeitraum ist kein freies Exemplar verfügbar.');
    const status=args.p_status==='confirmed'?'bestätigte Vermietung':'Anfrage';
    el('quickName').value='';el('quickCompany').value='';el('quickEmail').value='';el('quickPhone').value='';el('quickAddress').value='';el('quickNote').value='';el('quickLongTerm').checked=false;
    let mailOk=true;try{await sendStatusEmail(data,'direct')}catch(e){console.error(e);mailOk=false;}show(mailOk?`Schnellerfassung gespeichert (${status}). Standorte und Untervermieter wurden informiert.`:`Schnellerfassung gespeichert (${status}). Die Benachrichtigung ist noch offen; bitte den Versand erneut auslösen.`,!mailOk,mailOk);await loadPartnerAdmin();
    await loadReservations();
  }catch(e){show(e.message||'Vermietung konnte nicht erfasst werden.',true)}finally{submit.disabled=false}
}

async function logout(){if(!isDemo)await db.auth.signOut();el('adminApp').classList.add('hidden');el('loginPanel').classList.remove('hidden')}
el('quickLocations').innerHTML=locationSelectHtml('quick');
['quickPickup','quickReturn'].forEach(id=>el(id).addEventListener('change',()=>updateLocationHints('quick')));
el('quickProduct').addEventListener('change',()=>fillLocationSelects(el('quickProduct').value,'quick'));initAdminSettings();initPartnerAdmin();
el('loginBtn').addEventListener('click',login);el('refreshBtn').addEventListener('click',loadAll);el('logoutBtn').addEventListener('click',logout);el('statusFilter').addEventListener('change',render);el('reservationSearch')?.addEventListener('input',render);el('blockBtn').addEventListener('click',createBlock);el('quickRentalForm')?.addEventListener('submit',createQuickRental);initBlockDates();initQuickRental();initOccupancyCalendar();
(async()=>{if(isDemo){el('adminEmail').placeholder='Demo: keine Anmeldung nötig';el('adminPassword').placeholder='Demo: keine Anmeldung nötig';return}const {data}=await db.auth.getSession();if(data.session)showAdmin()})();


function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function renderProductAdmin(){const box=el('productAdminList');if(!box)return;box.innerHTML=products.map(p=>`<article class="product-admin-card ${p.active===false?'inactive':''}">${p.image_url?`<img class="product-admin-thumb" src="${esc(p.image_url)}" alt="">`:'<div class="product-admin-thumb"></div>'}<div><h3>${esc(p.name)} <span class="product-admin-badge ${p.active===false?'':'active'}">${p.active===false?'inaktiv':'aktiv'}</span></h3><div class="product-admin-meta">${esc(p.category)} · Bestand ${Number(p.quantity||0)} Stück</div><div class="product-admin-price">CHF ${Number(p.day_price||0).toFixed(2)} / Tag</div>${p.category==='Generatoren'?`<div class="product-admin-meta">ab 5 T.: CHF ${p.tier5_price??'–'} · ab 20 T.: CHF ${p.tier20_price??'–'}</div>`:''}</div><div class="product-admin-actions"><button class="btn smallbtn" onclick="editProduct('${p.id}')">Bearbeiten</button></div></article>`).join('')||'<div class="muted">Keine Mietgeräte vorhanden.</div>'}
function setProductImagePreview(src='',removable=false){el('editImagePreview').classList.toggle('hidden',!src);el('editImagePreviewImg').src=src;el('removeImageLine').classList.toggle('hidden',!removable);el('removeImage').checked=false}
window.editProduct=function(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;el('productForm').reset();el('productDialogTitle').textContent='Mietgerät bearbeiten';el('editProductId').value=p.id;el('editName').value=p.name||'';el('editCategory').value=p.category||'';el('editSubtitle').value=p.subtitle||'';el('editDayPrice').value=p.day_price??0;el('editQuantity').value=p.quantity??0;el('editTier5').value=p.tier5_price??'';el('editTier20').value=p.tier20_price??'';el('editImageUrl').value=p.image_url||'';setProductImagePreview(p.image_url||'',!!p.image_url);el('editSortOrder').value=p.sort_order??100;el('editLongTerm').checked=!!p.long_term;el('editActive').checked=p.active!==false;el('productDialog').showModal()}
function newProduct(){el('productForm').reset();setProductImagePreview();el('productDialogTitle').textContent='Neues Mietgerät';el('editProductId').value='';el('editQuantity').value=1;el('editSortOrder').value=(Math.max(0,...products.map(p=>Number(p.sort_order)||0))+10);el('editActive').checked=true;el('productDialog').showModal()}
async function saveProduct(ev){ev.preventDefault();if(isDemo)return show('Die Geräteverwaltung benötigt die Live-Datenbank.',true);const button=ev.submitter,id=el('editProductId').value||null,file=el('editImageFile').files[0];if(file&&file.size>5*1024*1024)return show('Das Bild ist grösser als 5 MB.',true);button.disabled=true;button.textContent=file?'Bild hochladen …':'Speichern …';try{let imageUrl=el('removeImage').checked?null:(el('editImageUrl').value.trim()||null);if(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''),path=`uploads/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;const {error:uploadError}=await db.storage.from('rental-product-images').upload(path,file,{cacheControl:'3600',upsert:false});if(uploadError)throw uploadError;imageUrl=db.storage.from('rental-product-images').getPublicUrl(path).data.publicUrl}const args={p_id:id,p_category:el('editCategory').value.trim(),p_name:el('editName').value.trim(),p_subtitle:el('editSubtitle').value.trim()||null,p_day_price:Number(el('editDayPrice').value),p_tier5_price:el('editTier5').value===''?null:Number(el('editTier5').value),p_tier20_price:el('editTier20').value===''?null:Number(el('editTier20').value),p_long_term:el('editLongTerm').checked,p_image_url:imageUrl,p_active:el('editActive').checked,p_sort_order:Number(el('editSortOrder').value||100),p_quantity:Number(el('editQuantity').value||0)};const {error}=await db.rpc('admin_save_product',args);if(error)throw error;el('productDialog').close();show(id?'Mietgerät wurde aktualisiert.':'Neues Mietgerät wurde angelegt.',false,true);await loadProducts();await loadAdminSettings()}catch(error){show('Speichern fehlgeschlagen: '+error.message,true)}finally{button.disabled=false;button.textContent='Mietgerät speichern'}}
el('newProductBtn')?.addEventListener('click',newProduct);el('closeProductDialog')?.addEventListener('click',()=>el('productDialog').close());el('productForm')?.addEventListener('submit',saveProduct);
el('editImageFile')?.addEventListener('change',()=>{const file=el('editImageFile').files[0];if(file)setProductImagePreview(URL.createObjectURL(file),false)});
