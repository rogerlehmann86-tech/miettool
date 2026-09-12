(() => {
  const target = new URLSearchParams(window.location.search).get('product');
  if (!target) return;

  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    try {
      if (typeof products === 'undefined' || !Array.isArray(products) || !products.length) {
        if (tries > 80) window.clearInterval(timer);
        return;
      }

      const product = products.find(p => String(p.slug || '') === target || String(p.id) === target);
      if (!product) {
        window.clearInterval(timer);
        if (typeof showNotice === 'function') {
          showNotice('Der empfohlene Mietgenerator wurde im Miettool nicht gefunden. Bitte wählen Sie einen Generator aus der Kategorie „Generatoren“.', true);
        }
        return;
      }

      window.clearInterval(timer);
      const category = document.getElementById('category');
      if (category) {
        category.value = product.category;
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof syncTabs === 'function') syncTabs();
      }

      window.setTimeout(() => {
        const button = [...document.querySelectorAll('button[onclick^="openBooking"]')]
          .find(b => (b.getAttribute('onclick') || '').includes(`'${product.id}'`));
        const card = button?.closest('.card');
        if (card) {
          card.style.outline = '3px solid #e30613';
          card.style.outlineOffset = '2px';
          card.style.boxShadow = '0 14px 36px rgba(227,6,19,.16)';
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof showNotice === 'function') {
          showNotice(`Passender Mietgenerator „${product.name}“ wurde aus der Generator-Auswahl übernommen. Bitte wählen Sie Ihren Mietzeitraum und prüfen Sie die Verfügbarkeit.`, false, true);
        }
      }, 180);
    } catch (error) {
      console.error('Generator-Selector-Verknüpfung:', error);
      if (tries > 80) window.clearInterval(timer);
    }
  }, 150);
})();
