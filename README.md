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
| Naar een ander toestel | Alles in één bestand, en dat bestand weer inlezen — samenvoegend |
| Tijden exporteren | Hele sessie naar je klembord of naar een bestand: tekst, csv of cstimer-JSON |
| Tijden invoeren | Plak een lijst of kies een tekstbestand; `12.34`, `1:23.45`, `12.34+` en `DNF(12.34)` worden herkend |

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
kijkt hij naar het matje zodra de tijd stopt.

Wat er dan gebeurt hangt af van één ding: of je hem de kleuren van je kubus geleerd hebt.

### Leer hem je kleuren, dan hoeft hij niet meer te gokken

Ga naar **instellingen → wat de camera ziet**, leg je **opgeloste** kubus op het matje en
druk op *kleuren van deze kubus leren*. Hij ziet drie vlakken, dus draai hem om en druk
nog eens. Na twee keer heeft hij alle zes, en staan ze als kleurvlakjes in het venster.

Dat verandert alles, want de moeilijkheid zat nooit in de regel maar in het aflezen. Zonder
die kleuren moet hij uit het beeld alleen afleiden welke stickers bij elkaar horen, en juist
dát ging mis: onder ruis splitste hij één vlak in twee nette, goed gescheiden groepjes en
niets in de rekensom wist beter.

Mét die kleuren gaat elk stukje kubus naar de dichtstbijzijnde van zes bekende kleuren, en
dan telt hij **vlekken** in plaats van kleuren. Dat is de eigenlijke vorm van je regel: een
opgeloste kubus is één ononderbroken vlek per zichtbaar vlak, dus drie op een hoekaanzicht.
Eén kwartslag legt een streep van een andere kleur over twee vlakken — vier of vijf vlekken.
Alles daarboven is meer dan één zet. Een gescrambelde kubus komt uit op een stuk of twintig.

Uitgemeten over 324 opstellingen — vier verschillende lichten, drie kubusgroottes,
zevenentwintig camerahoeken, met kleuren die één keer onder één licht geleerd zijn. Vier
keer gedraaid, want er zit ruis in:

| | telt kleuren (ongeleerd) | telt vlekken (geleerd) |
|---|---|---|
| valse straf op opgeloste kubussen | 9 op 324 | **2 tot 5 op 324** |
| gescrambelde kubus betrapt | 43 op 648 | **324 op 324**, elke keer |
| +2 herkend | onmogelijk | **293 op 324** |

De eenendertig +2's die niet als +2 langskwamen zijn niet gemist — die kwamen als DNF
binnen. Er is geen enkele opstelling waarin een kubus die niet opgelost was, ongemoeid
bleef.

Vandaar: **is hij geleerd, dan zet hij de straf zelf**, met een *toch niet* in de melding
om het terug te draaien. Is hij niet geleerd, dan blijft hij bij vragen — de rest van deze
paragraaf gaat over waarom.

Twee eerlijke kanttekeningen. Die getallen komen uit een tekening van een kubus, niet uit
jouw kamer; **wat de camera ziet** is er om te controleren of het bij jou ook zo gaat. En
de kleuren zijn geleerd onder het licht van dat moment: verhuis je lamp, dan is het één
druk op *opnieuw leren*.

### Waarom vragen en niet zetten, als hij niets geleerd heeft

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
maar niet goed — en dit is precies wat je overhoudt als hij je kleuren niet kent.
Uitgemeten over 972 opstellingen — drie matjes, vier kubusgroottes,
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

Die pixels zijn er echte. Een uitsnede wordt nooit groter uitgelezen dan de camera hem
geeft: snijd je een klein stukje uit een camera die maar 640 pixels aanlevert, dan zou
opblazen tot volle grootte een kubus van 40 pixels als een comfortabele 250 laten meten,
en dan gaat elke regel hierboven over verzonnen detail. Levert je camera te weinig, dan
zegt hij dat ook met zoveel woorden in plaats van je nóg strakker te laten bijsnijden.

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

## Wat er in een echte kamer misgaat

Een paar dingen die je pas tegenkomt als de app op een tafel staat en niet in een test.

**De app twee keer open.** Een tabblad én de geïnstalleerde app zijn twee kopieën van
dezelfde tijden. Het tweede venster las het bestand toen het openging en houdt die kopie
vast; de eerste keer dat het iets opslaat, gaat alles wat je in het andere venster hebt
gesolved eraan. Nagemeten: drie solves in venster A, één in venster B, en er bleef er
**één** over. De browser meldt wél dat een ander venster geschreven heeft, dus dit venster
neemt dat nieuwere bestand nu over in plaats van eroverheen te schrijven. Diezelfde test
houdt nu alle vier de tijden.

