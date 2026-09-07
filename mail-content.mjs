export const templateLabels = {
  request_company: 'Neue Anfrage an den Standort',
  request_customer: 'Eingangsbestätigung an den Kunden',
  confirmed: 'Reservationsbestätigung an den Kunden',
  cancelled: 'Absage / Stornierung an den Kunden'
};
export const defaultTemplates = {
  request_company: {subject:'Neue Mietanfrage: {{geraet}} · {{abholung}}',body:'Eine neue Mietanfrage ist eingegangen.\n\nBitte prüfen Sie die Anfrage im Adminbereich:\n{{admin_link}}'},
  request_customer: {subject:'Ihre Mietanfrage – {{geraet}}',body:'Guten Tag {{name}}\n\nBesten Dank für Ihre Mietanfrage bei Lehmann Gerätetechnik GmbH.\n\nFreundliche Grüsse\nLehmann Gerätetechnik GmbH\n{{kontakt_email}}'},
  confirmed: {subject:'Mietreservation bestätigt – {{geraet}}',body:'Guten Tag {{name}}\n\nIhre Mietreservation wurde von uns bestätigt.\nBei Fragen oder Änderungen erreichen Sie uns unter {{kontakt_email}}.\n\nFreundliche Grüsse\nLehmann Gerätetechnik GmbH'},
  cancelled: {subject:'Mietanfrage / Reservation – {{geraet}}',body:'Guten Tag {{name}}\n\nIhre Mietanfrage bzw. Reservation wurde abgelehnt bzw. storniert.\nFalls Sie einen anderen Zeitraum oder ein alternatives Gerät wünschen, melden Sie sich gerne unter {{kontakt_email}}.\n\nFreundliche Grüsse\nLehmann Gerätetechnik GmbH'}
};
export const placeholders = ['name','geraet','zeitraum','preis','abholung','rueckgabe','abholstandort','rueckgabestandort','kontakt_email','admin_link'];
export function validateTemplate(t) {
  if(!t.subject?.trim() || !t.body?.trim()) throw new Error('Betreff und Text dürfen nicht leer sein.');
  if(t.subject.length>200 || t.body.length>12000) throw new Error('Betreff maximal 200 Zeichen, Text maximal 12’000 Zeichen.');
  if(/[\r\n]/.test(t.subject)) throw new Error('Der Betreff darf keinen Zeilenumbruch enthalten.');
  for(const m of (t.subject+'\n'+t.body).matchAll(/{{\s*([^{}]+?)\s*}}/g)) {
    if(!placeholders.includes(m[1])) throw new Error('Unbekannter Platzhalter: '+m[0]);
  }
}
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderTemplate(t,values) {
  validateTemplate(t);
  const replace=s=>s.replace(/{{\s*([^{}]+?)\s*}}/g,(_,key)=>String(values[key]??''));
  return {subject:replace(t.subject).replace(/[\r\n]/g,' '),text:replace(t.body)};
}
export function rentalSummary(row,product) {
  const sh=row.start_half||(row.rental_mode==='half_pm'?'pm':'am');
  const eh=row.end_half||(row.rental_mode==='half_am'?'am':'pm');
  const days=Math.round((Date.parse(row.to_date+'T12:00:00Z')-Date.parse(row.from_date+'T12:00:00Z'))/86400000);
  const units=(days*2+(eh==='pm'?1:0)-(sh==='pm'?1:0)+1)/2;
  if(!Number.isFinite(units)||units<=0) throw new Error('Ungültiger Mietzeitraum.');
  let rate=Number(product.day_price||0);
  if(product.category==='Generatoren' && units>=20 && product.tier20_price!=null)rate=Number(product.tier20_price);
  else if(product.category==='Generatoren' && units>=5 && product.tier5_price!=null)rate=Number(product.tier5_price);
  const from=`${row.from_date} ${sh==='pm'?'Nachmittag':'Vormittag'}`;
  const to=`${row.to_date} ${eh==='am'?'Mittag':'Abend'}`;
  return {units,rate,total:rate*units,from,to,period:`${from} bis ${to} · ${String(units).replace('.',',')} Tag(e)`};
}
export function locationText(l) {return l ? [l.name,l.address,l.instructions].filter(Boolean).join('\n') : 'Nach Vereinbarung';}
export function routeEmails(locations,fallback) {
  const pickup=locations?.pickup?.notification_email?.trim()||fallback;
  const back=locations?.return?.notification_email?.trim();
  return {replyTo:pickup,recipients:[...new Set([pickup,back].filter(Boolean).map(x=>x.toLowerCase()))]};
}
export function buildEmail(key,template,row,product,locations,companyEmail,websiteUrl) {
  const s=rentalSummary(row,product),route=routeEmails(locations,companyEmail);
  const price=new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF'}).format(s.total);
  const values={name:row.name,geraet:row.product_name,zeitraum:s.period,preis:price,abholung:s.from,rueckgabe:s.to,abholstandort:locationText(locations?.pickup),rueckgabestandort:locationText(locations?.return),kontakt_email:route.replyTo,admin_link:websiteUrl.replace(/\/$/,'')+'/admin.html'};
  const rendered=renderTemplate(template||defaultTemplates[key],values);
  let details=`Gerät: ${row.product_name}\nZeitraum: ${s.period}\nVoraussichtlicher Mietpreis: ${price}\n\nAbholung:\n${values.abholstandort}\n\nRückgabe:\n${values.rueckgabestandort}`;
  if(row.long_term)details+='\n\nLangzeitmiete: Spezielle Konditionen angefragt.';
  if(key==='request_company') details+=`\n\nKunde: ${row.name}\nFirma: ${row.company||'–'}\nAdresse: ${row.address||'–'}\nE-Mail: ${row.email}\nTelefon: ${row.phone||'–'}\nBemerkung: ${row.note||'–'}\n\nAnfrage-ID: ${row.id}`;
  if(key==='request_customer')details+='\n\nWichtig: Dies ist eine Eingangsbestätigung. Die Reservation wird erst nach unserer ausdrücklichen Bestätigung verbindlich.';
  const text=rendered.text+'\n\n'+details;
  return {subject:rendered.subject,text,html:`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px">${escapeHtml(text).replace(/\n/g,'<br>')}</div>`};
}
