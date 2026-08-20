# Deployment-Checkliste – Lehmann Miettool

## Vor Veröffentlichung
- [ ] `config.js` enthält die korrekte Supabase URL und nur den Publishable/Anon-Key.
- [ ] `schema.sql` wurde bei Neuinstallation einmal vollständig ausgeführt ODER bei bestehender Installation nur die passende Migration.
- [ ] Admin-Benutzer kann sich anmelden.
- [ ] `rental-email` ist deployed.
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `COMPANY_EMAIL`, `WEBSITE_URL` sind als Function-Secrets gesetzt.
- [ ] Resend-Domain ist `Verified`.
- [ ] `Verify JWT with legacy secret` ist passend zur verwendeten Publishable-Key-Konfiguration eingestellt; im eingerichteten Projekt wurde die Legacy-Prüfung deaktiviert.

## Funktionstest
- [ ] Ganztagesanfrage funktioniert.
- [ ] ½ Tag Vormittag funktioniert.
- [ ] ½ Tag Nachmittag funktioniert.
- [ ] Doppelbelegung wird verhindert.
- [ ] Bestand > 1 wird korrekt berücksichtigt.
- [ ] Generatorpreise 1–4 / ab 5 / ab 20 Tage sind korrekt.
- [ ] Langzeitmiet-Hinweis erscheint nur bei markierten Geräten.
- [ ] Anfrage erscheint im Adminbereich.
- [ ] Bestätigung ändert Status und versendet Mail.
- [ ] Ablehnung/Stornierung ändert Status und versendet Mail.
- [ ] Sperrzeit blockiert Verfügbarkeit.
- [ ] Sperrzeit kann aufgehoben werden.
- [ ] Mietgerät kann bearbeitet werden.
- [ ] Neues Mietgerät kann angelegt werden.
- [ ] Bestandserhöhung funktioniert.
- [ ] Bestandsreduktion schützt gebundene Exemplare.
- [ ] `email_events` enthält Einträge nach erfolgreichem Mailversand.

## Nach Veröffentlichung
- [ ] Kundenseite mobil testen.
- [ ] Admin-URL nicht prominent öffentlich verlinken, sofern nicht gewünscht.
- [ ] GitHub/Backup auf denselben Masterstand aktualisieren.
- [ ] Release-ZIP zusätzlich lokal archivieren.
