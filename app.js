const cfg = window.RENTAL_CONFIG || {};
const isDemo = !cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR_');
const db = isDemo ? null : window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

const demoProducts = [
  {id:'vertikutierer',category:'Gartengeräte',name:'Vertikutierer',subtitle:'4-Takt Benzinmotor · 40 cm Arbeitsbreite',day_price:95,quantity:2,image_url:'assets/vertikutierer.jpeg'},
  {id:'holzhaecksler',category:'Gartengeräte',name:'Holzhäcksler',subtitle:'4-Takt Benzinmotor · max. 45 mm Astdurchmesser',day_price:140,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/c8/eliet-country-c8efdb44.jpeg'},
  {id:'heckenschere',category:'Gartengeräte',name:'Heckenschere',subtitle:'2-Takt Benzinmotor · 60 cm Messerlänge',day_price:80,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/f2/hs-82r-f223a6b9.jpeg'},
  {id:'balkenmaeher',category:'Gartengeräte',name:'Balkenmäher',subtitle:'4-Takt Benzinmotor · 120 cm Arbeitsbreite · Schaltgetriebe',day_price:150,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/1f/koeppl-500er-1fa8a247.jpeg'},
  {id:'bodenfraese',category:'Gartengeräte',name:'Bodenfräse',subtitle:'4-Takt Benzinmotor · 50 cm Arbeitsbreite · Schaltgetriebe',day_price:150,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/d6/koeppl-fraeseII-d67fd786.jpeg'},
  {id:'motorhacke',category:'Gartengeräte',name:'Motorhacke',subtitle:'4-Takt Benzinmotor · 40 cm Arbeitsbreite · 1V/1R',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/7b/0700-7b136b84.jpeg'},
  {id:'motorsaege-462',category:'Gartengeräte',name:'Motorsäge 50 cm',subtitle:'2-Takt Benzinmotor · 50 cm Schwert',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/fe/Stihl_MS362C-M-fea01e26.jpeg'},
  {id:'motorsaege-211',category:'Gartengeräte',name:'Motorsäge 35 cm',subtitle:'2-Takt Benzinmotor · 35 cm Schwert',day_price:60,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/12/ms162-1226cbca.jpeg'},
  {id:'stabheckenschere',category:'Gartengeräte',name:'Stabheckenschere',subtitle:'inkl. Motoreinheit · 50 cm Messer · 135° schwenkbar',day_price:70,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/3d/hl94c-e_4-3de4a3b7.jpeg'},
  {id:'fadenmaeher',category:'Gartengeräte',name:'Fadenmäher',subtitle:'inkl. Motoreinheit · Halbautomat-Fadenkopf · 2.4 mm',day_price:50,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/ca/fs94r-ca8b8f10.jpeg'},
  {id:'motorsense',category:'Gartengeräte',name:'Rücktragbare Motorsense',subtitle:'2-Takt Benzinmotor · Fadenkopf oder Dickichtmesser',day_price:80,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/9f/fr480-9fd8d9bd.jpeg'},
  {id:'plattenvibrator',category:'Baugeräte',name:'Plattenvibrator',subtitle:'4-Takt Benzinmotor · 36 cm · 83 kg · vorwärtslaufend',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/0e/bvp-10-36-0e400188.jpeg'},
  {id:'erdbohrer',category:'Baugeräte',name:'Erdbohrer',subtitle:'2-Takt Benzinmotor · Bohrer 40/90/150/250 mm',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/93/STIHL_BT_130-101-81-93ae5991.jpeg'},
  {id:'hochdruckreiniger',category:'Baugeräte',name:'Hochdruckreiniger',subtitle:'230 V · 115 bar · 500 l/h · inkl. Flächenreiniger',day_price:70,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/ae/hd5-12cxplus-fr-2-ac2db799-ae6de96a.jpeg'},
  {id:'tauchpumpe',category:'Baugeräte',name:'Tauchpumpe',subtitle:'230 V · 9600 l/h · inkl. 15 m Ablaufschlauch',day_price:75,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/9c/citypump-9cd77a2f.jpeg'},
  {id:'holzspalter',category:'Diverse Geräte',name:'Holzspalter',subtitle:'380 V · 6 Tonnen',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/25/Bindeberger-258f34b8.jpeg'},
  {id:'unkrautbuerste',category:'Diverse Geräte',name:'Unkrautbürste',subtitle:'56 V Akku · 35 cm Arbeitsbreite · inkl. 3 Zopfbürsten',day_price:90,quantity:1,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/1d/as-weedhex-1dabfa55.jpeg'},
  {id:'eu20i',category:'Generatoren',name:'Honda EU20i',subtitle:'1.6 / 2.0 kVA · 230 V · Benzin · Inverter',day_price:50,tier5:40,tier20:30,quantity:1,long_term:true,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/2f/23_1390_02-2f8ff4c4.jpeg'},
  {id:'cx7000t',category:'Generatoren',name:'CGM CX7000T',subtitle:'7 kVA · 230/400 V · Benzin · AVR',day_price:150,tier5:120,tier20:90,quantity:1,long_term:true,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/e6/cx7000t_auspuff_seitlich-e6d9c2bb.jpeg'},
  {id:'v18y',category:'Generatoren',name:'CGM V18Y',subtitle:'18 kVA · 230/400 V · Diesel · inkl. Transportanhänger',day_price:250,tier5:200,tier20:160,quantity:1,long_term:true,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/b7/CGM-10kVA-Industrial-b72de830.jpeg'},
  {id:'v60f',category:'Generatoren',name:'CGM V60F',subtitle:'60 kVA · 230/400 V · Diesel · exkl. Transport & Zubehör',day_price:490,tier5:392,tier20:294,quantity:1,long_term:true,image_url:'https://lehmann-gt.ch/wp-content/themes/yootheme/cache/35/CGM-60kVA-Rental-357aca0b.jpeg'}
];

const el=id=>document.getElementById(id); let products=[]; let availability={}; let customerCalendarProduct=null; let customerCalendarStart=null;
function isoToday(){return new Date().toISOString().slice(0,10)}
function money(n){return new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF'}).format(n)}
function dayNumber(s){return Math.round(new Date(s+'T12:00:00Z').getTime()/86400000)}
function halfIndex(date,half){return dayNumber(date)*2+(half==='pm'?1:0)}
function rentalUnits(){const a=el('fromDate').value,b=el('toDate').value;if(!a||!b)return 0;const n=halfIndex(b,el('toHalf').value)-halfIndex(a,el('fromHalf').value)+1;return n>0?n/2:0}
function rateFor(p){const u=rentalUnits();if(p.category==='Generatoren'&&u>=20&&p.tier20)return Number(p.tier20);if(p.category==='Generatoren'&&u>=5&&p.tier5)return Number(p.tier5);return Number(p.day_price||0)}
function totalFor(p){return rateFor(p)*rentalUnits()}
function halfStartName(h){return h==='pm'?'Nachmittag':'Vormittag'}
function halfEndName(h){return h==='am'?'Mittag':'Abend'}
function unitsLabel(u){return Number.isInteger(u)?`${u} Tag(e)`: `${String(u).replace('.',',')} Tag(e)`}
function periodLabel(){const a=el('fromDate').value,b=el('toDate').value,sh=el('fromHalf').value,eh=el('toHalf').value,u=rentalUnits();if(a===b&&sh==='am'&&eh==='am')return `${a} · ½ Tag Vormittag`;if(a===b&&sh==='pm'&&eh==='pm')return `${a} · ½ Tag Nachmittag`;return `${a} ${halfStartName(sh)} bis ${b} ${halfEndName(eh)} · ${unitsLabel(u)}`}
function toStartEnd(from,to,startHalf,endHalf){const start=new Date(from+'T00:00:00');const end=new Date(to+'T00:00:00');if(startHalf==='pm')start.setHours(12);if(endHalf==='am')end.setHours(12);else end.setDate(end.getDate()+1);return [start,end]}
function overlap(aFrom,aTo,aStart,aEnd,bFrom,bTo,bStart,bEnd){const [as,ae]=toStartEnd(aFrom,aTo,aStart,aEnd);const [bs,be]=toStartEnd(bFrom,bTo,bStart,bEnd);return as<be&&ae>bs}
function legacyHalves(r){return {start_half:r.start_half||(r.rental_mode==='half_pm'?'pm':'am'),end_half:r.end_half||(r.rental_mode==='half_am'?'am':'pm')}}
function validPeriod(){const a=el('fromDate').value,b=el('toDate').value;if(!a||!b||b<a)return false;return halfIndex(b,el('toHalf').value)>=halfIndex(a,el('fromHalf').value)}
function syncPeriod(){if(el('toDate').value<el('fromDate').value)el('toDate').value=el('fromDate').value;el('toDate').min=el('fromDate').value;if(el('fromDate').value===el('toDate').value&&el('fromHalf').value==='pm'&&el('toHalf').value==='am')el('toHalf').value='pm';checkAvailability()}
function initDates(){const t=isoToday();el('fromDate').min=t;el('toDate').min=t;el('fromDate').value=t;el('toDate').value=t;el('fromHalf').value='am';el('toHalf').value='pm';['fromDate','toDate','fromHalf','toHalf'].forEach(id=>el(id).addEventListener('change',syncPeriod))}
async function loadProducts(){if(isDemo)products=demoProducts;else{const {data,error}=await db.from('products_with_quantity').select('*').eq('active',true).order('sort_order');if(error)throw error;products=(data||[]).map(p=>({...p,tier5:p.tier5_price,tier20:p.tier20_price}))}const cats=[...new Set(products.map(p=>p.category))];el('category').innerHTML='<option value="all">Alle Mietgeräte</option>'+cats.map(c=>`<option>${c}</option>`).join('');renderTabs(cats);await checkAvailability()}
function renderTabs(cats){el('categoryTabs').innerHTML=['all',...cats].map(c=>`<button class="category-tab ${c==='all'?'active':''}" data-cat="${c}">${c==='all'?'Alle':c}</button>`).join('');el('categoryTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{el('category').value=b.dataset.cat;renderProducts();syncTabs()}))}
function syncTabs(){el('categoryTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.cat===el('category').value))}
async function getDemoReservations(){return JSON.parse(localStorage.getItem('rental_demo_reservations')||'[]')}


function addDaysISO(dateStr,days){const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function shortDate(dateStr){return new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'2-digit',month:'2-digit'}).format(new Date(dateStr+'T12:00:00'))}
async function loadPublicCalendar(productId,startDate,days=14){
  const p=products.find(x=>String(x.id)===String(productId));
  if(!p)return [];
  if(isDemo){
    const rs=await getDemoReservations(),rows=[];
    for(let i=0;i<days;i++){
      const d=addDaysISO(startDate,i),halves={am:0,pm:0};
      for(const half of ['am','pm']){
        const blocked=rs.filter(r=>{const h=legacyHalves(r);return r.product_id===p.id&&['pending','confirmed','blocked'].includes(r.status)&&overlap(d,d,half,half,r.from_date,r.to_date,h.start_half,h.end_half)}).length;
        halves[half]=Math.max(0,(p.quantity||1)-blocked);
      }
      rows.push({calendar_date:d,am_available:halves.am,pm_available:halves.pm});
    }
    return rows;
  }
  const {data,error}=await db.rpc('public_product_calendar_v2',{p_product_id:p.id,p_from:startDate,p_days:days});
  if(error)throw error;
  return data||[];
}
function customerHalfClass(avail,total){if(avail<=0)return 'busy';if(avail<total)return 'partial';return 'free'}
async function renderCustomerCalendar(){
  const box=el('customerCalendar');
  if(!box||!customerCalendarProduct||!customerCalendarStart)return;
  box.innerHTML='<div class="customer-calendar-loading">Verfügbarkeit wird geladen…</div>';
  try{
    const rows=await loadPublicCalendar(customerCalendarProduct.id,customerCalendarStart,14),total=Number(customerCalendarProduct.quantity||1);
    box.innerHTML=rows.map(r=>{
      const am=Number(r.am_available||0),pm=Number(r.pm_available||0),amClass=customerHalfClass(am,total),pmClass=customerHalfClass(pm,total);
      const qty=n=>total>1?`<small>${n}/${total} frei</small>`:'';
      return `<article class="customer-cal-day"><div class="customer-cal-date">${shortDate(r.calendar_date)}</div>
        <button type="button" class="customer-cal-half ${amClass}" ${am<=0?'disabled':''} onclick="selectCalendarHalf('${r.calendar_date}','am')"><strong>VM</strong>${qty(am)}</button>
        <button type="button" class="customer-cal-half ${pmClass}" ${pm<=0?'disabled':''} onclick="selectCalendarHalf('${r.calendar_date}','pm')"><strong>NM</strong>${qty(pm)}</button></article>`;
    }).join('')||'<div class="panel">Keine Kalenderdaten verfügbar.</div>';
  }catch(e){console.error(e);box.innerHTML='<div class="notice error">Die Verfügbarkeit konnte nicht geladen werden.</div>'}
}
window.openAvailabilityCalendar=async function(id){
  const p=products.find(x=>String(x.id)===String(id));if(!p)return;
  customerCalendarProduct=p;customerCalendarStart=el('fromDate').value||isoToday();
  el('availabilityTitle').textContent=`${p.name} – Verfügbarkeit`;
  el('availabilityDialog').showModal();await renderCustomerCalendar();
}
window.selectCalendarHalf=function(date,half){
  el('fromDate').value=date;el('toDate').value=date;el('fromHalf').value=half;el('toHalf').value=half;
  el('availabilityDialog').close();syncPeriod();
  document.querySelector('.search-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
}

async function sendRentalEmail(reservationId,eventType){if(isDemo)return {demo:true};const fn=cfg.emailFunctionName||'rental-email';const {data,error}=await db.functions.invoke(fn,{body:{reservation_id:reservationId,event:eventType}});if(error)throw error;return data}
async function checkAvailability(){const from=el('fromDate').value,to=el('toDate').value,sh=el('fromHalf').value,eh=el('toHalf').value;if(!validPeriod()){showNotice('Bitte einen gültigen Mietzeitraum wählen.',true);return}availability={};if(isDemo){const rs=await getDemoReservations();for(const p of products){const blocked=rs.filter(r=>{const h=legacyHalves(r);return r.product_id===p.id&&['pending','confirmed','blocked'].includes(r.status)&&overlap(from,to,sh,eh,r.from_date,r.to_date,h.start_half,h.end_half)}).length;availability[p.id]=Math.max(0,(p.quantity||1)-blocked)}}else{for(const p of products){const {data,error}=await db.rpc('available_quantity_v2',{p_product_id:p.id,p_from:from,p_to:to,p_start_half:sh,p_end_half:eh});if(error)throw error;availability[p.id]=Number(data||0)}}renderProducts();showNotice(isDemo?'Demo-Modus: Anfragen und Sperrzeiten werden nur in diesem Browser gespeichert.':'Verfügbarkeit wurde aktualisiert.')}
function renderProducts(){const cat=el('category').value;const items=products.filter(p=>cat==='all'||p.category===cat);el('deviceGrid').innerHTML=items.map(p=>{const q=availability[p.id]??0,ok=q>0,rate=rateFor(p),total=totalFor(p),u=rentalUnits();const tiers=p.category==='Generatoren'?`<div class="tier-note">1–4 Tage ${money(p.day_price)}/Tag · ab 5 ${money(p.tier5)}/Tag · ab 20 ${money(p.tier20)}/Tag</div>`:'';const long=p.long_term?'<div class="longterm">Langzeitmiete: spezielle Konditionen auf Anfrage</div>':'';const unavailableHelp=!ok?`<div class="customer-unavailable-help"><span>Der gewählte Zeitraum ist nicht frei.</span><button type="button" class="btn calendar-btn" onclick="openAvailabilityCalendar('${p.id}')">Belegung anzeigen</button></div>`:'';return `<article class="card"><div class="device-image">${p.image_url?`<img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'device-placeholder\\'>⚙️</div>'">`:'<div class="device-placeholder">⚙️</div>'}</div><div class="card-body"><div class="category-label">${p.category}</div><h3>${p.name}</h3><div class="meta">${p.subtitle||''}</div><div class="availability ${ok?'available':'unavailable'}"><span class="dot"></span>${ok?(q>1?`${q} Stück verfügbar`:'verfügbar'):'im Zeitraum belegt'}</div>${unavailableHelp}${tiers}${long}<div class="card-footer"><div class="price"><strong>${money(total)}</strong><span>${unitsLabel(u)} · Tarif ${money(rate)}/Tag</span></div><button class="btn primary" ${ok?'':'disabled'} onclick="openBooking('${p.id}')">Anfragen</button></div></div></article>`}).join('')||'<div class="panel">Keine Geräte in dieser Kategorie.</div>';syncTabs()}
function showNotice(msg,error=false,success=false){const n=el('notice');n.textContent=msg;n.className='notice'+(error?' error':'')+(success?' success':'')}
window.openBooking=id=>{const p=products.find(x=>String(x.id)===String(id));el('productId').value=p.id;el('bookingTitle').textContent=p.name;el('bookingPeriod').textContent=periodLabel();el('priceBox').innerHTML=`Voraussichtlicher Mietpreis: <strong>${money(totalFor(p))}</strong><br><span class="small muted">${p.category==='Generatoren'?'Mehrtagestarif automatisch berücksichtigt. ':''}Vorbehaltlich Bestätigung und allfälligem Zubehör.</span>`;el('longTermWrap').classList.toggle('hidden',!p.long_term);el('longTerm').checked=false;el('bookingDialog').showModal()}
async function submitBooking(ev){ev.preventDefault();if(!validPeriod())return showNotice('Bitte einen gültigen Mietzeitraum wählen.',true);const p=products.find(x=>String(x.id)===String(el('productId').value));const payload={product_id:p.id,from_date:el('fromDate').value,to_date:el('toDate').value,start_half:el('fromHalf').value,end_half:el('toHalf').value,name:el('name').value.trim(),company:el('company').value.trim(),email:el('email').value.trim(),phone:el('phone').value.trim(),address:el('address').value.trim(),note:el('note').value.trim(),long_term:el('longTerm')?.checked||false};try{let reservationId;if(isDemo){const rs=await getDemoReservations();const blocked=rs.filter(r=>{const h=legacyHalves(r);return r.product_id===p.id&&['pending','confirmed','blocked'].includes(r.status)&&overlap(payload.from_date,payload.to_date,payload.start_half,payload.end_half,r.from_date,r.to_date,h.start_half,h.end_half)}).length;if(blocked>=(p.quantity||1))throw new Error('Das Gerät wurde soeben für diesen Zeitraum belegt.');reservationId=crypto.randomUUID();rs.push({id:reservationId,...payload,rental_mode:(payload.from_date===payload.to_date&&payload.start_half===payload.end_half?(payload.start_half==='am'?'half_am':'half_pm'):'full'),status:'pending',created_at:new Date().toISOString(),product_name:p.name});localStorage.setItem('rental_demo_reservations',JSON.stringify(rs))}else{const {data,error}=await db.rpc('create_rental_request_v2',{p_product_id:payload.product_id,p_from:payload.from_date,p_to:payload.to_date,p_start_half:payload.start_half,p_end_half:payload.end_half,p_name:payload.name,p_company:payload.company||null,p_email:payload.email,p_phone:payload.phone,p_address:payload.address||null,p_note:payload.note||null,p_long_term:payload.long_term});if(error)throw error;if(!data)throw new Error('Im gewünschten Zeitraum ist leider kein Gerät mehr verfügbar.');reservationId=data}let emailOk=true;try{await sendRentalEmail(reservationId,'request')}catch(mailError){console.error('E-Mail konnte nicht versendet werden:',mailError);emailOk=false}el('bookingDialog').close();el('bookingForm').reset();showNotice(emailOk?(isDemo?'Besten Dank. Ihre Mietanfrage wurde gespeichert.':'Besten Dank. Ihre Mietanfrage wurde übermittelt. Sie erhalten eine Eingangsbestätigung per E-Mail. Die Reservation wird erst nach unserer Bestätigung verbindlich.'):'Ihre Mietanfrage wurde gespeichert. Die automatische E-Mail konnte jedoch nicht versendet werden; Lehmann Gerätetechnik kann die Anfrage im Adminbereich sehen.',false,true);await checkAvailability()}catch(e){showNotice(e.message||'Die Anfrage konnte nicht gesendet werden.',true);el('bookingDialog').close()}}
el('checkBtn').addEventListener('click',checkAvailability);el('category').addEventListener('change',()=>{renderProducts();syncTabs()});el('closeDialog').addEventListener('click',()=>el('bookingDialog').close());el('bookingForm').addEventListener('submit',submitBooking);
el('closeAvailabilityDialog')?.addEventListener('click',()=>el('availabilityDialog').close());
el('calendarPrev')?.addEventListener('click',()=>{customerCalendarStart=addDaysISO(customerCalendarStart,-14);renderCustomerCalendar()});
el('calendarNext')?.addEventListener('click',()=>{customerCalendarStart=addDaysISO(customerCalendarStart,14);renderCustomerCalendar()});
el('calendarSelectedDate')?.addEventListener('click',()=>{customerCalendarStart=el('fromDate').value||isoToday();renderCustomerCalendar()});
initDates();loadProducts().catch(e=>showNotice(e.message,true));
