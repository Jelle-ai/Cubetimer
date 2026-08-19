# Cubetimer

Speedcube timer met ondersteuning voor de **GAN Smart Timer** via Web Bluetooth.
Geen build, geen dependencies — het is gewoon HTML, CSS en JavaScript, en hij werkt
offline als je hem installeert.

## Features

- Scrambles voor 3x3, 2x2, 4x4, Pyraminx, Skewb en Megaminx; elke puzzel heeft zijn eigen sessie
- Inspectie start op het moment dat je de mat aanraakt, met een ring die in 15 seconden
  leegloopt rond de tijd
- Klik op de scramble om hem te kopiëren; notities per solve in het detailvenster
- Voorbeeld van de gescramblede puzzel onder de scramble, voor alle zes, aan of uit in de instellingen
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
| Sneller dan dat | Veeg een rij naar links tot het vuilbakje om te wissen |
| Straf per veeg | Veeg naar rechts voor **+2**, verder door voor **DNF** |
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
| Oefenreeks | Het strookje met je dagreeks aan of uit |
| Dagdoel | Op tijd of op solves, met het aantal erbij |
| Inspectie | Aan (15 seconden, met +2 en DNF) of uit |
| Tijd tijdens solve | Verbergen achter drie bolletjes, of gewoon laten lopen |
| Decimalen | `0.00` of `0.000`, net als het display van je timer |
| Vasthoudtijd | Kort (250 ms), normaal (400 ms) of lang (550 ms) |
| Voorbeeld | Plaatje van de gescramblede puzzel |
| Doeltijd | **Per sessie**: solves die eronder blijven krijgen een stipje, met een reeksteller |
| Tijd laten oplopen | Het eindgetal telt op na het stoppen |
| Scherm wakker houden | Voorkomt dat je telefoon in slaap valt tussen solves |
| Geluid | Piep op 8 en 12 seconden inspectie, klik bij start en stop |
| Trillen | Korte trilling bij groen, start en stop (mobiel) |
| Vieren | Confetti onder je doeltijd, een korte rode puls erboven, en een feest over het hele scherm bij een record |
| Beste en slechtste | Groen en rood in de lijst |
| Tijden exporteren | Hele sessie naar je klembord: als tekst, als csv of als cstimer-JSON |
| Tijden invoeren | Plak een lijst; `12.34`, `1:23.45`, `12.34+` en `DNF(12.34)` worden herkend |

Alles wordt lokaal bewaard, net als de tijden.

## Oefenreeks

Onder de gemiddelden staat een strookje met hoeveel je vandaag al gesolved hebt en
hoeveel dagen je reeks loopt. De tijd daarin is **je solves bij elkaar opgeteld**, niet
hoe lang de app openstond — een tabblad dat blijft staan is geen oefening.

Een dag telt mee zodra hij het dagdoel haalt. Dat doel is in de instellingen te kiezen:
op **tijd** (zoveel minuten solven) of op **solves** (zoveel keer), met het aantal erbij.
De vlam brandt zolang de reeks loopt; een dag die nog bezig is breekt hem niet, dus
's ochtends staat je reeks nog gewoon op de stand van gisteren.

Tik het strookje aan voor de geschiedenis: je huidige reeks, je langste ooit, vandaag,
het totaal, en de laatste zestig dagen met tijd en aantal per dag. Dagen die het doel
haalden krijgen een streep in de recordkleur.

Alles telt over al je sessies samen — oefenen is oefenen, op welke puzzel dan ook.

## De kubus laten controleren

Staat **kubus controleren** aan, dan gaat de selfiecamera open zodra je solve begint en
kijkt hij naar het matje zodra de tijd stopt. Denkt hij dat de kubus meer dan één zet van
opgelost af is, dan **vraagt** hij of het een DNF moet worden. Hij zet zelf nooit iets.

### Waarom vragen en niet zetten

Jouw regel klopt volledig: één vlak dat niet één kleur is maar zes-en-drie, dat is één zet
ernaast; een vlak met kleuren door elkaar is verder weg. Nagerekend op het echte
kubusmodel is dat zelfs bewijs — na precies één zet is géén van de 108 vlakken rommelig,
en van 400 scrambles heeft er 400 minstens één rommelig vlak.

Het probleem is niet de regel maar het aflezen. Om negen stickers van één vlak apart te
lezen moet de hoek van de kubus tot op een paar pixels bekend zijn. Uitgemeten over 162
camerastanden — hoogte 24 tot 42 graden, drie richtingen rond, drie scheefstanden —
schoof dat raster vaak genoeg mis om **31 straffen uit te delen op kubussen die opgelost
waren**. Eén op vijf.

Zonder dat raster, door alleen de kleuren over de hele kubus te tellen, wordt het beter
maar niet goed. Uitgemeten over 972 opstellingen — drie matjes, vier kubusgroottes,
zevenentwintig camerahoeken — deelt hij negen valse straffen uit op 324 opgeloste
kubussen en betrapt hij er 43 van 648 gescrambelde. Ongeveer één misser tegenover vijf
vangsten, en de drempel verhogen ruilt het ene tegen het andere. Beter dan het was, nog
altijd niet goed genoeg om zelf iets te zetten. Vandaar dat het bij een vraag blijft.

### Toestemming en welke camera

De toestemmingsvraag komt zodra je de pagina voor het eerst aanraakt, niet midden in een
solve. Eerder kan niet: een browser stelt die vraag alleen naar aanleiding van iets wat je
zelf doet. Onder **instellingen → toestemming** staat wat eruit kwam, en er staat ook bij
**welke camera** hij daadwerkelijk kreeg — voorcamera of achtercamera. Lukt het niet, dan
staat de reden er in plaats van een leeg scherm.

