# Treibstoff / Betriebsstoff

Im Adminbereich bei einem Gerät **Infos & PDFs** öffnen. Im Abschnitt
**Treibstoff / Betriebsstoff** den Antrieb auswählen und bei Bedarf die
Spannung oder das Akkusystem als Zusatzangabe eintragen. Die Vorschau zeigt
das Farbfeld. Mit **Informationen und Dokumente speichern** übernehmen.

| Farbe | Auswahl |
| --- | --- |
| Blau | Aspen 4T / Bleifrei 95 |
| Grün | Elektrisch, Zusatzangabe z. B. 230 V oder 400 V (früher 380 V) |
| Gelb | Diesel |
| Rot | Aspen 2T |
| Orange | Akku |

STIHL KM 131 R und BT 130 verwenden trotz 4-MIX-Motor Aspen 2T.
Die vorhandenen Mietgeräte erhalten ihre bestätigte Zuordnung durch
`db/upgrade_v5_14.sql`. Der bestehende Zugriffsschutz der Geräteinformationen
gilt auch für die neuen Felder.

In der Kundenansicht erscheinen Geräteart und Marke/Modell auf zwei Zeilen.
Gespeicherte Namen für Reservationen und E-Mails bleiben erhalten. Die
Betriebsstoffangabe erscheint vor Bild und Beschreibung als eigenes Feld;
alte Kraftstoffzeilen im Techniktext werden dabei ausgeblendet.
