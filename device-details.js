const DEVICE_PDF_BUCKET = 'rental-product-documents';
let detailsProduct = null;
let detailsRequest = 0;
function documentUrl(path) {
  return db.storage.from(DEVICE_PDF_BUCKET).getPublicUrl(path).data.publicUrl;
}
async function openDeviceDetails(id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;
  detailsProduct = product;
  const request = ++detailsRequest;
  el('deviceDetailsTitle').innerHTML = deviceNameHtml(product);
  el('detailsBooking').disabled = !(availability[product.id] > 0);
  const basic = `${product.image_url ? `<img class="details-image" src="${detailsEscape(product.image_url)}" alt="${detailsEscape(product.name)}">` : ''}<p>${detailsEscape(product.subtitle)}</p>${pickupLocationInfo(product.id)}`;
  el('deviceDetailsContent').innerHTML = basic + '<p role="status">Informationen werden geladen …</p>';
  el('deviceDetailsDialog').showModal();
  try {
    let info = {};
    if (!isDemo) {
      const {data, error} = await db.from('product_details').select('description,specifications,documents,energy_source,energy_note').eq('product_id', product.id).maybeSingle();
      if (error) throw error;
      info = data || {};
    }
    if (request !== detailsRequest || !el('deviceDetailsDialog').open) return;
    let content = deviceEnergyHtml(info) + basic;
    if (info.description) content += `<h3>Beschreibung</h3><p class="details-text">${detailsEscape(info.description)}</p>`;
    const specifications = info.energy_source ? String(info.specifications || '').split('\n').filter(line => !/^\s*Kraftstoff:/i.test(line) && !(info.energy_source === 'electric' && /^\s*Stromversorgung:/i.test(line))).join('\n') : info.specifications;
    if (specifications) content += `<h3>Technische Angaben &amp; Hinweise</h3><p class="details-text">${detailsEscape(specifications)}</p>`;
    const documents = Array.isArray(info.documents) ? info.documents : [];
    if (documents.length) content += '<h3>Anleitungen &amp; Dokumente</h3><ul class="details-documents">' + documents.map(d => `<li><a class="btn" href="${detailsEscape(documentUrl(d.path))}" target="_blank" rel="noopener noreferrer">${detailsEscape(d.title)} <span class="small muted">PDF · öffnet in neuem Tab</span></a></li>`).join('') + '</ul>';
    if (!info.description && !info.specifications && !documents.length) content += '<p class="muted">Weitere Informationen erhalten Sie gerne auf Anfrage.</p>';
    el('deviceDetailsContent').innerHTML = content;
  } catch (error) {
    if (request === detailsRequest && el('deviceDetailsDialog').open) el('deviceDetailsContent').innerHTML = basic + '<p role="alert">Zusätzliche Informationen sind momentan nicht verfügbar. Bitte versuchen Sie es später erneut.</p>';
  }
}
el('deviceGrid').addEventListener('click', event => {
  const trigger = event.target.closest('[data-details]');
  if (trigger) openDeviceDetails(trigger.dataset.details);
});
el('closeDeviceDetails').addEventListener('click', () => el('deviceDetailsDialog').close());
el('deviceDetailsDialog').addEventListener('close', () => { detailsRequest++; });
el('detailsBooking').addEventListener('click', () => { el('deviceDetailsDialog').close(); openBooking(detailsProduct.id); });
el('detailsCalendar').addEventListener('click', () => { el('deviceDetailsDialog').close(); openAvailabilityCalendar(detailsProduct.id); });
