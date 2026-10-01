# Mietgeräte: bestätigte Modelle und Anleitungen

Stand: 1. Oktober 2026. 18 aktive Produkte; beide Vertikutierer sind ELIET E401.

## Übernahme ins Miettool

1. Nach Veröffentlichung der Bilddateien `db/update_device_content_2026_10.sql` im Supabase SQL Editor ausführen. Voraussetzung: `db/upgrade_v5_13.sql` ist eingerichtet. Die Transaktion bricht ab, falls die 18 erwarteten aktiven Geräte nicht vorhanden sind. Vorhandene PDFs, Preise, Bestand und Reservationen bleiben erhalten. Ein erneuter Lauf ersetzt diese Texte wieder.
2. Im Adminbereich die Geräte und die neuen 45-/40-cm-Bezeichnungen kontrollieren. Die Beschreibungen und technischen Angaben bleiben über «Infos & PDFs» bearbeitbar.
3. Das Anleitungspaket entpacken und die PDFs unter «Infos & PDFs» dem jeweiligen Gerät zuordnen. Beim KM 94 R / HL-KM und KM 131 R / FS-KM jeweils **beide** Anleitungen hochladen. Alle 14 bereitgestellten PDFs liegen unter der 20-MB-Grenze. Vor Veröffentlichung die Anleitungsausgabe mit dem Mietgerät abgleichen.

Die Daten sind vorbereitet; dieses Paket führt selbst keinen Datenbankimport und keine PDF-Uploads aus.

## Gefundene Bedienungsanleitungen

