Lehmann Miettool Update v5.2.1 – Logo-Korrektur

Ursache:
Die HTML-Dateien verwenden assets/lehmann-logo.jpg. Wenn der assets-Ordner auf dem Webserver/GitHub fehlt, wird das Firmenlogo nicht angezeigt.

Installation:
1. admin.html, admin.js, styles.css und index.html in den bestehenden Miettool-Ordner kopieren/überschreiben.
2. Den Ordner assets mit der Datei lehmann-logo.jpg ebenfalls in den Miettool-Hauptordner hochladen.
3. Ergebnis muss so aussehen:
   /index.html
   /admin.html
   /styles.css
   /assets/lehmann-logo.jpg
4. Browser mit Strg+F5 neu laden.

Supabase, config.js, Resend und Datenbank werden nicht verändert.
