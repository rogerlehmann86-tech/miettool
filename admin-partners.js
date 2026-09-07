let rentalPartners=[],partnerAssignments=[];
async function loadPartnerAdmin(){
 const [p,d,n]=await Promise.all([db.from('rental_partners').select('*').order('company'),db.from('rental_partner_devices').select('*'),db.from('rental_direct_notifications').select('reservation_id,sent_at,last_error')]);
 if(p.error||d.error||n.error)throw p.error||d.error||n.error;
 rentalPartners=p.data||[];partnerAssignments=d.data||[];directNotifications=n.data||[];
 el('partnerAdminList').innerHTML=rentalPartners.map(p=>`<article class="location-card"><div><strong>${esc(p.company)}</strong> ${p.active?'':'(inaktiv)'}<p>Login: ${esc(p.email)}<br>Benachrichtigungen: ${esc(p.notification_email)}<br>${partnerAssignments.filter(d=>d.partner_id===p.id).length} Geräte · ${p.user_id?'Zugang vorhanden':'Zugang noch nicht angelegt'}</p></div><button class="btn" type="button" data-edit-partner="${p.id}">Bearbeiten</button></article>`).join('')||'<p>Noch keine Untervermieter erfasst.</p>';
 el('partnerAdminList').querySelectorAll('[data-edit-partner]').forEach(b=>b.addEventListener('click',()=>editPartner(b.dataset.editPartner)));
 updateFilterLabels();render();
}
function editPartner(id){
 const p=rentalPartners.find(x=>x.id===id);el('partnerAdminForm').reset();el('editPartnerId').value=p?.id||'';
 el('editPartnerCompany').value=p?.company||'';el('editPartnerEmail').value=p?.email||'';el('editPartnerNotification').value=p?.notification_email||'';el('editPartnerActive').checked=p?.active??true;
 el('partnerDeviceAssignments').innerHTML=products.map(d=>`<label class="checkline"><input type="checkbox" name="partnerDevice" value="${d.id}" ${partnerAssignments.some(a=>a.partner_id===id&&a.product_id===d.id)?'checked':''}>${esc(d.name)}${d.active===false?' (inaktiv)':''}</label>`).join('');
 el('partnerAccountArea').classList.toggle('hidden',!p||!!p.user_id);el('partnerAdminFormNotice').textContent='';el('partnerAdminDialog').showModal();
}
async function savePartnerAdmin(ev){
 ev.preventDefault();const b=ev.submitter;b.disabled=true;
 try{
  const {error}=await db.rpc('admin_save_partner',{p_id:el('editPartnerId').value||null,p_company:el('editPartnerCompany').value.trim(),p_email:el('editPartnerEmail').value.trim().toLowerCase(),p_notification_email:el('editPartnerNotification').value.trim().toLowerCase(),p_active:el('editPartnerActive').checked,p_products:Array.from(document.querySelectorAll('input[name="partnerDevice"]:checked')).map(x=>x.value)});
  if(error)throw error;await loadPartnerAdmin();el('partnerAdminDialog').close();settingsMessage('Untervermieter und Gerätezuordnung gespeichert. Ohne bestehenden Login: Bearbeiten öffnen und Zugang anlegen.');
 }catch(e){el('partnerAdminFormNotice').textContent=e.message;}finally{b.disabled=false;}
}
async function createPartnerAccount(){
 const b=el('createPartnerAccount');b.disabled=true;
 try{
  const password=el('partnerStartPassword').value;
  if(password.length<12)throw new Error('Das Startpasswort muss mindestens 12 Zeichen enthalten.');
  const {data,error}=await db.functions.invoke('rental-partner-account',{body:{partner_id:el('editPartnerId').value,password}});
  if(error)throw new Error(data?.error||'Zugang konnte nicht angelegt werden. Bei bestehendem Konto den Untervermieter erneut speichern.');
  if(data?.error)throw new Error(data.error);
  el('partnerStartPassword').value='';await loadPartnerAdmin();el('partnerAdminDialog').close();settingsMessage('Zugang angelegt. Bitte Login-Adresse und Startpasswort persönlich übergeben. Der Untervermieter kann sein Passwort nach der Anmeldung ändern.');
 }catch(e){el('partnerAdminFormNotice').textContent=e.message;}finally{b.disabled=false;}
}
let directNotifications=[];
function directNotificationHtml(id){
 const n=directNotifications.find(x=>x.reservation_id===id);
 if(!n)return '';if(reservations.find(r=>r.id===id)?.status==='cancelled'&&!n.sent_at)return '<p class="small muted">Direkterfassung storniert; keine Erstbenachrichtigung mehr erforderlich.</p>';
 return n.sent_at?'<p class="small muted">Standorte / Untervermieter informiert.</p>':`<p class="small error">Benachrichtigung an Standorte / Untervermieter noch offen.</p><button class="btn smallbtn" type="button" onclick="retryDirectNotification('${id}',this)">Benachrichtigung erneut senden</button>`;
}
window.retryDirectNotification=async(id,button)=>{button.disabled=true;try{await sendStatusEmail(id,'direct');await loadPartnerAdmin();show('Standorte und Untervermieter wurden informiert.',false,true);}catch(e){show('Versand fehlgeschlagen. Die Benachrichtigung bleibt offen.',true);}finally{button.disabled=false;}};
function initPartnerAdmin(){
 el('newPartnerBtn').addEventListener('click',()=>editPartner(null));el('partnerAdminForm').addEventListener('submit',savePartnerAdmin);el('closePartnerAdminDialog').addEventListener('click',()=>el('partnerAdminDialog').close());el('createPartnerAccount').addEventListener('click',createPartnerAccount);
}