| Mietgerät / Bestandteil | Datei im Paket | Originalquelle | Hinweis |
| --- | --- | --- | --- |
| ELIET E401 | `e401.pdf` | [Hersteller-PDF](https://www.elietmachines.com/download_pdf.php?downloadid=122&taal=de) |  |
| ELIET Country | `country.pdf` | [Hersteller-PDF](https://www.elietmachines.com/download_pdf.php?downloadid=195&taal=de) | Gemeinsame Modellanleitung; Country-Abschnitt beachten. |
| Husqvarna 522HDR60X | `522hdr60x.pdf` | [Hersteller-PDF](https://www.husqvarna.com/hbd/tdrdownload/v2/pub000104632/doc000258805/OM/HsE7z3FBP1tbCx5t9Tseh0fQuJY) |  |
| Husqvarna 550 XP | `550xp-klein.pdf` | [Hersteller-PDF](https://www.husqvarna.com/hbd/tdrdownload/v2/pub000073520/doc000125502/OM/AsqRQ5wGkVy_H8lgj5Q8sqrwO_k) | Ausgabe DE/SL unter 20 MB. Nicht die Anleitung der Mark II verwenden. |
| STIHL MS 212 | `ms212.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-221-7521-A_ZBA_05_01.pdf) |  |
| STIHL KM 94 R | `km94.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-467-9421-C_ZBA_04_01.pdf) | Kombimotor und Werkzeug benötigen je eine Anleitung. |
| STIHL KM 131 R | `km131.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-436-0021-B_ZBA_06_01.pdf) | Kombimotor und Werkzeug benötigen je eine Anleitung. |
| STIHL HL-KM | `hl-km.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-475-9421-D_ZBA_05_01.pdf) | Kombimotor und Werkzeug benötigen je eine Anleitung. |
| STIHL FS-KM | `fs-km-current.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-407-9421-C_ZBA_09_01.pdf) | Kombimotor und Werkzeug benötigen je eine Anleitung. |
| STIHL BT 130 | `bt130.pdf` | [Hersteller-PDF](https://ssc.stihl.com/tsa/techdoc-documents/DVS_STIHL%2FZBA%2FZBA%2F0458-429-9421-A_ZBA_04_01.pdf) |  |
| Kärcher HD 5/12 CX FR | `kaercher-hd512cx-de.pdf` | [Hersteller-PDF](https://s1.kaercher-media.com/documents/manuals/raw/000/BTA-5475903-000-06.pdf) | Auszug: Originalseiten 1–13 mit vollständigem deutschen Abschnitt; PDF für Upload optimiert. CH/EU-Datenspalte nach Typenschild wählen. Separate Anleitung des FR-Flächenreinigers bei genauer Zubehörbezeichnung ergänzen. |
| Binderberger H6 | `h6.pdf` | [Hersteller-PDF](https://binderberger.com/wp-content/uploads/2024/04/Bedienungsanleitung-stehend-Kurzholzspalter-2022_05.pdf) | H6 E-Abschnitt verwenden; Ausgabe 2020-10. Baujahr und Ausführung abgleichen. |
| Billy Goat PL1803V | `pl1803v.pdf` | [Hersteller-PDF](https://bsintek.basco.com/BriggsDocumentDisplay/default.aspx?filename=ioktwNsGp9ZVj5K1w) | 381519DE, Ausgabe B; Serienbereich beginnt gemäss Herstellerzuordnung bei 010419001. Seriennummer und Motorunterlagen prüfen. |
| Honda EU20i | `eu20i.pdf` | [Hersteller-PDF](https://cf.hondappsv.com/files/OM/OM000201HME/36Z076170_Ger_print.pdf) |  |

## Weitere Anleitungen und offene Zuordnungen

| Gerät | Stand | Nächster Abgleich |
| --- | --- | --- |
| Tielbürger T60 | [Originalanleitung AA-260-040TS online](https://www.manualslib.de/manual/321801/Tielburger-T60.html); [AA-265-040TS](https://www.manualslib.de/manual/125695/Tielburger-Aa-265-040Ts.html). Hersteller-PDF: https://www.tielbuerger.de/index_htm_files/t60.pdf (Abruf derzeit mit Serverfehler). | Baujahr/Ausführung abgleichen; zusätzlich Anleitung des eingebauten Honda-Motors. |
| BOMAG BVP 10/36 | [Offizieller Dokumentabruf](https://www.bomag.com/de-de/service/teile-optionen/maschinendokumente/betriebs-und-wartungsanleitung/) verlangt die 12-stellige Seriennummer. Angegeben: `86183403427`, 11 Stellen. | Fehlende Stelle vom Typenschild übernehmen; nicht raten. |
| CityPumps 600 SOS Notfall | [SPEED MOP-Datenblatt](https://www.citypumps.com/assets/speed-mop_en.pdf) gefunden; Zuordnung noch offen. | Typenschild der Pumpe, nicht nur des Notfallsets, prüfen. Keine SPEED-MOP-Anleitung ungeprüft zuordnen. |
| CGM CX7000T | [Modell-Datenblatt](https://lehmann-gt.ch/wp-content/uploads/2024/05/it-en-fr-CX7000T.pdf) vorhanden. | Datenblatt ist keine Bedienungsanleitung. Generator- und Motoranleitung bei CGM/Importeur beziehen. |
| CGM V18Y | Modell bekannt; keine eindeutig passende komplette Betriebsanleitung öffentlich bestätigt. | Baujahr, Seriennummer, Gehäuse und Schalttafel angeben; Generator-, Motor- und Schalttafelunterlagen anfordern. |
| CGM V60F | [RNT-V60F-Datenblatt](https://lehmann-gt.ch/wp-content/uploads/2024/05/RNT-v60F.pdf) gefunden. | Konkrete Mietgeräteausführung samt Schalttafel abgleichen; Datenblatt ist keine Bedienungsanleitung. |

## Angaben, die noch am Mietgerät geprüft werden müssen

- **Balkenmäher – Tielbürger T60:** Honda und 117 cm vom Betreiber bestätigt. Standarddaten des T60 mit 97 cm nicht auf diesen Balken übertragen; Motortyp, Gewicht und Transportmasse am Mietgerät prüfen.
- **Stabheckenschere – STIHL KM 94 R / HL-KM:** HL-KM Ausführung, Messerlänge, Verstellwinkel und Gesamtgewicht noch am Werkzeug prüfen; alte 135°/50-cm-Angaben nicht übernommen. Neues Bild zeigt den KM-94-R-Kombimotor ohne Werkzeug; eigenes Foto des gesamten Mietgeräts kann später ergänzt werden.
- **Fadenmäher – STIHL KM 131 R / FS-KM:** Mähkopf und Werkzeug-Baureihe sowie Gesamtgewicht prüfen. Neues Bild zeigt den KM-131-R-Kombimotor ohne Werkzeug; eigenes Foto des gesamten Mietgeräts kann später ergänzt werden.
- **Plattenvibrator – BOMAG BVP 10/36:** Typ BVP 10/36 weiterhin am Typenschild bestätigen. Seriennummer 86183403427 hat 11 Stellen; BOMAG verlangt für den passenden Dokumentabruf 12 Stellen.
- **Hochdruckreiniger – Kärcher HD 5/12 CX FR:** 115 bar beibehalten. CH- und EU-Variante unterscheiden sich bei Leistungsaufnahme, Druck und Netzabsicherung. Artikelnummer/Typenschild vor Ergänzung dieser Werte prüfen.
- **Tauchpumpe – CityPumps SOS Notfall:** 600 SOS ist keine ausreichend eindeutige Pumpentyp-Angabe. Typenschild prüfen; SPEED MOP-Datenblatt nicht als bestätigte Bedienungsanleitung verwenden.
- **Holzspalter – Binderberger H6:** Gewicht und Abmessungen hängen vom Baujahr ab. Anleitung nennt ca. 160 kg und 84 × 48 × 100 cm, aktuelle Produktseite 145 kg. Erst nach Abgleich mit Baujahr auf Mietgerät übertragen.
- **CGM CX7000T:** Datenblatt ist keine Bedienungsanleitung. Separaten Generator-, Motor- und gegebenenfalls Schalttafel-Anleitungssatz anfordern.
- **CGM V18Y:** Baujahr, Seriennummer, Schallschutzgehäuse, Schalttafel und Dauer-/Stand-by-Nennleistung für genaue technische Daten und Anleitung prüfen. Anhängergewicht und Gesamtmasse nicht aus einem stationären Datenblatt übernehmen.
- **CGM V60F:** Vor detaillierten Massen, Gewichten, Nennleistungen und Anleitungen konkrete Mietgeräteausführung samt Schalttafel prüfen. RNT-V60F-Datenblatt gefunden; nicht automatisch identisch mit Mietgerät.

## Bilder und Quellen

Die vier geänderten Hauptgeräte erhalten passende Herstellerbilder. Die zwei Kombigeräte erhalten ein Bild der korrekten Motoreinheit statt eines anderen Komplettgeräts. Die Texte nennen den enthaltenen Werkzeugaufsatz; für beide wäre ein eigenes Bild des gesamten Mietgeräts die beste Ergänzung. Der T60 wird als Symbolbild gekennzeichnet, da sein Mietbalken 117 cm breit ist.

| Datei | Bildquelle |
| --- | --- |
| `husqvarna-522hdr60x.webp` | https://www.husqvarna.com/-/images/aprimo/husqvarna/hedge-trimmers/photos/studio/h210-0704.webp |
| `husqvarna-550xp.webp` | https://www.husqvarna.com/-/images/aprimo/husqvarna/chainsaws/photos/studio/h/h110/02/h110-0270.webp |
| `tielbuerger-t60.jpg` | https://www.tielbuerger.ch/uploads/1/7/5/4/17544759/5503418.jpg |
| `stihl-ms212.jpg` | https://www.stihl.de/content/dam/stihl/media/pim/94907.jpg |
| `stihl-km94r.jpg` | https://www.stihl.de/content/dam/stihl/media/pim/38795.jpg |
| `stihl-km131r.jpg` | https://www.stihl.de/content/dam/stihl/media/pim/41000.jpg |

Technische Werte beruhen auf den oben verlinkten Herstelleranleitungen, bestätigten Betreiberangaben und vorhandenen Mietgerätangaben. Zusätzlich: [ELIET E401](https://www.elietmachines.com/de/machines/e401), [Husqvarna 550 XP erste Generation](https://www.husqvarna.com/uk/support/550-xp/), [Billy Goat PL1803V](https://www.billygoat.eu/en-gb/aerators/pl1803v-aerator/). Nicht bestätigte Ausführungswerte wurden nicht ergänzt.