De voorcamera wordt met `exact` gevraagd en pas daarna met een wens als reserve. Alleen
een wens bleek niet genoeg: Safari op een iPad geeft je dan gewoon de achterkant.

### Live meekijken

**Instellingen → wat de camera ziet** laat zien wat hij doet: eerst leert hij een paar
seconden het lege matje, daarna leg je er een kubus op en zie je live wat hij ervan maakt.
Dat is het eerlijkste stuk van de hele functie — je ziet zelf of je hem in jouw kamer,
met jouw licht en jouw camerahoek, wilt geloven.

### Wat blauw op blauw kapotmaakte

Een gescrambelde kubus kwam er steevast uit als *te klein in beeld* of *geen kubusvorm*,
en een opgeloste niet. Dat verschil zat in de blauwe stickers. De kubus wordt gevonden
door hem van het lege matje af te trekken, en waar er één drempel was, werd die gezet op
een deel van het grootste verschil in beeld. Eén wit vlakje bepaalt dat verschil; elk
blauw vlakje op een blauw matje valt er dan onder. De omtrek viel uit elkaar en het
grootste overgebleven stuk was een hoek van een kubus in plaats van een kubus. Een
opgeloste kubus met wit, rood en groen in beeld heeft dat ene lastige vlakje niet en ging
gewoon door.

Er staan nu twee drempels: wat er ruim boven zit is de kubus, en alles wat er nét boven
zit en daaraan raakt hoort erbij. Een blauw vlakje midden tussen de andere haalt het zo
alsnog, en wat volledig wegvalt wordt opgevuld — een kubus heeft geen ramen, dus een gat
middenin is een sticker die zoek is, geen gat in de kubus. Over diezelfde 972 opstellingen
ging het van **194 keer afgewezen als geen kubusvorm naar nul**.

### Groot genoeg om te lezen, groot genoeg om iets te zeggen

Dat zijn twee verschillende dingen. Onder de 56 pixels breed is er niets te lezen. Tussen
56 en 180 leest hij hem wel, maar zijn de monsters te weinig pixels elk om hun kleur vast
te houden, en splitst de indeling drie kleuren met veel vertrouwen in zes: op 140 pixels
zat hij zes keer op de zevenentwintig mis over een opgeloste kubus, op 200 geen enkele
keer. Daartussenin zegt hij dus wat hij ziet en houdt hij zijn mening voor zich — met de
raad het beeld bij te snijden, want dat is precies wat de kubus groter maakt.

### Het beeld bijsnijden

Een camera die de hele kamer ziet, besteedt de meeste pixels aan de kamer. Stond er
telkens *te klein in beeld*, dan is dat het probleem: negen stickers moeten er samen zo'n
zesenvijftig pixels breed uitkomen, en een kubus in de hoek van een wijd beeld haalt dat
niet.

In **wat de camera ziet** staan daarom vier hoeken. Sleep ze op de vier hoeken van je
matje — het mag scheef, want een camera die op een stoel staat ziet je matje ook niet als
een keurige rechthoek maar als een trapezium. Sleep ernaast om de hele vorm in één keer te
verschuiven, en **hele beeld** zet alles terug.

Vier hoeken en geen kader, omdat een kader om zo'n trapezium heen aan twee kanten het
bureau meepakt. Alles wat buiten de vorm ligt telt niet meer mee: legt er iemand een
telefoon naast, of komt er een hand langs, dan is dat geen verandering op het matje meer.
Nagemeten met iets lichts naast het matje ging een kubus die zonder de vorm werd
weggegooid als *geen kubusvorm*, met de vorm gewoon door.

En omdat er alleen nog gekeken wordt naar het kleinste vierkant waar die hoeken in passen,
komt de kubus er evenredig groter uit. De keuze wordt bewaard, geldt ook tijdens je solves,
en het venstertje in de hoek toont voortaan precies dat stuk en niet meer de kamer eromheen.

Verzet je de vorm, dan leert hij het lege matje meteen opnieuw: door een ander raampje
gekeken zegt het oude beeld van het matje niets meer.

### Hoe hij de kubus vindt

Terwijl je solvet ligt de kubus in je handen, dus het matje is leeg. De camera neemt
tijdens de solve een reeks foto's van dat lege matje en neemt daar de middelste waarde
van, zodat langsschietende handen wegvallen. Wat er daarna anders is, is de kubus. Geen
kalibratie, en het werkt op een blauw matje zonder te weten dat het blauw is. Dat deel
werkt wel goed: lege matjes, rommel, een hand ervoor en een kubus half uit beeld worden
allemaal netjes herkend en overgeslagen.

## Sessies

Boven de lijst staat een keuzelijst met je sessies. Via **beheer** hernoem je de huidige
sessie, start je een nieuwe, of gooi je er een weg. Elke sessie houdt zijn eigen tijden
en statistieken bij; de laatst gekozen sessie staat er bij het openen weer.

Op een telefoon staat de kaart met gemiddelden op het timerscherm zelf, onder de ring:
single, mo3, ao5 en ao12, met het sessierecord in goud eronder. De lijst met tijden blijft
in zijn eigen menu.

Tik een getal in de statistieken aan en je ziet de solves waar het uit bestaat: de vijf
van je ao5, de vijf van je beste ao5, je +2's, je DNF's, alles onder je doeltijd. Tik daar
een tijd aan en je hebt de scramble.

Tik de kaart met gemiddelden aan voor alle statistieken. Die staan in drie groepen —
**sessie** (aantal, mean, beste, slechtste), **gemiddelden** (mo3 tot ao100, met het
record ernaast in plaats van eronder) en **straffen**. Bovenaan staat **vergelijk met**:
kies een tweede sessie en elke waarde krijgt een kolom per sessie.

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
