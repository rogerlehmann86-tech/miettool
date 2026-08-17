# Miettool – Lehmann Gerätetechnik GmbH · Version 4

Version 4 verwendet das Original-Logo von Lehmann Gerätetechnik GmbH und die daraus übernommene Farbwelt Rot (#e60918), Schwarz und Weiss. Zusätzlich ist die automatische E-Mail-Kommunikation vorbereitet und in die Buchungs- und Adminlogik integriert.

## Enthalten
- alle 21 aktuell öffentlich gelisteten Mietgeräte aus Gartengeräte, Baugeräte, Generatoren und Diverse Geräte
- Standardbestand 1 Stück; Vertikutierer 2 Stück
- ½ Tag Vormittag oder Nachmittag = ½ Tagespreis
- automatische Generator-Staffel 1–4 / ab 5 / ab 20 Tage
- Langzeitmiete bei Generatoren als separate Anfrageoption mit speziellen Konditionen
- Verfügbarkeitsprüfung je Zeitraum und Stückzahl
- Adminbereich: Anfragen bestätigen / ablehnen
- Adminbereich: Sperrzeiten für Service, Reparatur und interne Nutzung
- Original-Logo lokal im Paket unter `assets/lehmann-logo.jpg`
- Zieladresse für neue Mietanfragen: `info@lehmann-gt.ch`
- automatische E-Mails über Supabase Edge Function + Resend
- Kaution aktuell deaktiviert; Erweiterung später möglich

## E-Mail-Ablauf
1. Kunde sendet eine Mietanfrage.
2. Die Reservation wird in Supabase als `pending` gespeichert.
3. Die Edge Function `rental-email` sendet:
   - eine detaillierte Mietanfrage an `info@lehmann-gt.ch`
   - eine Eingangsbestätigung an den Kunden
4. Bestätigst du die Reservation im Adminbereich, erhält der Kunde automatisch eine Reservationsbestätigung.
5. Bei Ablehnung/Stornierung erhält der Kunde automatisch eine entsprechende Nachricht.

Die Eingangsbestätigung weist ausdrücklich darauf hin, dass die Reservation erst nach Bestätigung durch Lehmann Gerätetechnik verbindlich wird.

## Demo testen
Die Dateien auf einen lokalen oder normalen Webserver laden und `index.html` öffnen. Solange in `config.js` keine Supabase-Zugangsdaten eingetragen sind, läuft das Tool im Demo-Modus. Anfragen und Sperrzeiten werden dann nur im `localStorage` des jeweiligen Browsers gespeichert. Im Demo-Modus werden keine echten E-Mails versendet; die Oberfläche zeigt aber an, welcher Mail-Ablauf im Livebetrieb ausgelöst würde.

## Livebetrieb – Supabase
1. Neues Supabase-Projekt anlegen.
2. `schema.sql` im SQL Editor ausführen.
3. Einen Admin-Benutzer unter Authentication anlegen.
4. In `config.js` die Supabase URL und den Browser-/Anon-Key eintragen.
5. Den Ordnerinhalt auf den Webspace laden, z. B. unter `/mietgeraete/`.
6. Die Edge Function aus `supabase/functions/rental-email/index.ts` als `rental-email` deployen.

## Livebetrieb – E-Mail / Resend
Für den echten E-Mail-Versand wird ein Resend-Konto verwendet. Die Domain bzw. gewünschte Versanddomain muss dort verifiziert sein. Anschliessend in den Supabase Edge-Function-Secrets setzen:

- `RESEND_API_KEY` = Resend API Key
- `EMAIL_FROM` = z. B. `Lehmann Gerätetechnik <info@lehmann-gt.ch>`
- `COMPANY_EMAIL` = `info@lehmann-gt.ch`
- `WEBSITE_URL` = öffentliche URL des Miettools, z. B. `https://lehmann-gt.ch/mietgeraete`

Die Supabase-eigenen Variablen `SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` stehen Edge Functions im Projekt zur Verfügung.

## Datenschutz / Sicherheit
- Öffentliche Besucher können nur Produkte und Verfügbarkeit lesen und eine Mietanfrage erstellen.
- Kundendaten sind nicht öffentlich lesbar.
- Der Adminbereich benötigt im Livebetrieb eine Supabase-Anmeldung.
- Status-E-Mails (Bestätigung/Ablehnung) können nur von einem angemeldeten Admin ausgelöst werden.
- Der Service-Role-Key steht nur in der Edge Function und wird niemals in `config.js` oder im Browser gespeichert.
- `email_events` verhindert, dass die gleiche Statusmail mehrfach versendet wird.

## Noch mögliche Ausbaustufen
- Kaution aktivieren
- Zubehör je Gerät
- PDF-Mietvertrag / Übergabeprotokoll
- Erinnerungsmail vor Abholung / Rückgabe
- ERP-Anbindung
