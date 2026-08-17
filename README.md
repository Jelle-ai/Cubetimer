# Cubetimer

Minimalistische speedcube timer voor 3x3, met ondersteuning voor de **GAN Smart Timer**
via Web Bluetooth. Geen build, geen dependencies — het is gewoon HTML, CSS en JavaScript.

## Features

- 3x3 scrambles (20 zetten)
- Timen met de spatiebalk (of tikken op mobiel): vasthouden tot groen, loslaten om te starten
- GAN Smart Timer koppelen — de tijd komt dan rechtstreeks van het apparaat, op de milliseconde nauwkeurig
- WCA-inspectie van 15 seconden, met automatisch +2 na 15s en DNF na 17s
- Tijdens een solve blijft de tijd verborgen achter drie bolletjes
- Sessie met best, ao5, ao12 en mean; +2 en DNF per solve
- Alles wordt lokaal bewaard (localStorage), niets gaat naar een server

## Draaien

Web Bluetooth werkt alleen in een *secure context*, dus serveer de map over
`localhost` of https — `file://` openen werkt niet.

```sh
python3 -m http.server 8000
# of: npx http-server -p 8000
```

Open daarna http://localhost:8000.

## GAN timer koppelen

1. Zet de GAN Smart Timer aan (hij moet gepaird kunnen worden, niet al verbonden met een andere app).
2. Klik rechtsboven op **Verbind GAN timer** en kies je timer in het venster.
3. Handen op de mat: rood → groen → loslaten start de timer. Bij het stoppen leest de app
   de exacte tijd uit het apparaat en zet die in de sessie, met een nieuwe scramble.

### De resetknop van de timer

De timer stuurt een event zodra je de resetknop indrukt. De app leest dat zo:

| Druk | Wat er gebeurt |
| --- | --- |
| 1× na een solve | De timer wordt gereset en de app zet het display ook op `0.00`. **Geen** inspectie. |
| 1× op een lege timer | Inspectie start (15 seconden aftellen). |
| 2× snel achter elkaar | De laatst gelopen tijd wordt gewist. |
| 1× tijdens inspectie | Inspectie wordt afgebroken. |

De app wacht een halve seconde voordat een enkele druk wordt uitgevoerd, want in die
tijd kan er nog een tweede druk komen. Het display springt wel meteen op `0.00`, dus je
merkt daar niets van.

Loskoppelen doe je met dezelfde knop. Zolang de timer verbonden is, is de spatiebalk
uitgeschakeld zodat je niet per ongeluk dubbel meet.

**Browserondersteuning:** Web Bluetooth zit in Chrome en Edge (desktop en Android).
Safari en Firefox ondersteunen het niet — daar werkt de timer verder gewoon met de spatiebalk.

## Bediening

Zonder timer erbij (spatiebalk, of tikken op het scherm op mobiel):

| Actie | Toets / klik |
| --- | --- |
| Inspectie starten | kort tikken op spatie |
| Inspectie afbreken | nog een keer tikken, of `Esc` |
| Timer starten | spatie vasthouden tot groen, dan loslaten |
| Timer stoppen | spatie (of tik op het scherm) |
| Nieuwe scramble | `nieuwe scramble` |
| +2 / DNF / verwijderen | knopjes achter een tijd in de sessielijst |

Inspectie is optioneel: vanuit stilstand meteen vasthouden en loslaten start gewoon een
solve zonder inspectie.

## Over de scrambles

De scrambles zijn *random-move*: 20 willekeurige zetten waarbij dezelfde vlak-draai nooit
twee keer achter elkaar komt en `A B A` met tegenoverliggende vlakken wordt vermeden.
Dat is prima voor trainen, maar het is niet hetzelfde als de *random-state* scrambles die
op officiële WCA-wedstrijden worden gebruikt (die vragen een two-phase solver).

## Structuur

```
index.html        opbouw van de pagina
styles.css        styling
src/app.js        state machine, invoer en UI
src/scramble.js   scramble-generator
src/gan-timer.js  Web Bluetooth client voor de GAN Smart Timer
src/stats.js      tijdnotatie, ao5/ao12, mean
src/store.js      opslag van de sessie
```

Het bluetooth-protocol van de GAN Smart Timer (service `fff0`, state-characteristic `fff5`,
CRC-16/CCITT-FALSE) is overgenomen uit [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth).
