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
- Donker design met de violette halo-ring van de GAN Halo timer: de ring kleurt rood
  bij het vasthouden en groen zodra je mag starten
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

### Bediening op de timer zelf

Even kort de mat aanraken met twee handen en weer loslaten — dus vóórdat de timer
groen wordt — is het "knopje" van de app:

| Gebaar | Wat er gebeurt |
| --- | --- |
| 1× kort aanraken | Inspectie start (15 seconden aftellen) |
| 2× kort aanraken achter elkaar | Vraagt of de laatste tijd weg mag — tik daarna 1× om te bevestigen |
| 1× kort aanraken tijdens inspectie | Inspectie wordt afgebroken |
| Aanraken en vasthouden tot groen | Gewone start van een solve — telt niet als aanraking |
| Resetknop op de timer | Het display van de app gaat mee naar `0.00`, verder niets |

Wissen gaat dus altijd via een bevestiging: na de dubbele aanraking zie je in de ring
welke tijd weggaat, en pas de volgende korte aanraking voert het uit. Dat kun je zo vaak
herhalen als je wilt — ook lang na een solve en na de reset. Begin je in plaats daarvan
een solve, of raak je een kleine acht seconden niets aan, dan vervalt de vraag vanzelf.

Een enkele aanraking wordt pas na 600 ms uitgevoerd, want binnen dat venster kan er nog
een tweede volgen. Zodra je handen weer op de mat gaan telt dat als het begin van een
tweede aanraking; wordt het toch een solve (de timer springt op groen), dan vervalt die
eerste aanraking vanzelf.

Omdat de resetknop niets anders doet dan het display gelijkzetten, kan de reset na een
solve nooit per ongeluk inspectie starten.

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
