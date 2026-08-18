# Cubetimer

Speedcube timer met ondersteuning voor de **GAN Smart Timer** via Web Bluetooth.
Geen build, geen dependencies — het is gewoon HTML, CSS en JavaScript, en hij werkt
offline als je hem installeert.

## Features

- Scrambles voor 3x3, 2x2, 4x4, Pyraminx en Skewb; elke puzzel heeft zijn eigen sessie
- Inspectie start op het moment dat je de mat aanraakt, met een ring die in 15 seconden
  leegloopt rond de tijd
- Klik op de scramble om hem te kopiëren; notities per solve in het detailvenster
- Klein kubusvoorbeeld onder de scramble (3x3 en 2x2), aan of uit in de instellingen
- Installeerbaar als app en bruikbaar zonder internet
- Timen met de spatiebalk (of tikken op mobiel): vasthouden tot groen, loslaten om te starten
- GAN Smart Timer koppelen — de tijd komt dan rechtstreeks van het apparaat, op de milliseconde nauwkeurig
- WCA-inspectie van 15 seconden, met automatisch +2 na 15s en DNF na 17s
- Tijdens een solve blijft alles gewoon staan; alleen in de ring verschijnen drie bolletjes
- Meerdere sessies naast elkaar, elk met eigen tijden; kies ze bovenaan de lijst
- Statistiekbalk met single, mo3, ao5 en ao12 — de actuele waarde met het record van de
  sessie eronder in goud
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
| 2× kort aanraken achter elkaar | Vraagt of je laatste tijd weg mag |
| 1× kort aanraken bij die vraag | Bevestigt het wissen |
| Aanraken en vasthouden tot groen | Gewone start van een solve — telt niet als aanraking |
| Resetknop op de timer | Het display van de app gaat mee naar `0.00`, verder niets |

+2 en DNF zitten niet op de mat: die zet je op de solve zelf (tik hem aan in de lijst) of
op een hele selectie tegelijk.

Een aanraking wordt direct uitgevoerd, zonder wachten. Volgt er binnen 600 ms een tweede,
dan wordt die eerste actie teruggedraaid en vraagt de app in de plaats daarvan of je
laatste tijd weg mag. Alleen het bevestigen van het wissen wacht die 600 ms af, zodat een
volgende dubbeltik nog kan ingrijpen. Wissen kan op elk moment — ook meteen na een solve
terwijl de timer de tijd nog toont, en zo vaak achter elkaar als je wilt. Begin je in
plaats van te bevestigen een solve, of raak je een kleine acht seconden niets aan, dan
vervalt de vraag vanzelf.

Omdat de resetknop niets anders doet dan het display gelijkzetten, kan de reset na een
solve nooit per ongeluk inspectie starten.

### Tijden die op je timer staan

De app vraagt toegang tot de tijd-dienst van de timer plus de twee standaarddiensten
batterij en apparaatinfo, en leest je batterijstand uit als de timer die doorgeeft. Wat je
timer allemaal aanbiedt staat onder **Je timer** in de instellingen — een browser laat een
pagina namelijk alleen diensten zien waar vooraf om gevraagd is.

Verschijnt het keuzevenster van de browser niet, dan wordt de aanvraag meteen nog eens
gedaan in de simpelste vorm: alle apparaten in de buurt, en alleen de tijd-dienst. Sommige
browsers weigeren een aanvraag met naamfilters of met extra diensten erin nog voordat je
iets te zien krijgt.

Lukt verbinden alsnog niet, dan zegt de melding wat er misging: geen bluetooth op het
apparaat, geen toestemming, timer uit of al verbonden met een andere app, geen https, of
een apparaat zonder de tijd-dienst. Diezelfde tekst blijft onder **Je timer** in de
instellingen staan, want een melding is weg voor je hem kunt overschrijven. De eerste
poging om te koppelen mislukt bij bluetooth vaker zonder aanwijsbare reden, dus die wordt
automatisch tot drie keer herhaald.

De timer bewaart zelf een handvol tijden: de tijd op het display, gevolgd door de vorige.
De app leest élke plek uit die het apparaat doorgeeft — niet een vast aantal — en biedt
alles aan wat nog niet in je sessie staat. Zodra de app verbinding maakt kijkt hij
of daar tijden bij zitten die nog niet in je sessie staan (de plek van het display bevat
meestal dezelfde tijd als de meest recente vorige, dus dubbele worden eruit gefilterd) — bijvoorbeeld solves die je
deed terwijl deze pagina dicht was. Zo ja, dan vraagt hij of je ze erbij wilt zetten.
Zeg je nee, dan wordt daar niet meer om gevraagd. Wat je overneemt wordt ook onthouden,
dus je krijgt het nooit twee keer aangeboden.

Het geheugen van de timer zelf leegmaken kan de app niet: op de bluetooth-dienst van de
timer staat geen enkele schrijfbare ingang (te zien onder **Je timer** in de
instellingen), dus wissen kan alleen via de eigen app van GAN. In de praktijk maakt dat
niets uit, want de app onthoudt wat hij al gezien heeft. Handmatig opnieuw kijken kan onder
**Je timer** in de instellingen.