**De camera bleef aanstaan.** Ging je tijdens een solve naar een andere app, dan bleef de
lens draaien op een pagina die de browser niet eens meer tekent. Nu gaat hij uit zodra je
weg bent, en ook als iOS de pagina wegzet zonder het te melden.

**Elke tweede solve werd overgeslagen.** Startte je een nieuwe solve terwijl hij de vorige
nog bekeek, dan zag hij de camera al openstaan en dacht dat er niets te doen was — waarmee
hij die solve zonder foto's van het lege matje inging, en er dus niets mee kon. Zonder één
woord.

**De camera werd afgepakt.** Neemt een andere app hem over, of trek je de toestemming in,
dan stopt de stroom beelden zonder fout: hij bleef het laatste beeld bestuderen dat hij
ooit kreeg. Dat wordt nu opgemerkt en gezegd.

**Je draaide je iPad.** De vier hoeken staan in de coördinaten van het beeld, en dat beeld
kantelt mee. Wat hij van het matje geleerd had, sloeg dan nergens meer op. Hij merkt de
verandering nu op, leert het matje opnieuw en vraagt je de hoeken na te kijken.

**De timer viel weg tijdens je solve.** Buiten bereik of een lege batterij, en de klok op
het scherm liep gewoon door zonder uitleg. Er staat nu bij dat hij op de klok van de app
verder telt en hoe je hem stopt.

**Eén streepje bereik.** De service worker ging eerst naar het netwerk. Offline is dat
geen probleem — dat mislukt meteen — maar een hotelwifi die de verbinding aanneemt en dan
zwijgt, is dat wél: de bestanden importeren elkaar, dus de wachttijden stapelen op.
Gemeten tegen zo'n server duurde laden **15,7 seconden**. De schil komt nu uit de cache en
wordt daarachter ververst; dezelfde meting: **2,7 seconden**. Een uitrol landt nog steeds
op de eerstvolgende keer dat je herlaadt. En een bestand dat er niet is krijgt geen
HTML-pagina meer als antwoord — dat maakte van een ontbrekend bestand een syntaxfout,
wat eruitziet alsof de hele app stuk is.

## Naar een ander toestel

**Instellingen → naar een ander toestel** maakt één bestand met al je sessies, tijden,
scrambles, notities en voorkeuren: `cubetimer-2026-08-20.json`. Bewaar het, zet het op je
andere toestel — AirDrop, mail, een map in de cloud — en kies het daar bij *bestand kiezen*.
Kan je browser bestanden delen, dan staat er ook een knop **versturen**, die het meteen aan
de deelknop van je toestel geeft.

Het **voegt samen, het overschrijft niet**. Voordat je iets kiest staat er wat het bestand
zou brengen: hoeveel tijden erin zitten, hoeveel daarvan nieuw zijn voor dit toestel en
hoeveel er al stonden. Solve je 's ochtends op je tablet en 's avonds op je telefoon, dan
kun je het bestand heen en weer sturen en heb je aan beide kanten alles. Hetzelfde bestand
twee keer inlezen verandert niets — een tijd wordt herkend aan het moment waarop hij
gestopt is, tot op de milliseconde.

Wat niet meegaat: wat de camera van je matje en je kubus geleerd heeft. De vier hoeken zijn
tegen één camera in één kamer getekend en de zes kleuren zijn onder één lamp geleerd; die
aan een nieuw toestel geven is het drie instellingen geven die niet kloppen. Je thema,
kleuren, inspectietijd en doelen gaan wel mee.

Wil je toch alles op dit toestel weggooien en precies het bestand overhouden, dan is er
**alles vervangen**, met een vraag ervoor die zegt hoeveel tijden eraan gaan.

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

### Records en terugblik

Onderaan de statistieken zit **records en terugblik**. Alles daarin staat al in je
opslag; het is alleen nooit eerder bij elkaar gezet.

- **Vandaag** — hoeveel je vandaag gedaan hebt, je beste en je ao5, en of dat meer of
  minder is dan je gewone dag.
- **Je snelste drie** op een echt podium, goud in het midden.
- **Hoe je record gezakt is** — elke keer dat je PB viel, met de datum en hoeveel eraf
  ging. Bovenaan staat de huidige, met erboven hoe lang hij al staat.
- **Je beste vijf op rij** — je beste ao5-reeksen ooit, en ze mogen elkaar niet
  overlappen. Anders staat er tien keer dezelfde goede middag in, telkens één solve
  verschoven. Tik er een aan en je ziet de vijf solves.
