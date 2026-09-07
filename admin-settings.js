let adminLocations=[],emailTemplates=[],settingsMailModule;
const settingsMessage=(text,error=false)=>{
  const box=document.getElementById('settingsNotice');box.textContent=text;box.className='notice'+(error?' error':' success');
};
async function loadAdminSettings(){
  if(isDemo)return;
  try {
    settingsMailModule=await import('./mail-content.mjs');
    const [l,t]=await Promise.all([db.from('product_locations').select('*').order('name'),db.from('rental_email_templates').select('*').order('key')]);
    if(l.error||t.error)throw l.error||t.error;
    adminLocations=l.data||[];emailTemplates=t.data||[];
    const selected=el('locationProduct').value;
    el('locationProduct').innerHTML=products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
    if(products.some(p=>p.id===selected))el('locationProduct').value=selected;
    renderLocationAdmin();
    const oldKey=el('templateKey').value;
    el('templateKey').innerHTML=Object.entries(settingsMailModule.templateLabels).map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('');
    if(oldKey)el('templateKey').value=oldKey;
    el('templatePlaceholders').textContent=settingsMailModule.placeholders.map(p=>'{{'+p+'}}').join(' · ');
    selectEmailTemplate();
  }catch(e){settingsMessage(e.message,true);}
}
function renderLocationAdmin(){
  const items=adminLocations.filter(l=>l.product_id===el('locationProduct').value);
  el('locationList').innerHTML=items.map(l=>`<article class="location-card"><div><strong>${esc(l.name)}</strong> ${l.active?'':'<span class="status-pill">inaktiv</span>'}<p>${esc(l.address||'Keine Adresse')}<br>${l.can_pickup?'Abholung ':''}${l.can_return?'Rückgabe':''}<br>Anfragen an: ${esc(l.notification_email)}</p></div><button class="btn" type="button" data-edit-location="${l.id}">Bearbeiten</button></article>`).join('')||'<p class="muted">Noch keine Standorte hinterlegt. Abholung und Rückgabe erfolgen nach Vereinbarung; Anfragen gehen an info@lehmann-gt.ch.</p>';
  el('locationList').querySelectorAll('[data-edit-location]').forEach(b=>b.addEventListener('click',()=>editLocation(b.dataset.editLocation)));
}
function editLocation(id){
  const l=adminLocations.find(x=>x.id===id);
  el('locationForm').reset();
  el('locationId').value=l?.id||'';
  el('locationFormProduct').value=l?.product_id||el('locationProduct').value;
  el('locationDialogTitle').textContent=(l?'Standort bearbeiten – ':'Neuer Standort – ')+(products.find(p=>p.id===el('locationFormProduct').value)?.name||'');
  for(const [input,key] of [['locationName','name'],['locationAddress','address'],['locationInstructions','instructions'],['locationEmail','notification_email']])el(input).value=l?.[key]||(key==='notification_email'?'info@lehmann-gt.ch':'');
  el('locationPickup').checked=l?.can_pickup??true;el('locationReturn').checked=l?.can_return??true;el('locationActive').checked=l?.active??true;
  el('locationFormNotice').textContent='';el('locationDialog').showModal();
}
async function saveLocation(ev){
  ev.preventDefault();const button=ev.submitter;button.disabled=true;
  try {
    const payload={product_id:el('locationFormProduct').value,name:el('locationName').value.trim(),address:el('locationAddress').value.trim(),instructions:el('locationInstructions').value.trim(),notification_email:el('locationEmail').value.trim().toLowerCase(),can_pickup:el('locationPickup').checked,can_return:el('locationReturn').checked,active:el('locationActive').checked};
    if(!payload.can_pickup&&!payload.can_return)throw new Error('Bitte Abholung oder Rückgabe auswählen.');
    const id=el('locationId').value;
    const result=id?await db.from('product_locations').update(payload).eq('id',id).select('id').single():await db.from('product_locations').insert(payload).select('id').single();
    if(result.error)throw result.error;
    await loadRentalLocations();await loadAdminSettings();fillLocationSelects(el('quickProduct').value,'quick');
    el('locationDialog').close();settingsMessage('Standort gespeichert. Bestehende Reservationen behalten ihre bisherigen Standortangaben.');
  }catch(e){el('locationFormNotice').textContent=e.message;}finally{button.disabled=false;}
}
function selectEmailTemplate(){
  const key=el('templateKey').value,t=emailTemplates.find(t=>t.key===key)||settingsMailModule.defaultTemplates[key];
  el('templateSubject').value=t.subject;el('templateBody').value=t.body;previewEmail();
}
function previewEmail(){
  if(!settingsMailModule)return;
  try {
    const l={name:'Beispielstandort',address:'Musterstrasse 1, 3238 Gals',instructions:'Bitte Abholzeit telefonisch vereinbaren.',notification_email:'info@lehmann-gt.ch'};
    const mail=settingsMailModule.buildEmail(el('templateKey').value,{subject:el('templateSubject').value,body:el('templateBody').value},{id:'BEISPIEL',name:'Max Muster',product_name:'Honda EU20i',from_date:'2026-09-14',to_date:'2026-09-15',start_half:'pm',end_half:'pm',email:'kunde@example.com',phone:'032 000 00 00'},{day_price:50,category:'Generatoren'},{pickup:l,return:l},'info@lehmann-gt.ch','https://rogerlehmann86-tech.github.io/miettool');
    el('templatePreview').textContent='Betreff: '+mail.subject+'\n\n'+mail.text;
  }catch(e){el('templatePreview').textContent=e.message;}
}
async function saveEmailTemplate(ev){
  ev.preventDefault();const button=ev.submitter;button.disabled=true;
  try{
    const payload={key:el('templateKey').value,subject:el('templateSubject').value.trim(),body:el('templateBody').value.trim(),updated_at:new Date().toISOString()};
    settingsMailModule.validateTemplate(payload);
    const {data,error}=await db.from('rental_email_templates').upsert(payload).select('*').single();
    if(error)throw error;
    emailTemplates=emailTemplates.filter(t=>t.key!==data.key).concat(data);
    settingsMessage('E-Mailvorlage gespeichert. Sie gilt für künftig versendete E-Mails.');previewEmail();
  }catch(e){settingsMessage(e.message,true);}finally{button.disabled=false;}
}
function initAdminSettings(){
  el('locationProduct').addEventListener('change',renderLocationAdmin);
  el('newLocationBtn').addEventListener('click',()=>editLocation(null));
  el('locationForm').addEventListener('submit',saveLocation);
  el('closeLocationDialog').addEventListener('click',()=>el('locationDialog').close());
  el('templateKey').addEventListener('change',selectEmailTemplate);
  el('templateSubject').addEventListener('input',previewEmail);el('templateBody').addEventListener('input',previewEmail);
  el('templateForm').addEventListener('submit',saveEmailTemplate);
  el('templateReset').addEventListener('click',()=>{const t=settingsMailModule.defaultTemplates[el('templateKey').value];el('templateSubject').value=t.subject;el('templateBody').value=t.body;previewEmail();settingsMessage('Standardtext eingefügt. Zum Übernehmen bitte speichern.');});
}
