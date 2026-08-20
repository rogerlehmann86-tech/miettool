# Miettool – Lehmann Gerätetechnik GmbH · Version 5.1 Master

Dieses Master-Paket basiert auf dem am 17.08.2026 um 12:42 heruntergeladenen GitHub-Stand des Repositories `miettool`. Ergänzt wurden die dort fehlenden Bestandteile aus dem letzten vollständigen lokalen Paket: `assets/`, die Supabase Edge Function `rental-email` und das vollständige Version-5-Datenbankschema.

## Aktueller Funktionsumfang

- öffentliche Mietgeräteseite mit Zeitraum- und Kategorieauswahl
- Mietdauer ganzer Tag / mehrere Tage sowie ½ Tag Vormittag oder Nachmittag
- ½ Tag = 50 % des Tagespreises
- Verfügbarkeitsprüfung je physischem Geräteexemplar
- mehrere Exemplare je Mietgerät möglich
- Generator-Preisstaffel 1–4 / ab 5 / ab 20 Tage
- Langzeitmiete bei entsprechend markierten Geräten als spezielle Anfrage
- Mietanfrage bleibt bis zur Bestätigung unverbindlich
- Admin-Login über Supabase Authentication
- Adminbereich in der Reihenfolge:
  1. Anfragen & Reservationen
  2. Gerät sperren
  3. Mietgeräte verwalten
- Status: Anfrage / bestätigt / gesperrt / abgelehnt bzw. storniert
- Sperrzeiten für Service, Reparatur oder interne Nutzung
- Mietgeräte neu anlegen und bearbeiten
- Bestand erhöhen/reduzieren
- feste Kategorien im Admin-Dropdown: Gartengeräte, Baugeräte, Diverse Geräte, Generatoren
- E-Mail-Ablauf über Supabase Edge Function + Resend
- Kaution aktuell nicht aktiv

## Verzeichnisstruktur

```text
/
├── index.html
├── app.js
├── admin.html
├── admin.js
├── config.js
├── styles.css
├── schema.sql
├── README.md
├── VERSION.txt
├── assets/
│   ├── lehmann-logo.jpg
│   ├── vertikutierer.jpeg
│   └── holzhaecksler.jpeg
├── supabase/
│   ├── functions/
│   │   └── rental-email/
│   │       └── index.ts
│   └── migrations/
│       └── 2026-08-17_v5_admin_product_management.sql
├── docs/
│   └── Miettool_Lehmann_Geraetetechnik_Projektdokumentation.docx
└── archive/
    ├── README_github_2026-08-17.md
    └── schema_github_2026-08-17.sql
```

## Bestehendes Supabase-Projekt aktualisieren

Wenn das bestehende Projekt bereits bis Version 4 eingerichtet ist, **nicht das komplette `schema.sql` erneut ausführen**. Stattdessen nur folgende Migration im SQL Editor ausführen:

`supabase/migrations/2026-08-17_v5_admin_product_management.sql`

Sie ergänzt `admin_save_product(...)` für die Geräte- und Bestandsverwaltung.

## Frische Neuinstallation

1. Neues Supabase-Projekt anlegen.
2. `schema.sql` einmal vollständig im SQL Editor ausführen.
3. Admin-Benutzer unter Authentication anlegen.
4. `config.js` mit Supabase URL und Publishable/Anon-Key konfigurieren.
5. `supabase/functions/rental-email/index.ts` als Edge Function `rental-email` deployen.
6. Für die Function die notwendigen Secrets setzen.
7. Webdateien inkl. `assets/` auf HTTPS-Webspace oder GitHub Pages veröffentlichen.

## Edge Function / Resend

Benötigte Supabase Function-Secrets:

- `RESEND_API_KEY`
- `EMAIL_FROM` – z. B. `Lehmann Gerätetechnik <info@lehmann-gt.ch>`
- `COMPANY_EMAIL` – `info@lehmann-gt.ch`
- `WEBSITE_URL` – öffentliche Basis-URL des Miettools

Supabase stellt `SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` im Projekt bereit.

Die Edge Function verarbeitet die Ereignisse:

- `request`: interne Anfrage + Eingangsbestätigung an Kunde
- `confirmed`: Reservationsbestätigung an Kunde
- `cancelled`: Ablehnung/Stornierung an Kunde

`email_events` protokolliert erfolgreich versendete Ereignisse und verhindert den erneuten Versand desselben Ereignistyps.

## Wichtiger Sicherheitshinweis

`config.js` ist Browser-Code. Dort darf nur der Publishable/Anon-Key stehen. Der Supabase Service-Role-Key und der Resend API-Key dürfen **niemals** in Browserdateien oder GitHub eingecheckt werden. Sie gehören ausschliesslich in die Supabase Function-Secrets.

## Projektstatus E-Mail / DNS

Die technische Kette Miettool → Supabase Edge Function → Resend wurde im Einrichtungsprozess erreicht. Die Resend-Domainverifizierung war zuletzt noch nicht abgeschlossen. Die autoritativen Nameserver von `lehmann-gt.ch` wurden als Hetzner-Nameserver festgestellt; Resend-DNS-Einträge müssen daher in der tatsächlich autoritativen DNS-Zone vorhanden sein. Vor Produktivfreigabe ist ein vollständiger Test von `request`, `confirmed` und `cancelled` erforderlich.

## Hosting

Das Frontend ist statisch und kann z. B. auf GitHub Pages getestet werden. Für den Produktivbetrieb ist eine vom WordPress-Webroot getrennte URL/Subdomain sinnvoll; eine Einbindung in WordPress kann anschliessend per Link oder iFrame erfolgen, sofern die Hosting-/Browserregeln dies erlauben.

## Noch mögliche Ausbaustufen

- Kaution
- Zubehör je Gerät
- PDF-Mietvertrag / Übergabeprotokoll
- Erinnerungsmails vor Abholung und Rückgabe
- ERP-Anbindung

## Version 5.2 – Admin Suche und Archiv
- Der Adminbereich startet standardmässig im Filter **Anfragen** (`pending`).
- Ein Suchfeld durchsucht Gerät, Kunde, Firma, E-Mail, Telefon, Bemerkung und Datum.
- Die Filter zeigen die jeweilige Anzahl Einträge an.
- Bestätigte Mieten bleiben in der Datenbank `confirmed`, werden nach Mietende aber automatisch im Filter **Archiv** angezeigt.
- ½ Tag Vormittag gilt ab 12:00 Uhr als abgeschlossen; ½ Tag Nachmittag sowie Ganztag/Mehrtagesmieten nach Ende des letzten Miettages.
- Für dieses Archiv ist keine zusätzliche Supabase-Migration erforderlich.
