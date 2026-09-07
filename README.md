# Lehmann Miettool

## Erweiterung v5.8 – September 2026

- Neues Lehmann-Logo auf Kunden- und Adminseite.
- Adminbereich **Standorte & E-Mailtexte**: Mietgerät auswählen, Standort hinzufügen oder bearbeiten; Standortname, Adresse, Kundenhinweise und Empfänger-E-Mail pflegen. Abholung und Rückgabe können unabhängig aktiviert werden. Standorte lassen sich deaktivieren.
- Kunden und Admin-Schnellerfassung wählen getrennte Abhol- und Rückgabestandorte. Bei mehreren Möglichkeiten ist eine Auswahl erforderlich. Ohne konfigurierte Standorte gilt „Nach Vereinbarung“.
- Anfragen gehen an den Abholstandort und bei abweichender Empfängeradresse zusätzlich an den Rückgabestandort. Doppelte Adressen werden zusammengefasst. Ohne Abholadresse bleibt `info@lehmann-gt.ch` der Standard. Die Kundenmail verwendet die Abholadresse als Antwortadresse. Die verifizierte Absenderadresse bleibt unverändert.
- Die Standortangaben inklusive Empfänger werden bei der Reservation gespeichert. Spätere Standortänderungen verändern bestehende Reservationen nicht.
- Vier E-Mailvorlagen: interne Anfrage, Eingangsbestätigung, Reservationsbestätigung und Absage/Stornierung. Betreff und Nachricht sind als Klartext mit Platzhaltern bearbeitbar. Vorschau ohne Versand, Standardtext wiederherstellbar. Buchungsdetails und Standorte werden automatisch ergänzt; die Eingangsbestätigung enthält immer den Hinweis auf die unverbindliche Anfrage.
- Preisberechnung im E-Mailversand berücksichtigt flexible Halbtagzeiträume und Generatorstaffeln.

Der Gerätebestand wird weiterhin gemeinsam über alle Standorte geführt. Es handelt sich um Abhol-/Rückgabeoptionen, keine getrennten Lagerbestände oder Transportplanung. Bestehende Reservationen ohne Standort bleiben unverändert. Bei der Schnellerfassung wird wie bisher keine E-Mail automatisch ausgelöst.

## Backend und Wartung

Projekt: `vzxhdhsptrbavkcbbtsm` (Lehmann Miettool).

`db/upgrade_v5_8.sql` wurde über die Supabase-Migrationsschnittstelle als `rental_email_templates_and_locations` angewendet. Nicht erneut ausführen. Die Erweiterung ist additiv; bestehende Tabellenrechte und Benutzerrollen wurden nicht geändert. Neue Einstellungen sind ausschliesslich für das bestehende, bestätigte Admin-Konto `info@lehmann-gt.ch` freigegeben. Bei einem späteren Admin-Kontowechsel muss diese Zuordnung gezielt angepasst werden.

Die Edge Function liegt unter `supabase/functions/rental-email/`. `verify_jwt=false` wurde aus der bestehenden Bereitstellung übernommen, da öffentliche Mietanfragen den Versand auslösen. Bestätigung und Stornierung benötigen eine geprüfte Admin-Anmeldung. Bestehende Versandereignisse verhindern erneuten Versand; Resend-Idempotenzschlüssel reduzieren doppelte Teilzustellungen bei Wiederholungen.

`mail-content.mjs` enthält die Vorlagen und die gemeinsam getestete Formatierung. Die Kopie in der Edge Function muss identisch bleiben. Nach Änderungen beide Dateien gemeinsam aktualisieren und die Edge Function neu bereitstellen.

## Prüfung

```sh
node --test tests/mail-content.test.mjs tests/edge-function.test.mjs
node --check app.js
node --check admin.js
node --check admin-settings.js
```

`tests/locations.sql` prüft Zugriffsrechte, Standortvalidierung, gespeicherte Angaben und Buchungskapazität innerhalb einer vollständig zurückgerollten Transaktion. Es werden keine E-Mails versendet. Die E-Mailtests simulieren Resend; eine reale Testzustellung ist damit nicht nachgewiesen.
