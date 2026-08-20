<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#111214" />
  <title>Mietgeräte | Lehmann Gerätetechnik</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="topbar">
    <div class="wrap brand-row">
      <div class="brand logo-brand">
        <img class="site-logo" src="assets/lehmann-logo.jpg" alt="Lehmann Gerätetechnik GmbH" />
      </div>
      <a class="admin-link" href="admin.html">Admin</a>
    </div>
  </header>
  <section class="hero">
    <div class="wrap hero-inner">
      <div><div class="hero-accent"></div><div class="eyebrow">Mieten statt kaufen</div><h1>Mietgeräte</h1><p>Zeitraum wählen, Verfügbarkeit prüfen und die gewünschte Maschine direkt anfragen.</p></div>
    </div>
  </section>

  <main class="wrap">
    <section class="panel search-panel">
      <div class="field"><label for="fromDate">Abholung</label><input id="fromDate" type="date" /></div>
      <div class="field"><label for="toDate">Rückgabe</label><input id="toDate" type="date" /></div>
      <div class="field"><label for="rentalMode">Mietdauer</label><select id="rentalMode"><option value="full">Ganzer Tag / mehrere Tage</option><option value="half_am">½ Tag Vormittag</option><option value="half_pm">½ Tag Nachmittag</option></select></div>
      <div class="field grow"><label for="category">Kategorie</label><select id="category"><option value="all">Alle Mietgeräte</option></select></div>
      <button id="checkBtn" class="btn primary">Verfügbarkeit prüfen</button>
    </section>
    <div id="categoryTabs" class="category-tabs"></div>
    <section id="notice" class="notice hidden"></section>
    <section id="deviceGrid" class="device-grid" aria-live="polite"></section>
    <p class="footer-note">Alle Preise inkl. MwSt. · Mietanfrage wird erst nach unserer Bestätigung verbindlich.</p>
  </main>

  <dialog id="bookingDialog">
    <form id="bookingForm" method="dialog">
      <button type="button" class="dialog-close" id="closeDialog" aria-label="Schliessen">×</button>
      <div class="eyebrow">Mietanfrage</div><h2 id="bookingTitle">Gerät reservieren</h2><p id="bookingPeriod" class="muted"></p>
      <div id="priceBox" class="price-box"></div><input type="hidden" id="productId" />
      <div class="form-grid">
        <div class="field"><label for="name">Name *</label><input id="name" required /></div><div class="field"><label for="company">Firma</label><input id="company" /></div>
        <div class="field"><label for="email">E-Mail *</label><input id="email" type="email" required /></div><div class="field"><label for="phone">Telefon *</label><input id="phone" type="tel" required /></div>
        <div class="field full"><label for="address">Adresse</label><input id="address" /></div><div class="field full"><label for="note">Bemerkung / Einsatzzweck</label><textarea id="note" rows="3"></textarea></div>
        <div id="longTermWrap" class="field full hidden"><label class="checkline"><input id="longTerm" type="checkbox" /> Langzeitmiete anfragen – bitte spezielle Konditionen offerieren.</label></div>
      </div>
      <label class="checkline"><input id="terms" type="checkbox" required /> Ich bestätige, dass dies eine Mietanfrage ist und die Reservation erst nach Bestätigung durch Lehmann Gerätetechnik verbindlich wird.</label>
      <button class="btn primary full-btn" type="submit">Mietanfrage senden</button><p class="small muted">Die Verfügbarkeit wird beim Absenden erneut geprüft.</p>
    </form>
  </dialog>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="config.js"></script><script src="app.js"></script>
</body>
</html>