De vraag komt zodra je op **Verbind timer** drukt; de app maakt uit zichzelf geen
verbinding bij het openen van de pagina.

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
| Nieuwe scramble | `nieuwe scramble` of `N` |
| Scramble kopiëren | klik op de scramble of `C` |
| Laatste tijd wissen | `D`, daarna bevestigen |
| Instellingen | `I` |
| Volledig scherm | `F` |
| Details van een tijd | klik op de tijd in de sessielijst |
| +2 / DNF / verwijderen | knoppen in dat detailvenster |
| Sneller dan dat | Veeg een rij naar links om te wissen, naar rechts voor +2 |
| Alles in één keer | Houd een rij vast (of klik met rechts) voor +2, DNF, details en wissen |
| Per ongeluk gewist | De melding onderaan biedt zes seconden lang `ongedaan maken` |
| Meerdere tijden tegelijk | `selecteer` boven de lijst, tik ze aan, dan +2, DNF of wis |

Inspectie is optioneel: vanuit stilstand meteen vasthouden en loslaten start gewoon een
solve zonder inspectie.

## Instellingen

Via het tandwiel rechtsboven:

| Instelling | Keuze |
| --- | --- |
| Kleuren | Zes snelkeuzes voor de ring, plus een kiezer voor elke kleur apart: ring, klaar, vasthouden en records |
| Thema | Licht, donker of volg je toestel |
| Cijfers | Het lettertype van de timer: rond, strak of mono |
| Inspectie | Aan (15 seconden, met +2 en DNF) of uit |
| Tijd tijdens solve | Verbergen achter drie bolletjes, of gewoon laten lopen |
| Decimalen | `0.00` of `0.000`, net als het display van je timer |
| Vasthoudtijd | Kort (250 ms), normaal (400 ms) of lang (550 ms) |
| Kubusvoorbeeld | Klein plaatje van de gescramblede kubus |
| Doeltijd | Zet een tijd; solves die eronder blijven krijgen een stipje, met een reeksteller |
| Tijd laten oplopen | Het eindgetal telt op na het stoppen |
| Scherm wakker houden | Voorkomt dat je telefoon in slaap valt tussen solves |
| Geluid | Piep op 8 en 12 seconden inspectie, klik bij start en stop |
| Trillen | Korte trilling bij groen, start en stop (mobiel) |
| Vieren | Confetti onder je doeltijd, een korte rode puls erboven, en een feest over het hele scherm bij een record |
| Beste en slechtste | Groen en rood in de lijst |
| Tijden exporteren | Hele sessie naar je klembord: als tekst, als csv of als cstimer-JSON |
| Tijden invoeren | Plak een lijst; `12.34`, `1:23.45`, `12.34+` en `DNF(12.34)` worden herkend |

Alles wordt lokaal bewaard, net als de tijden.

## Sessies

Boven de lijst staat een keuzelijst met je sessies. Via **beheer** hernoem je de huidige
sessie, start je een nieuwe, of gooi je er een weg. Elke sessie houdt zijn eigen tijden
en statistieken bij; de laatst gekozen sessie staat er bij het openen weer.

Op een telefoon staat de kaart met gemiddelden op het timerscherm zelf, onder de ring:
single, mo3, ao5 en ao12, met het sessierecord in goud eronder. De lijst met tijden blijft
in zijn eigen menu.

Tik de kaart met gemiddelden aan voor alle statistieken. Daar staat bovenaan **vergelijk
met**: kies een tweede sessie en alles komt in twee kolommen naast elkaar te staan.

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

De scrambles zijn **random-state**: er wordt een willekeurige toestand van de puzzel
gekozen en een solver rekent uit welke zetten daarheen leiden. Dat is de manier waarop
officiële WCA-scrambles worden gemaakt, en het is wat je wilt — bij random-move scrambles
zijn sommige toestanden waarschijnlijker dan andere.

Het rekenwerk komt van [cubing.js](https://github.com/cubing/cubing.js), de bibliotheek
achter de officiële WCA-scramblers, meegeleverd in `vendor/cubing` onder de MPL-2.0. De
eerste scramble van een puzzel kost even (3x3 ongeveer een halve seconde, 4x4 een paar
seconden); daarna staat de volgende altijd klaar en verschijnt hij meteen. Lukt het laden
niet — een oude browser, of offline vóór de eerste keer — dan valt de app terug op een
random-move scramble, herkenbaar aan de stippellijn eronder.

## Structuur

```
index.html        opbouw van de pagina
styles.css        styling
src/app.js        state machine, invoer en UI
src/scramble.js   scramble-generator (random-state via cubing.js, met reserve)
vendor/           cubing.js (MPL-2.0) en random-uint-below (Unlicense)
src/gan-timer.js  Web Bluetooth client voor de GAN Smart Timer
src/stats.js      tijdnotatie, ao5/ao12, mean
src/store.js      opslag van de sessie
src/settings.js   voorkeuren en de kleuren
manifest.webmanifest, sw.js, icons/  installeerbaar en offline
src/feedback.js   tonen, trillen, confetti en de puls bij een gemiste doeltijd
src/cube.js       kubussimulatie voor het voorbeeld
```

Het bluetooth-protocol van de GAN Smart Timer (service `fff0`, state-characteristic `fff5`,
CRC-16/CCITT-FALSE) is overgenomen uit [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth).
