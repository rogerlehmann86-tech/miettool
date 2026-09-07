# Lehmann Miettool

## Erweiterung v5.8 – September 2026

- Neues Lehmann-Logo auf Kunden- und Adminseite.
- Adminbereich **Standorte & E-Mailtexte**: Mietgerät auswählen, Standort hinzufügen oder bearbeiten; Standortname, Adresse, Kundenhinweise und Empfänger-E-Mail pflegen. Abholung und Rückgabe können unabhängig aktiviert werden. Standorte lassen sich deaktivieren.
- Kunden und Admin-Schnellerfassung wählen getrennte Abhol- und Rückgabestandorte. Bei mehreren Möglichkeiten ist eine Auswahl erforderlich. Ohne konfigurierte Standorte gilt „Nach Vereinbarung“.
- Anfragen für Geräte ohne aktive Partnerzuordnung gehen an den Abholstandort und bei abweichender Empfängeradresse zusätzlich an den Rückgabestandort. Doppelte Adressen werden zusammengefasst. Ohne Abholadresse bleibt `info@lehmann-gt.ch` der Standard. Die Kundenmail verwendet die Abholadresse als Antwortadresse. Die verifizierte Absenderadresse bleibt unverändert.
- Die Standortangaben inklusive Empfänger werden bei der Reservation gespeichert. Spätere Standortänderungen verändern bestehende Reservationen nicht.
- Vier E-Mailvorlagen: interne Anfrage, Eingangsbestätigung, Reservationsbestätigung und Absage/Stornierung. Betreff und Nachricht sind als Klartext mit Platzhaltern bearbeitbar. Vorschau ohne Versand, Standardtext wiederherstellbar. Buchungsdetails und Standorte werden automatisch ergänzt; die Eingangsbestätigung enthält immer den Hinweis auf die unverbindliche Anfrage.
- Preisberechnung im E-Mailversand berücksichtigt flexible Halbtagzeiträume und Generatorstaffeln.

Der Gerätebestand wird weiterhin gemeinsam über alle Standorte geführt. Es handelt sich um Abhol-/Rückgabeoptionen, keine getrennten Lagerbestände oder Transportplanung. Bestehende Reservationen ohne Standort bleiben unverändert. Seit v5.9 informiert die Schnellerfassung Standorte und zugewiesene Untervermieter automatisch; Kunden erhalten dabei keine automatische E-Mail.

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


## Untervermieter (v5.9)

Im Adminbereich unter **Standorte & E-Mailtexte → Untervermieter** eine Firma erfassen, Login-E-Mail und Benachrichtigungsadresse angeben und Geräte zuweisen. Nach dem Speichern kann im Bearbeitungsdialog ein Zugang mit Startpasswort angelegt werden. Ein bereits vorhandenes Supabase-Konto mit derselben E-Mail wird beim Speichern zugeordnet und nicht zurückgesetzt. Für neue Konten richtet der Admin einen bestätigten Zugang ein und übergibt das Startpasswort separat; es wird keine Einladungs- oder Passwort-E-Mail versendet. Nach der Anmeldung kann der Untervermieter das Passwort ändern.

Die Anmeldung läuft über `admin.html`; Untervermieter werden nach serverseitiger Rollenprüfung nach `partner.html` weitergeleitet. Dort sehen sie ihre aktiven Geräte, Anfragen und Reservationen zu diesen Geräten, freie Halbtagkapazitäten und eigene Nutzungssperren. Eine Sperre betrifft jeweils ein Exemplar. Sie können nur eigene Sperren zu weiterhin zugeteilten Geräten aufheben. Seit v5.11 können Partner Kundenkontaktdaten zu ihren zugewiesenen Geräten sehen und offene Anfragen bestätigen oder ablehnen. Preisbearbeitung, Geräteverwaltung, Bild-Uploads und E-Mailtexte bleiben dem Admin vorbehalten. Der öffentliche Mietkatalog bleibt wie bisher öffentlich.

Lehmann kann zugewiesene Geräte weiter vermieten, solange keine Nutzungssperre oder andere Reservation entgegensteht. Auch direkt bestätigte Mieten ohne Kunden-E-Mail informieren den Untervermieter. Bei aktiver Partnerzuordnung erhalten ausschliesslich die zugewiesenen Partner die internen Anfrage- und Direkterfassungsmails. Ohne Partnerzuordnung gelten die Standortadressen. Doppelte Adressen werden zusammengefasst. Die Vorlage **Direkterfassung an Standort / Untervermieter** kann separat geändert werden. Der Platzhalter `{{status}}` unterscheidet Anfrage und bestätigte Vermietung.

