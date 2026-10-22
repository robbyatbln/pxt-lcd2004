# LCD2004: 20 Zeichen × 4 Zeilen am Calliope mini

Version 1.0.0 – vorbereitet am 22.10.2026, Hardwaretest und MakeCode-Zielbuild noch offen.

Diese MakeCode-Erweiterung steuert ein HD44780-kompatibles LCD2004 mit einem PCF8574-/PCF8574A-I²C-Adapter. Grundlage ist https://github.com/calliope-edu/pxt-display (Upstream-Version 0.0.1). Dessen Treiber für ein Seeed/Grove-LCD an Adresse 0x3E wurde für einen üblichen PCF8574-Adapter ersetzt. Diese Version ist für den Calliope mini gedacht, nicht als Arduino-Bibliothek.

## Funktionen

- Vier Zeilen mit je 20 Zeichen; Zeilennummern 0, 1, 2, 3.
- Lange Texte laufen pro Zeile unabhängig; Anfang und Ende bleiben jeweils eine Sekunde stehen.
- Einstellbares Laufschrift-Intervall, mindestens 20 ms; tatsächliche Aktualisierung hängt auch von I²C-Übertragung und Programm ab.
- Kürzere neue Texte überschreiben die gesamte Zeile mit abschließenden Leerzeichen.
- Alle Zeilen löschen und feste Hintergrundbeleuchtung ein-/ausschalten.
- Vorhandener Aufruf `display.writeString(text, zeile, intervall)` und Block-ID `write_String` bleiben erhalten.

## Elektrischer Anschluss

Das typische Arduino-LCD2004-Modul wird mit 5 V versorgt. Der Calliope arbeitet mit 3,3-V-Logik. Viele Adapter ziehen SDA und SCL über Widerstände auf ihre Versorgungsspannung. Deshalb einen bidirektionalen I²C-Pegelwandler zwischen Calliope und 5-V-Adapter verwenden; SDA/SCL mit 5-V-Pull-ups nicht direkt an den Calliope anschließen. Die Aufschrift „für Arduino“ bestätigt keine direkte elektrische Kompatibilität zum Calliope.

| Calliope-Seite | Pegelwandler | LCD-Seite |
| --- | --- | --- |
| 3,3 V | LV | – |
| externe geregelte 5 V | HV | VCC |
| GND | GND | GND |
| SDA gemäß Pinbelegung des Calliope-Modells | SDA LV → HV | SDA |
| SCL gemäß Pinbelegung des Calliope-Modells | SCL LV → HV | SCL |

Gemeinsame Masse herstellen. Versorgung nur bei ausgeschalteter Schaltung verdrahten. Keine externe 5-V-Versorgung an den 3,3-V-Anschluss legen. Die konkreten SDA-/SCL-Anschlüsse hängen von der Calliope-Version ab; vor dem Anschluss anhand ihrer Pinbelegung bestimmen.

Vorausgesetzte Adapterbelegung: P0=RS, P1=RW, P2=Enable, P3=Hintergrundlicht (aktiv high), P4–P7=D4–D7. Andere Adapterbelegungen benötigen eine Treiberanpassung. Die konkrete AliExpress-Variante und der Chip auf deinem Modul sind noch nicht bestätigt.

## Installation

In https://makecode.calliope.cc unter „Erweiterungen“ `https://github.com/robbyatbln/pxt-lcd2004` einfügen. Danach erscheint die Kategorie „LCD 20x4“.

## Beispiel und Befehle

```typescript
display.init(0x27)
display.writeString("Hallo Calliope!", 0, 300)
display.writeString("LCD 2004 mit I2C", 1, 300)
display.writeString("20 Zeichen x 4 Zeilen", 2, 300)
display.writeString("Dieser lange Text laeuft durch die vierte Zeile.", 3, 250)
```

