let rentalLocations=[];
const locationLabel=l=>[l.name,l.address].filter(Boolean).join(' · ');
const locationEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadRentalLocations(){
  if(isDemo){rentalLocations=[];return;}
  const {data,error}=await db.from('public_rental_locations').select('*').order('name');
  if(error)throw new Error('Standorte konnten nicht geladen werden: '+error.message);
  rentalLocations=data||[];
}
function fillLocationSelects(productId,prefix){
  const list=rentalLocations.filter(l=>String(l.product_id)===String(productId));
  for(const [kind,flag] of [['Pickup','can_pickup'],['Return','can_return']]){
    const select=document.getElementById(prefix+kind),items=list.filter(l=>l[flag]);
    if(!select)continue;
    select.innerHTML=items.length ? (items.length>1?'<option value="">Bitte wählen …</option>':'')+items.map(l=>`<option value="${l.id}">${locationEscape(locationLabel(l))}</option>`).join('') : '<option value="">Nach Vereinbarung</option>';
    select.required=items.length>0;
    select.disabled=items.length===0;
  }
  updateLocationHints(prefix);
}
function updateLocationHints(prefix){
  for(const kind of ['Pickup','Return']){
    const select=document.getElementById(prefix+kind),hint=document.getElementById(prefix+kind+'Hint');
    const l=rentalLocations.find(x=>x.id===select?.value);
    if(hint)hint.textContent=l?.instructions||'';
  }
}
function locationSelectHtml(prefix){
  return ['Pickup','Return'].map((kind,i)=>`<div class="field"><label for="${prefix+kind}">${i?'Rückgabestandort':'Abholstandort'}</label><select id="${prefix+kind}"><option value="">Nach Vereinbarung</option></select><span class="small muted location-hint" id="${prefix+kind}Hint"></span></div>`).join('');
}