Offene interne Direkterfassungs-Benachrichtigungen werden dauerhaft gespeichert und im Adminbereich mit einer Schaltfläche zum erneuten Versand angezeigt. Die E-Mailfunktion bestätigt den Versandstatus erst, wenn alle Versandaufrufe erfolgreich waren. Eine erfolgreiche API-Annahme ist keine Garantie der Zustellung im Posteingang. Es gibt keinen zeitgesteuerten Wiederholungsversand.

Entfernte Gerätezuordnungen und deaktivierte Untervermieter werden bei jedem Zugriff geprüft und gelten auch für bestehende Sitzungen. Bestehende Nutzungssperren bleiben stehen; der Admin kann sie aufheben. Neue Untervermieter werden nicht automatisch als Administratoren berechtigt.

Backend: `rental_sublessor_roles_and_direct_notifications` aus `db/upgrade_v5_9.sql` sowie die Edge Functions `rental-email` und `rental-partner-account`. Die zuvor allgemeinen Rechte aller angemeldeten Benutzer wurden für Reservationen, Kundendaten, Produktänderungen, Bild-Uploads und sämtliche älteren Admin-RPCs auf das bestehende bestätigte Admin-Konto eingeschränkt. `admin_reservations` respektiert nun die Tabellenrechte. Untervermieter schreiben Sperren ausschliesslich über geprüfte Funktionen. Externe Hinweise werden im Adminbereich als Text ausgegeben.

Weitere Tests:

```sh
node --test tests/mail-content.test.mjs tests/edge-function.test.mjs tests/partner-account.test.mjs
```

`tests/sublessor.sql` prüft die Rollen- und Geräteisolation, ältere Adminfunktionen, eigene Sperren, Doppelbelegung, sofortigen Rechteentzug und die Benachrichtigungsvormerkung bei Direkterfassung ohne Kunden-E-Mail. Testkonten und alle anderen Testdaten werden zurückgerollt. Es wurden keine echten Untervermieter-Zugänge eingerichtet und keine E-Mails an reale Empfänger versendet. Die interaktive Browserprüfung bleibt bis zu einer erreichbaren Vorschau/Veröffentlichung offen.


## v5.10 – Partner-Anfragen und E-Maildarstellung

`db/upgrade_v5_10.sql` ergänzt eine lesende Partnerübersicht mit Gerät, Zeitraum, Status und Anfrage-ID. Die Zuordnung wird serverseitig geprüft; Kundendaten und Schreibrechte bleiben geschützt. Offene Partneranfragen erscheinen nicht im Lehmann-Filter «Anfragen». Unter «Alle» sowie im gemeinsamen Belegungskalender bleiben sie zur Verwaltung sichtbar. Seit v5.11 sind die zusätzlichen Partnerrechte ausdrücklich freigegeben.

Kunden-E-Mails verwenden den zuständigen Partner als Firmennamen und Antwortadresse, behalten jedoch den verifizierten technischen Absender. Die Grusszeile steht nach den Mietdetails; identische Abhol-/Rückgabeadressen werden zusammengefasst. Standardtexte werden nur aktualisiert, wenn sie noch unverändert sind. Eigene Texte bleiben erhalten. `{{vermieter}}` ist im Texteditor verfügbar. Partner-Mails verlinken direkt auf `partner.html`.

Validierung: 14 lokale Node-Tests sowie Datenbanktests mit zurückgerollten Testdaten; keine echten Testmails. Die Datenbanktests prüfen zusätzlich den lesenden Anfragezugriff ohne Kundenfelder, fremde Geräte und den sofortigen Entzug nach Aufheben der Zuteilung.


## v5.11 – Freigegebene Partnerbearbeitung

`db/upgrade_v5_11.sql` erweitert die geprüfte Partnerübersicht um Kundenkontakt, Bemerkung und Standorte. Partner dürfen nur offene Anfragen ihrer aktuell zugewiesenen Geräte bestätigen oder ablehnen. Bereits bearbeitete Reservationen können darüber nicht wieder geöffnet werden. Rohdatenzugriff und allgemeine Adminrechte bleiben gesperrt.

Die E-Mailfunktion prüft für Partner die Berechtigung zur konkreten Reservation; Direkterfassungsmails bleiben adminpflichtig. Nach einer Entscheidung wird der Kunde informiert. Scheitert der Versand, bleibt der Status gespeichert und unter «Bearbeitete Reservationen» erscheint eine Möglichkeit zum erneuten Versand. Ohne Kunden-E-Mail wird nur der Status gespeichert.

Prüfung: 15 Node-Tests und SQL-Tests mit zurückgerollten Testdaten, einschliesslich fremder Kunden, Bestätigung/Ablehnung und Rechteentzug. Es wurden keine echten Testmails versendet.