| Befehl | Bedeutung |
| --- | --- |
| `display.init(39)` | Initialisieren mit 0x27 (dezimal 39). |
| `display.init(63)` | Alternative Adresse 0x3F (dezimal 63). |
| `display.writeString(text, zeile, intervall)` | Text auf Zeile 0–3 schreiben. |
| `display.clear()` | Alle Texte und Laufschriften löschen. |
| `display.backlight(false)` / `display.backlight(true)` | Beleuchtung aus-/einschalten. |

Die Initialisierung vor dem ersten Textaufruf setzen. Ohne explizite Initialisierung wird 0x27 verwendet. Die Software erkennt die Adresse nicht automatisch. PCF8574 verwendet abhängig von A0–A2 die 7-Bit-Adressen 0x20–0x27, PCF8574A 0x38–0x3F. Eine Adresse muss zum tatsächlichen Modul passen; nicht durch wahlloses Probieren andere I²C-Geräte ansprechen.

## Fehlersuche und Grenzen

- Nur beleuchtet oder dunkle Kästchen: Kontrast am kleinen Potentiometer einstellen, dann Versorgung, Adresse und Belegung prüfen.
- Kein Text: gemeinsame Masse, SDA/SCL, Pegelwandler und Adresse prüfen.
- Zeilen erscheinen versetzt: vorausgesetzt ist die 20×4-Speicherbelegung 0x00, 0x40, 0x14, 0x54.
- Unterstützt werden druckbare ASCII-Zeichen. Umlaute, Zeilenumbrüche und andere Zeichen erscheinen als `?`; daher z. B. `ae`, `oe`, `ue`, `ss` schreiben.
- Kein RGB-Farbwechsel, keine Grafikdarstellung und keine benutzerdefinierten Zeichen. Blau/Grün ist eine feste Hardwarevariante.
- Ein einzelnes LCD pro Programm; der MakeCode-Simulator bildet das externe LCD nicht ab.
- Initialisierung und Zeilenübertragung blockieren kurz, um ineinanderlaufende I²C-Befehle zu vermeiden.
- Softwareprüfungen ersetzen keinen Test am realen Display. Vollständiger MakeCode-Compile und Hardwaretest stehen aus.

## Versionsarchiv

- **1.0.0 – aktuelle vorbereitete Anpassung:** PCF8574-Treiber im 4-Bit-Modus, 20×4-Zeilenadressen, vier unabhängige Laufschriften, Beleuchtung, Löschfunktion, deutsche Blöcke und Anleitung.
- **0.0.1 – ursprünglicher Stand:** Seeed/Grove-LCD, 16×2, Adresse 0x3E. Unveränderte Historie im lokalen Git-Checkout; zusätzlich separates Upstream-Quellcodearchiv im Ausgabepaket. Nicht für den üblichen PCF8574-Adapter geeignet.

## Quellen und Lizenz

- Ausgangsprojekt: https://github.com/calliope-edu/pxt-display
- PCF8574/PCF8574A: https://www.nxp.com/docs/en/data-sheet/PCF8574_PCF8574A.pdf
- HD44780-Initialisierungsfolge: https://github.com/arduino-libraries/LiquidCrystal/blob/master/src/LiquidCrystal.cpp
- Upstream nennt MIT in pxt.json; Urheberangaben des Ausgangsprojekts bleiben erhalten. Das Ausgangsrepository enthält keine separate LICENSE-Datei.

## Softwarepruefung

`npm install` und `npm test` fuehren eine TypeScript-Pruefung gegen kleine PXT-API-Stubs und einen simulierten I2C-Befehlstest aus. Geprueft werden Initialisierung, vier Zeilenadressen, Auffuellen, unabhaengige Laufschriften, Endpausen, Textwechsel, ASCII-Ersatz, Zeilengrenzen, Loeschen, Beleuchtung und Adresswechsel. Beide Pruefungen sind lokal bestanden. Dies ist kein vollstaendiger Build gegen das Calliope-MakeCode-Ziel.
