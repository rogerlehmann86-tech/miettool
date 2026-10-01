// Shared display helpers; the stored product name remains unchanged.
function deviceText(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function deviceNameHtml(product) {
  const name = String(product.name || '');
  const separator = name.indexOf(' – ');
  const kind = separator >= 0 ? name.slice(0, separator) : product.category === 'Generatoren' ? 'Generator' : name;
  const model = separator >= 0 ? name.slice(separator + 3) : product.category === 'Generatoren' ? name : '';
  return `<span class="device-kind">${deviceText(kind)}</span>${model ? ` <span class="device-model">${deviceText(model)}</span>` : ''}`;
}
const DEVICE_ENERGY = Object.freeze({
  petrol_4t: {label:'Aspen 4T / Bleifrei 95', color:'blue'},
  electric: {label:'Elektrisch', color:'green'},
  diesel: {label:'Diesel', color:'yellow'},
  aspen_2t: {label:'Aspen 2T', color:'red'},
  battery: {label:'Akku', color:'orange'}
});
function deviceEnergyHtml(info) {
  const energy = Object.hasOwn(DEVICE_ENERGY, info.energy_source) ? DEVICE_ENERGY[info.energy_source] : null;
  if (!energy) return '';
  return `<div class="energy-badge energy-${energy.color}"><span class="energy-caption">Treibstoff / Betriebsstoff</span><strong>${deviceText(energy.label)}</strong>${info.energy_note ? `<span class="energy-note">${deviceText(info.energy_note)}</span>` : ''}</div>`;
}
