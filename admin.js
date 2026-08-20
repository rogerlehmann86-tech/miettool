<!doctype html>
<html lang="de">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#111214" /><title>Mietgeräte Admin | Lehmann Gerätetechnik</title><link rel="stylesheet" href="styles.css" /></head>
<body>
  <header class="topbar"><div class="wrap brand-row"><div class="brand logo-brand"><img class="site-logo" src="assets/lehmann-logo.jpg" alt="Lehmann Gerätetechnik GmbH" /></div><a class="admin-link" href="index.html">Kundenseite</a></div></header>
  <section class="hero"><div class="wrap hero-inner"><div><div class="hero-accent"></div><div class="eyebrow">Interner Bereich</div><h1>Mietgeräte – Admin</h1><p>Anfragen verwalten und Geräte für Service, Reparaturen oder interne Nutzung sperren.</p></div></div></section>
  <main class="wrap">
    <section id="loginPanel" class="panel login-panel"><div class="field grow"><label for="adminEmail">E-Mail</label><input id="adminEmail" type="email" /></div><div class="field grow"><label for="adminPassword">Passwort</label><input id="adminPassword" type="password" /></div><button id="loginBtn" class="btn primary">Anmelden</button></section>
    <section id="adminApp" class="hidden">
      <section class="panel reservation-panel">
        <div class="section-title"><div><h2>Anfragen & Reservationen</h2><p>Neue Mietanfragen prüfen, bestätigen oder ablehnen.</p></div></div>
        <div class="admin-toolbar">
          <div class="field admin-search-field"><label for="reservationSearch">Suche</label><input id="reservationSearch" type="search" placeholder="Kunde, Firma, Gerät, E-Mail, Telefon, Datum …" autocomplete="off" /></div>
          <div class="field"><label for="statusFilter">Anzeige</label><select id="statusFilter"><option value="pending" selected>Anfragen</option><option value="confirmed">Bestätigte / aktuelle Mieten</option><option value="archive">Archiv</option><option value="blocked">Gesperrt / Service</option><option value="cancelled">Abgelehnt / storniert</option><option value="all">Alle</option></select></div>
          <button id="refreshBtn" class="btn">Aktualisieren</button><div class="spacer"></div><button id="logoutBtn" class="btn">Abmelden</button>
        </div>
        <section id="adminNotice" class="notice hidden"></section><p class="admin-mail-note">E-Mail-Benachrichtigungen: <strong>info@lehmann-gt.ch</strong></p><div id="reservationList" class="reservation-list"></div>
      </section>

      <section class="panel block-panel"><h2>Gerät sperren</h2><p>Für Service, Reparatur, interne Nutzung oder andere Nichtverfügbarkeit.</p><div class="block-form">
        <div class="field grow"><label for="blockProduct">Gerät</label><select id="blockProduct"></select></div>
        <div class="field"><label for="blockFrom">Von</label><input id="blockFrom" type="date" /></div><div class="field"><label for="blockTo">Bis</label><input id="blockTo" type="date" /></div>
        <div class="field"><label for="blockMode">Dauer</label><select id="blockMode"><option value="full">Ganzer Tag / mehrere Tage</option><option value="half_am">½ Tag Vormittag</option><option value="half_pm">½ Tag Nachmittag</option></select></div>
        <div class="field grow"><label for="blockReason">Grund</label><input id="blockReason" placeholder="z. B. Service / Reparatur" /></div><button id="blockBtn" class="btn primary">Sperrzeit eintragen</button>
      </div></section>

      <section class="panel product-panel"><div class="section-title"><div><h2>Mietgeräte verwalten</h2><p>Geräte, Preise, Bilder und Bestand direkt im Adminbereich pflegen.</p></div><button id="newProductBtn" class="btn primary">+ Neues Mietgerät</button></div><div id="productAdminList" class="product-admin-list"></div></section>
    </section>
  </main>

  <dialog id="productDialog"><form id="productForm"><button type="button" id="closeProductDialog" class="dialog-close">×</button><h2 id="productDialogTitle">Mietgerät bearbeiten</h2><input id="editProductId" type="hidden"><div class="form-grid">
    <div class="field"><label>Bezeichnung</label><input id="editName" required></div><div class="field"><label>Kategorie</label><select id="editCategory" required><option value="Gartengeräte">Gartengeräte</option><option value="Baugeräte">Baugeräte</option><option value="Diverse Geräte">Diverse Geräte</option><option value="Generatoren">Generatoren</option></select></div>
    <div class="field full"><label>Beschreibung / technische Angaben</label><input id="editSubtitle"></div>
    <div class="field"><label>Tagespreis CHF</label><input id="editDayPrice" type="number" min="0" step="0.05" required></div><div class="field"><label>Bestand Stück</label><input id="editQuantity" type="number" min="0" step="1" required></div>
    <div class="field"><label>Generator: Preis ab 5 Tagen</label><input id="editTier5" type="number" min="0" step="0.05"></div><div class="field"><label>Generator: Preis ab 20 Tagen</label><input id="editTier20" type="number" min="0" step="0.05"></div>
    <div class="field full"><label>Bild-URL</label><input id="editImageUrl" type="url" placeholder="https://..."></div><div class="field"><label>Sortierung</label><input id="editSortOrder" type="number" step="1"></div>
    <label class="checkline"><input id="editLongTerm" type="checkbox"> Langzeitmiete / spezielle Konditionen anzeigen</label><label class="checkline"><input id="editActive" type="checkbox" checked> Auf Kundenseite aktiv</label>
  </div><p class="small muted">½-Tagesmiete bleibt automatisch bei 50 % des Tagespreises. Beim Reduzieren des Bestands werden nur freie Exemplare deaktiviert; bestehende Reservationen bleiben erhalten.</p><button class="btn primary full-btn" type="submit">Mietgerät speichern</button></form></dialog>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="config.js"></script><script src="admin.js"></script>
</body></html>
