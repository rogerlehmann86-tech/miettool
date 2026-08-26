const cfg = window.RENTAL_CONFIG || {};
const isDemo = !cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR_');
const db = isDemo ? null : window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
const el=id=>document.getElementById(id);let reservations=[];let products=[];
function show(msg,error=false,success=false){const n=el('adminNotice');n.textContent=msg;n.className='notice'+(error?' error':'')+(success?' success':'')}
function modeName(m){return {full:'Ganzer Tag / mehrere Tage',half_am:'½ Tag Vormittag',half_pm:'½ Tag Nachmittag'}[m]||m}
function statusName(s){return {pending:'Anfrage',confirmed:'Bestätigt',cancelled:'Abgelehnt / storniert',blocked:'Gesperrt / Service'}[s]||s}
function today(){return new Date().toISOString().slice(0,10)}
function rentalEnd(r){
  if(!r?.to_date)return null;
  if(r.rental_mode==='half_am')return new Date(`${r.from_date}T12:00:00`);
  return new Date(`${r.to_date}T23:59:59.999`);
}
function isArchived(r){const end=rentalEnd(r);return r.status==='confirmed'&&end&&end.getTime()<Date.now()}
function dateSearchValue(v){if(!v)return '';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}.${m[2]}.${m[1]}`:String(v)}
function searchableText(r){return [r.product_name,r.product_id,r.name,r.company,r.email,r.phone,r.note,r.from_date,r.to_date,dateSearchValue(r.from_date),dateSearchValue(r.to_date),modeName(r.rental_mode),statusName(r.status),isArchived(r)?'archiv':''].filter(Boolean).join(' ').toLocaleLowerCase('de-CH')}
function updateFilterLabels(){
  const counts={
    pending:reservations.filter(r=>r.status==='pending').length,
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

function initBlockDates(){const t=today();el('blockFrom').min=t;el('blockTo').min=t;el('blockFrom').value=t;el('blockTo').value=t;el('blockFrom').addEventListener('change',()=>{el('blockTo').min=el('blockFrom').value;if(el('blockTo').value<el('blockFrom').value)el('blockTo').value=el('blockFrom').value});el('blockMode').addEventListener('change',()=>{const half=el('blockMode').value.startsWith('half_');el('blockTo').disabled=half;if(half)el('blockTo').value=el('blockFrom').value})}
async function login(){if(isDemo){el('loginPanel').classList.add('hidden');el('adminApp').classList.remove('hidden');await loadAll();return}const {error}=await db.auth.signInWithPassword({email:el('adminEmail').value,password:el('adminPassword').value});if(error)return show(error.message,true);showAdmin()}
async function showAdmin(){el('loginPanel').classList.add('hidden');el('adminApp').classList.remove('hidden');await loadAll()}
async function loadAll(){await loadProducts();await loadReservations()}
async function loadProducts(){if(isDemo){products=[{id:'vertikutierer',name:'Vertikutierer'},{id:'holzhaecksler',name:'Holzhäcksler'},{id:'heckenschere',name:'Heckenschere'},{id:'balkenmaeher',name:'Balkenmäher'},{id:'bodenfraese',name:'Bodenfräse'},{id:'motorhacke',name:'Motorhacke'},{id:'motorsaege-462',name:'Motorsäge 50 cm'},{id:'motorsaege-211',name:'Motorsäge 35 cm'},{id:'stabheckenschere',name:'Stabheckenschere'},{id:'fadenmaeher',name:'Fadenmäher'},{id:'motorsense',name:'Rücktragbare Motorsense'},{id:'plattenvibrator',name:'Plattenvibrator'},{id:'erdbohrer',name:'Erdbohrer'},{id:'hochdruckreiniger',name:'Hochdruckreiniger'},{id:'tauchpumpe',name:'Tauchpumpe'},{id:'holzspalter',name:'Holzspalter'},{id:'unkrautbuerste',name:'Unkrautbürste'},{id:'eu20i',name:'Honda EU20i'},{id:'cx7000t',name:'CGM CX7000T'},{id:'v18y',name:'CGM V18Y'},{id:'v60f',name:'CGM V60F'}]}else{const {data,error}=await db.from('products_with_quantity').select('*').order('sort_order');if(error)return show(error.message,true);products=data||[]}const activeProducts=products.filter(p=>p.active!==false);el('blockProduct').innerHTML=activeProducts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');if(el('quickProduct'))el('quickProduct').innerHTML=activeProducts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');renderProductAdmin();updateQuickPrice()}
async function loadReservations(){if(isDemo)reservations=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]').map(r=>({...r,product_name:r.product_name||products.find(p=>p.id===r.product_id)?.name||r.product_id}));else{const {data,error}=await db.from('admin_reservations').select('*').order('from_date',{ascending:true});if(error)return show(error.message,true);reservations=data||[]}updateFilterLabels();render()}
function render(){
  const f=el('statusFilter').value;
  const q=(el('reservationSearch')?.value||'').trim().toLocaleLowerCase('de-CH');
  let rs=reservations.filter(r=>{
    const statusOk=f==='all'||(f==='archive'?isArchived(r):(f==='confirmed'?r.status==='confirmed'&&!isArchived(r):r.status===f));
    return statusOk&&(!q||searchableText(r).includes(q));
  });
  if(f==='pending')rs.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  else if(f==='archive')rs.sort((a,b)=>(rentalEnd(b)?.getTime()||0)-(rentalEnd(a)?.getTime()||0));
  else if(f==='confirmed')rs.sort((a,b)=>String(a.from_date||'').localeCompare(String(b.from_date||'')));
  el('reservationList').innerHTML=rs.map(r=>`<article class="reservation ${r.status}${isArchived(r)?' archived':''}"><div class="reservation-head"><div><h3>${r.product_name||r.product_id}</h3><div class="muted">${r.rental_mode==='full'?`${r.from_date} bis ${r.to_date}`:`${r.from_date} · ${modeName(r.rental_mode)}`}${r.long_term?' · Langzeit-Anfrage':''}</div></div><span class="status-pill">${isArchived(r)?'Archiv':statusName(r.status)}</span></div><div class="reservation-details"><div><strong>${r.status==='blocked'?'Sperrgrund':'Kunde'}</strong><br>${r.status==='blocked'?(r.note||'Interne Sperre'):(r.name||'–')}${r.company?'<br>'+r.company:''}</div><div><strong>Kontakt</strong><br>${r.status==='blocked'?'–':`${r.email||'–'}<br>${r.phone||'–'}`}</div><div><strong>Bemerkung</strong><br>${r.note||'–'}</div></div><div class="reservation-actions">${r.status==='blocked'?`<button class="btn danger smallbtn" onclick="deleteBlock('${r.id}')">Sperre aufheben</button>`:`${r.status!=='confirmed'?`<button class="btn success smallbtn" onclick="setStatus('${r.id}','confirmed')">Bestätigen</button>`:''}${r.status!=='cancelled'?`<button class="btn danger smallbtn" onclick="setStatus('${r.id}','cancelled')">Ablehnen / stornieren</button>`:''}`}</div></article>`).join('')||'<div class="panel">Keine passenden Einträge.</div>'
}
window.setStatus=async function(id,status){const current=reservations.find(r=>String(r.id)===String(id));if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]');const r=rs.find(x=>x.id===id);if(r)r.status=status;localStorage.setItem('rental_demo_reservations',JSON.stringify(rs));show('Status wurde geändert.',false,true);await loadReservations();return}const {error}=await db.from('reservations').update({status}).eq('id',id);if(error)return show(error.message,true);const canMail=!!String(current?.email||'').trim();try{if(canMail&&(status==='confirmed'||status==='cancelled'))await sendStatusEmail(id,status);show(canMail?(status==='confirmed'?'Reservation bestätigt und Bestätigung an den Kunden versendet.':'Status geändert und Kunde per E-Mail informiert.'):'Status wurde gespeichert. Keine Kunden-E-Mail hinterlegt – es wurde keine E-Mail versendet.',false,true)}catch(mailError){console.error(mailError);show('Status wurde gespeichert, die automatische E-Mail konnte aber nicht versendet werden.',true)}await loadReservations()}
window.deleteBlock=async function(id){if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]').filter(r=>r.id!==id);localStorage.setItem('rental_demo_reservations',JSON.stringify(rs));show('Sperrzeit wurde aufgehoben.',false,true);await loadReservations();return}const {error}=await db.from('reservations').delete().eq('id',id).eq('status','blocked');if(error)return show(error.message,true);show('Sperrzeit wurde aufgehoben.',false,true);await loadReservations()}
async function createBlock(){const productId=el('blockProduct').value,from=el('blockFrom').value,to=el('blockTo').value,mode=el('blockMode').value,reason=el('blockReason').value.trim()||'Interne Sperre';if(!productId||!from||!to||to<from)return show('Bitte einen gültigen Zeitraum wählen.',true);try{if(isDemo){const rs=JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]');const p=products.find(x=>x.id===productId);rs.push({id:crypto.randomUUID(),product_id:productId,product_name:p?.name||productId,from_date:from,to_date:to,rental_mode:mode,status:'blocked',note:reason,created_at:new Date().toISOString()});localStorage.setItem('rental_demo_reservations',JSON.stringify(rs))}else{const {data,error}=await db.rpc('create_rental_block',{p_product_id:productId,p_from:from,p_to:to,p_mode:mode,p_note:reason});if(error)throw error;if(!data)throw new Error('Für diesen Zeitraum ist kein freies Exemplar vorhanden.')}el('blockReason').value='';show('Sperrzeit wurde eingetragen.',false,true);await loadReservations()}catch(e){show(e.message||'Sperrzeit konnte nicht erstellt werden.',true)}}

function quickRentalUnits(){
  const m=el('quickMode')?.value||'full';
  if(m==='half_am'||m==='half_pm')return 0.5;
  const a=el('quickFrom')?.value,b=el('quickTo')?.value;
  if(!a||!b)return 0;
  return Math.max(1,Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)+1);
}
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
  el('quickPriceBox').innerHTML=`Voraussichtlicher Mietpreis: <strong>${quickMoney(total)}</strong><span>${u===0.5?'½ Tag':`${u} Tag(e)`}${generatorNote}</span>`;
}
function initQuickRental(){
  if(!el('quickRentalForm'))return;
  const t=today();
  el('quickFrom').min=t;el('quickTo').min=t;el('quickFrom').value=t;el('quickTo').value=t;
  const sync=()=>{
    const half=el('quickMode').value.startsWith('half_');
    el('quickTo').disabled=half;
    if(half)el('quickTo').value=el('quickFrom').value;
    else if(el('quickTo').value<el('quickFrom').value)el('quickTo').value=el('quickFrom').value;
    el('quickTo').min=el('quickFrom').value;
    updateQuickPrice();
  };
  el('quickFrom').addEventListener('change',sync);
  el('quickTo').addEventListener('change',updateQuickPrice);
  el('quickMode').addEventListener('change',sync);
  el('quickProduct').addEventListener('change',updateQuickPrice);
  sync();
}
async function createQuickRental(ev){
  ev.preventDefault();
  if(isDemo)return show('Die Schnellerfassung benötigt die Live-Datenbank.',true);
  const args={
    p_product_id:el('quickProduct').value,
    p_from:el('quickFrom').value,
    p_to:el('quickTo').value,
    p_mode:el('quickMode').value,
    p_name:el('quickName').value.trim(),
    p_company:el('quickCompany').value.trim()||null,
    p_email:el('quickEmail').value.trim()||null,
    p_phone:el('quickPhone').value.trim(),
    p_address:el('quickAddress').value.trim()||null,
    p_note:el('quickNote').value.trim()||null,
    p_long_term:el('quickLongTerm').checked,
    p_status:el('quickStatus').value
  };
  if(!args.p_product_id||!args.p_from||!args.p_to||args.p_to<args.p_from)return show('Bitte einen gültigen Mietzeitraum wählen.',true);
  if(!args.p_name||!args.p_phone)return show('Kunde/Name und Telefonnummer sind erforderlich.',true);
  try{
    const {data,error}=await db.rpc('admin_create_rental',args);
    if(error)throw error;
    if(!data)throw new Error('Für den gewählten Zeitraum ist kein freies Exemplar verfügbar.');
    const status=args.p_status==='confirmed'?'bestätigte Vermietung':'Anfrage';
    el('quickName').value='';el('quickCompany').value='';el('quickEmail').value='';el('quickPhone').value='';el('quickAddress').value='';el('quickNote').value='';el('quickLongTerm').checked=false;
    show(`Schnellerfassung gespeichert (${status}).${args.p_email?' Kunden-E-Mail wurde bewusst nicht automatisch versendet.':' Keine E-Mail-Adresse hinterlegt.'}`,false,true);
    await loadReservations();
  }catch(e){show(e.message||'Vermietung konnte nicht erfasst werden.',true)}
}

async function logout(){if(!isDemo)await db.auth.signOut();el('adminApp').classList.add('hidden');el('loginPanel').classList.remove('hidden')}
el('loginBtn').addEventListener('click',login);el('refreshBtn').addEventListener('click',loadAll);el('logoutBtn').addEventListener('click',logout);el('statusFilter').addEventListener('change',render);el('reservationSearch')?.addEventListener('input',render);el('blockBtn').addEventListener('click',createBlock);el('quickRentalForm')?.addEventListener('submit',createQuickRental);initBlockDates();initQuickRental();
(async()=>{if(isDemo){el('adminEmail').placeholder='Demo: keine Anmeldung nötig';el('adminPassword').placeholder='Demo: keine Anmeldung nötig';return}const {data}=await db.auth.getSession();if(data.session)showAdmin()})();


function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function renderProductAdmin(){const box=el('productAdminList');if(!box)return;box.innerHTML=products.map(p=>`<article class="product-admin-card ${p.active===false?'inactive':''}">${p.image_url?`<img class="product-admin-thumb" src="${esc(p.image_url)}" alt="">`:'<div class="product-admin-thumb"></div>'}<div><h3>${esc(p.name)} <span class="product-admin-badge ${p.active===false?'':'active'}">${p.active===false?'inaktiv':'aktiv'}</span></h3><div class="product-admin-meta">${esc(p.category)} · Bestand ${Number(p.quantity||0)} Stück</div><div class="product-admin-price">CHF ${Number(p.day_price||0).toFixed(2)} / Tag</div>${p.category==='Generatoren'?`<div class="product-admin-meta">ab 5 T.: CHF ${p.tier5_price??'–'} · ab 20 T.: CHF ${p.tier20_price??'–'}</div>`:''}</div><div class="product-admin-actions"><button class="btn smallbtn" onclick="editProduct('${p.id}')">Bearbeiten</button></div></article>`).join('')||'<div class="muted">Keine Mietgeräte vorhanden.</div>'}
window.editProduct=function(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;el('productDialogTitle').textContent='Mietgerät bearbeiten';el('editProductId').value=p.id;el('editName').value=p.name||'';el('editCategory').value=p.category||'';el('editSubtitle').value=p.subtitle||'';el('editDayPrice').value=p.day_price??0;el('editQuantity').value=p.quantity??0;el('editTier5').value=p.tier5_price??'';el('editTier20').value=p.tier20_price??'';el('editImageUrl').value=p.image_url||'';el('editSortOrder').value=p.sort_order??100;el('editLongTerm').checked=!!p.long_term;el('editActive').checked=p.active!==false;el('productDialog').showModal()}
function newProduct(){el('productForm').reset();el('productDialogTitle').textContent='Neues Mietgerät';el('editProductId').value='';el('editQuantity').value=1;el('editSortOrder').value=(Math.max(0,...products.map(p=>Number(p.sort_order)||0))+10);el('editActive').checked=true;el('productDialog').showModal()}
async function saveProduct(ev){ev.preventDefault();if(isDemo)return show('Die Geräteverwaltung benötigt die Live-Datenbank.',true);const id=el('editProductId').value||null;const args={p_id:id,p_category:el('editCategory').value.trim(),p_name:el('editName').value.trim(),p_subtitle:el('editSubtitle').value.trim()||null,p_day_price:Number(el('editDayPrice').value),p_tier5_price:el('editTier5').value===''?null:Number(el('editTier5').value),p_tier20_price:el('editTier20').value===''?null:Number(el('editTier20').value),p_long_term:el('editLongTerm').checked,p_image_url:el('editImageUrl').value.trim()||null,p_active:el('editActive').checked,p_sort_order:Number(el('editSortOrder').value||100),p_quantity:Number(el('editQuantity').value||0)};const {error}=await db.rpc('admin_save_product',args);if(error)return show(error.message,true);el('productDialog').close();show(id?'Mietgerät wurde aktualisiert.':'Neues Mietgerät wurde angelegt.',false,true);await loadProducts()}
el('newProductBtn')?.addEventListener('click',newProduct);el('closeProductDialog')?.addEventListener('click',()=>el('productDialog').close());el('productForm')?.addEventListener('submit',saveProduct);
