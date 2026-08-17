# Cubetimer

Minimalistische speedcube timer voor 3x3, met ondersteuning voor de **GAN Smart Timer**
via Web Bluetooth. Geen build, geen dependencies — het is gewoon HTML, CSS en JavaScript.

## Features

- 3x3 scrambles (20 zetten)
- Timen met de spatiebalk (of tikken op mobiel): vasthouden tot groen, loslaten om te starten
- GAN Smart Timer koppelen — de tijd komt dan rechtstreeks van het apparaat, op de milliseconde nauwkeurig
- WCA-inspectie van 15 seconden, met automatisch +2 na 15s en DNF na 17s
- Tijdens een solve blijft alles gewoon staan; alleen in de ring verschijnen drie bolletjes
- Meerdere sessies naast elkaar, elk met eigen tijden; kies ze bovenaan de lijst
- Sessie met best, ao5, ao12 en mean; klik een tijd aan voor de scramble waarmee hij
  gelopen is, het tijdstip, en de knoppen voor +2, DNF en verwijderen
- Klik op de statistiekbalk voor alles: mo3, ao50, ao100, beste ao5, beste ao12,
  aantal +2 en DNF, en hoeveel solves onder je doeltijd bleven
- Design in de kleuren van de GAN Halo op zijn mat: lichtblauw verloop, witte ring met
  blauwe gloed. De ring kleurt rood bij het vasthouden en groen zodra je mag starten
- De pagina groeit nooit mee: alles past op één scherm en alleen de sessielijst scrolt
  (naast de timer op een groot scherm, eronder op je telefoon)
- Instellingen voor ringkleur, inspectie, decimalen, vasthoudtijd en het tonen van de
  tijd tijdens een solve
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
| 1× kort aanraken | Inspectie start meteen (15 seconden aftellen) |
| 2× kort aanraken achter elkaar | Inspectie stopt en de app vraagt of de laatste tijd weg mag |
| Daarna 1× kort aanraken | Bevestigt het wissen |
| Aanraken en vasthouden tot groen | Gewone start van een solve — telt niet als aanraking |
| Resetknop op de timer | Het display van de app gaat mee naar `0.00`, verder niets |

Een aanraking wordt direct uitgevoerd, zonder wachten. Volgt er binnen 600 ms een tweede,
dan wordt die eerste actie teruggedraaid en komt in de plaats daarvan de vraag om te
wissen. Wissen kan op elk moment — ook meteen na een solve terwijl de timer de tijd nog
toont, en zo vaak achter elkaar als je wilt. Begin je in plaats van te bevestigen een
solve, of raak je een kleine acht seconden niets aan, dan vervalt de vraag vanzelf.

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
| Details van een tijd | klik op de tijd in de sessielijst |
| +2 / DNF / verwijderen | knoppen in dat detailvenster |

Inspectie is optioneel: vanuit stilstand meteen vasthouden en loslaten start gewoon een
solve zonder inspectie.

## Instellingen

Via het tandwiel rechtsboven:

| Instelling | Keuze |
| --- | --- |
| Ringkleur | Zes kleuren, afgeleid van de LED-kleuren van de Halo |
| Thema | Licht, donker of volg je toestel |
| Inspectie | Aan (15 seconden, met +2 en DNF) of uit |
| Tijd tijdens solve | Verbergen achter drie bolletjes, of gewoon laten lopen |
| Decimalen | `0.00` of `0.000`, net als het display van je timer |
| Vasthoudtijd | Kort (250 ms), normaal (400 ms) of lang (550 ms) |
| Doeltijd | Zet een tijd; solves die eronder blijven krijgen een groen stipje |
| Geluid | Piep op 8 en 12 seconden inspectie, klik bij start en stop |
| Trillen | Korte trilling bij groen, start en stop (mobiel) |
| Record vieren | Confetti en een melding bij een nieuw persoonlijk record |
| Grafiek | Verloop van je sessie met de ao5 als stippellijn |
| Beste en slechtste | Groen en rood in de lijst |
| Tijden exporteren | Hele sessie met scrambles naar je klembord |

Alles wordt lokaal bewaard, net als de tijden.

## Sessies

Boven de lijst staat een keuzelijst met je sessies. Via **beheer** hernoem je de huidige
sessie, start je een nieuwe, of gooi je er een weg. Elke sessie houdt zijn eigen tijden
en statistieken bij; de laatst gekozen sessie staat er bij het openen weer.

Tijden uit een oudere versie van de app worden bij het eerste bezoek automatisch als
"Sessie 1" overgenomen.

### Waarom de lampjes van de timer hier niet te regelen zijn

De lichteffecten van de GAN Halo worden ingesteld via GAN's eigen app, over een
protocol dat niet openbaar is. Wat de timer over bluetooth aanbiedt, is te zien onder
**Je timer** in de instellingen: de service `fff0` met `fff2` (lezen: opgeslagen tijden)
en `fff5` (lezen en notificaties: de toestand van de timer). Daar zit geen
schrijfbare ingang bij, dus de app kan de LED-kleur, het knipperen of de helderheid
van het apparaat niet veranderen. De ringkleur in de instellingen kleurt daarom de
ring op het scherm, niet de lampjes in je mat.

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
src/settings.js   voorkeuren en de kleuren
src/feedback.js   tonen, trillen en confetti
src/chart.js      sparkline van de sessie
```

Het bluetooth-protocol van de GAN Smart Timer (service `fff0`, state-characteristic `fff5`,
CRC-16/CCITT-FALSE) is overgenomen uit [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth).