- **Wat als** — wat je gemiddelde geweest was zonder je traagste paar. Niet om iets van
  te leren; het is gewoon prettig om te zien, en de grootte van het verschil zegt of je
  probleem je tempo is of je ongelukken.
- **Op deze dag** — wat je vandaag een jaar geleden deed, als er iets is.
- **De teller** — solves ooit, hoeveel uur je aan het draaien geweest bent, en over
  hoeveel dagen. Over al je sessies samen.

Onder de ring staat bovendien wat je nog nodig hebt: staat er geen doeltijd, dan jaagt hij
op je **PB ao5** en zegt hij wat deze solve maximaal mag worden om hem te pakken.

### Merken op een tijd

Twee dingen die een solve in de lijst kan meekrijgen, via de snelacties (vasthouden) of
het detailvenster:

**Telt niet mee.** Voor een opwarmer, een keer dat je werd gestoord, of een solve waarvan
je gewoon weet dat hij niet meetelt. Hij blijft in je lijst staan, doorgestreept, maar valt
buiten elk gemiddelde en elk record. Nagemeten met een geluksmomentje van 3,00 in een
sessie van rond de 12: beste ging van 3,00 terug naar 11,80 en de ao5 van 12,16 naar 12,23,
zonder dat de regel verdween. Wissen zou dat ook gedaan hebben, maar dan was je ook kwijt
dát je die solve gedaan had.

**★ Bewaren.** Voor de solve waarvan je weet dat hij bijzonder was. Later terug te vinden
via de filter.

### Zoeken in je tijden

**zoek** boven de lijst opent een zoekveld en een paar knopjes: alleen bewaarde solves,
alleen +2's, alleen DNF's, alleen wat niet meetelt. Het zoekveld kijkt in je scramble, je
notitie en de tijd zelf.

Wat het níet doet is je gemiddelden veranderen. Een ao5 van een zoekresultaat is geen
getal dat iemand wil; de filter bepaalt alleen wat je ziet.

### Een tijd met de hand toevoegen

**+ tijd** boven de lijst, voor een solve die je ergens anders gedaan hebt. `12.34` en
`1:23.45` worden allebei gelezen, je kunt er een +2 of DNF bij zetten en een scramble
intypen. Er staat onderaan wat er toegevoegd gaat worden voor je op de knop drukt, en er
zit een ongedaan-maken in de melding.

### Tijden naar een andere sessie

Bijna altijd omdat ze in de verkeerde terechtgekomen zijn: vijf 2x2-solves die in je
3x3-sessie belandden omdat je de puzzelkiezer niet had aangeraakt. Dat kan nu rechtgezet
worden zonder ze over te typen.

- **Eén tijd**: houd hem vast in de lijst en kies **verplaatsen**, of open hem en gebruik
  dezelfde knop in het detailvenster.
- **Meerdere**: druk op **selecteer**, vink ze aan en druk op **verplaats**.

Je krijgt een lijstje met je andere sessies, met hoeveel tijden er al in staan. Staat er een
sessie voor een andere puzzel bij, dan is die naam gekleurd — want dat is meestal precies
waarom je aan het verplaatsen bent, niet iets om tegen gewaarschuwd te worden. Is de sessie
die je zoekt er nog niet, dan maak je hem onderaan in één stap aan, met een naam en een
puzzel naar keuze.

De tijden landen tussen de tijden die er al stonden, op het moment waarop ze gesolved zijn,
en niet op een hoop achteraan. En er staat een **ongedaan maken** in de melding die beide
sessies precies terugzet zoals ze waren.

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
src/preview.js    het plaatje bij de scramble, voor alle zes de puzzels
src/gan-timer.js  Web Bluetooth client voor de GAN Smart Timer
src/vision.js     de kubus op het matje vinden en lezen
src/stats.js      tijdnotatie, ao5/ao12, mean
src/practice.js   dagen, reeksen en de oefenmeter
src/store.js      opslag van de sessies
src/backup.js     alles in één bestand, en dat bestand weer samenvoegen
src/settings.js   voorkeuren en de kleuren
src/feedback.js   tonen, trillen, confetti en de puls bij een gemiste doeltijd
vendor/           cubing.js (MPL-2.0) en random-uint-below (Unlicense)
manifest.webmanifest, sw.js, icons/  installeerbaar en offline
```

Het bluetooth-protocol van de GAN Smart Timer (service `fff0`, state-characteristic `fff5`,
CRC-16/CCITT-FALSE) is overgenomen uit [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth).
