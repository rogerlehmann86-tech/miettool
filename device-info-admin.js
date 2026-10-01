(() => {
  const bucket = 'rental-product-documents';
  let currentId = null, entries = [], original = [], request = 0, saving = false;
  const notice = (text, error = false) => { el('deviceInfoNotice').textContent = text; el('deviceInfoNotice').classList.toggle('error', error); };
  function renderDocuments() {
    const box = el('deviceDocumentEditor');
    box.replaceChildren();
    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'document-editor-row';
      const label = document.createElement('label');
      label.textContent = entry.file ? 'Neues PDF: ' + entry.file.name : 'Dokumenttitel';
      const title = document.createElement('input');
      title.value = entry.title; title.required = true; title.maxLength = 160;
      title.addEventListener('input', () => { entry.title = title.value; });
      label.append(title); row.append(label);
      if (entry.path) {
        const link = document.createElement('a');
        link.className = 'btn'; link.textContent = 'PDF öffnen'; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.href = db.storage.from(bucket).getPublicUrl(entry.path).data.publicUrl;
        row.append(link);
      }
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'btn'; remove.textContent = 'Entfernen';
      remove.addEventListener('click', () => { entries.splice(index, 1); renderDocuments(); });
      row.append(remove); box.append(row);
    });
  }
  async function openEditor(id) {
    if (saving) return;
    if (isDemo) return show('Die Geräteinformationen benötigen die Live-Datenbank.', true);
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;
    const token = ++request;
    currentId = id; entries = []; original = [];
    el('deviceInfoForm').reset(); renderDocuments();
    el('deviceInfoAdminTitle').textContent = product.name + ' – Infos & PDFs';
    el('saveDeviceInfo').disabled = true; notice('Informationen werden geladen …');
    el('deviceInfoAdminDialog').showModal();
    try {
      const {data, error} = await db.from('product_details').select('description,specifications,documents').eq('product_id', id).maybeSingle();
      if (error) throw error;
      if (token !== request) return;
      el('deviceDescription').value = data?.description || '';
      el('deviceSpecifications').value = data?.specifications || '';
      original = data?.documents || [];
      entries = original.map(d => ({...d})); renderDocuments();
      el('saveDeviceInfo').disabled = false; notice('');
    } catch (error) {
      if (token === request) notice('Laden fehlgeschlagen: ' + error.message + '. Falls die Funktion noch nicht eingerichtet ist, zuerst db/upgrade_v5_13.sql ausführen.', true);
    }
  }
  el('productAdminList').addEventListener('click', event => {
    const trigger = event.target.closest('[data-edit-info]');
    if (trigger) openEditor(trigger.dataset.editInfo);
  });
  el('closeDeviceInfoAdmin').addEventListener('click', () => { if (!saving) el('deviceInfoAdminDialog').close(); });
  el('deviceInfoAdminDialog').addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  el('deviceInfoAdminDialog').addEventListener('close', () => { request++; });
  el('devicePdfFiles').addEventListener('change', async () => {
    const files = Array.from(el('devicePdfFiles').files);
    el('devicePdfFiles').value = '';
    try {
      if (entries.length + files.length > 10) throw new Error('Maximal 10 Dokumente pro Gerät.');
      for (const file of files) {
        if (!/\.pdf$/i.test(file.name) || file.size > 20 * 1024 * 1024 || file.size === 0) throw new Error('Bitte PDF-Dateien mit maximal 20 MB wählen.');
        const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
        if (header !== '%PDF-') throw new Error(file.name + ' ist keine gültige PDF-Datei.');
      }
      entries.push(...files.map(file => ({file, title: file.name.replace(/\.pdf$/i, '').slice(0, 160)})));
      renderDocuments(); notice('Änderungen werden erst beim Speichern übernommen.');
    } catch (error) { notice(error.message, true); }
  });
  el('deviceInfoForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || el('saveDeviceInfo').disabled) return;
    if (entries.some(d => !d.title.trim())) return notice('Bitte jedem PDF einen Titel geben.', true);
    saving = true;
    const uploaded = [], snapshot = entries.map(d => ({...d})), productId = currentId;
    const description = el('deviceDescription').value, specifications = el('deviceSpecifications').value;
    el('deviceInfoForm').querySelectorAll('input,textarea,button').forEach(node => { node.disabled = true; });
    let committed = false;
    try {
      notice('Informationen und PDFs werden gespeichert …');
      const documents = [];
      for (const entry of snapshot) {
        let path = entry.path;
        if (entry.file) {
          path = productId + '/' + crypto.randomUUID() + '.pdf';
          const {error} = await db.storage.from(bucket).upload(path, entry.file, {contentType:'application/pdf', cacheControl:'3600', upsert:false});
          if (error) throw error;
          uploaded.push(path);
        }
        documents.push({path, title:entry.title.trim()});
      }
      const {error} = await db.from('product_details').upsert({product_id:productId, description, specifications, documents}, {onConflict:'product_id'});
      if (error) throw error;
      committed = true;
      const removed = original.filter(d => !documents.some(next => next.path === d.path)).map(d => d.path);
      let cleanupError = null;
      if (removed.length) cleanupError = (await db.storage.from(bucket).remove(removed)).error;
      original = documents; entries = documents.map(d => ({...d})); renderDocuments();
      notice(cleanupError ? 'Gespeichert. Entfernte PDFs werden nicht mehr angezeigt; die Dateibereinigung ist fehlgeschlagen.' : 'Informationen und Dokumente wurden gespeichert.', !!cleanupError);
    } catch (error) {
      if (!committed && uploaded.length) await db.storage.from(bucket).remove(uploaded).catch(() => {});
      notice('Speichern fehlgeschlagen: ' + error.message + '. Ihre Eingaben bleiben erhalten.', true);
    } finally {
      saving = false;
      el('deviceInfoForm').querySelectorAll('input,textarea,button').forEach(node => { node.disabled = false; });
    }
  });
})();
