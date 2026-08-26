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
- 129 gevallen om te trainen — alle F2L, OLL en PLL — met 228 algoritmes, allemaal op een
  echte kubus nagekeken voor ze aangeboden worden
- Een gevallenboek waarin je per geval de manieren ziet, er een ster bij zet, je eigen
  algoritme toevoegt (dat nagekeken wordt) en er een notitie bij schrijft
- Opfrissen: wat je bijna vergeten bent komt terug, uit je eigen tijden gerekend
- Een algblad om af te drukken, met alleen wat jij gekozen hebt
- Een cursus in acht stappen om te leren oplossen, met een weg die meegroeit
- Het rad: 2640 kleine, onredelijke uitdagingen
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

Via het tandwiel rechtsboven, of via de zijlijst. Er staan **alleen instellingen** in en
alleen de titel ervan: alles wat de app kán doen staat in de zijlijst, en een venster dat
half een menu en half een formulier is, is geen van beide.

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
| Cross, F2L, OLL en PLL apart meten | De splitknop tijdens je solve |
| Ring kleurt mee met je tempo | Warm als je voorligt, koel als je achterloopt |
| Scrambles op maat | Gezeefd op hoe lang het kruis wordt: alles, alleen vlotte of alleen lastige |
| Cross-tip na je solve | Achteraf: in hoeveel zetten het kruis had gekund, op jouw kleur en op de andere vijf |
| Doeltijd met een datum | Een tijd om onder te komen en wanneer, met of je op schema ligt |
| Je kubussen | Geef ze een naam en kies welke er ligt |
| Tijden exporteren | Hele sessie naar je klembord of naar een bestand: tekst, csv of cstimer-JSON |

**Naar een ander toestel** en **tijden plakken** staan in de zijlijst, niet hier: het zijn
dingen die je doet, geen dingen die je instelt.

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

## Naar een ander toestel

**Zijlijst → naar een ander toestel** maakt één bestand met al je sessies, tijden,
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

Diezelfde bestandskiezer leest ook een **export uit csTimer**. Sessienamen, scrambles,
notities, +2's, DNF's en de momenten komen mee; de puzzel wordt overgenomen waar csTimer
hem meestuurt en valt anders terug op 3x3, wat dan zichtbaar fout staat en met één tik te
verplaatsen is. Wie overstapt hoeft dus geen jaar tijden over te typen.

Wat niet meegaat: welk tabblad van een venster je open had staan en welke groepen van de
lijst links je dichtgeklapt had. Dat zijn gewoontes van een scherm, niet van een persoon,
en een telefoon en een laptop zijn niet hetzelfde scherm. Je thema, kleuren, inspectietijd,
doelen en de namen van je kubussen gaan wel mee.

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

## Trainen op losse gevallen

**Zijlijst → gevallen trainen.** Kies F2L, OLL, PLL of een van de twee-kijkbeurt-groepen,
druk op beginnen, en je krijgt een **opzet**: draai die op je opgeloste kubus en het geval
ligt voor je. Solve alleen dat stukje. Zodra je stopt staat het volgende geval er al, dus
drillen is één druk per herhaling.

Er zitten **129 gevallen** in — alle 41 F2L, alle 57 OLL, alle 21 PLL, en de tien van de
twee-kijkbeurt-manier — met samen 228 algoritmes. Je tijden per geval worden apart bewaard,
bij het spel en niet bij je sessies: een PLL-drill van anderhalve seconde hoort niet tussen
je 3x3-gemiddelden.

### Wat er aangeboden wordt

Vier keuzes, en je maakt ze zelf:

- **Alles door elkaar** — eerst wat je nog nooit gehad hebt, daarna willekeurig.
- **Opfrissen** — wat op het punt staat weg te zakken. Zie hieronder.
- **Je zwakste derde** — de gevallen waar je het traagst op bent, en niets anders.
- **Een reeks van jezelf** — je kiest de gevallen aan met hun plaatje erbij, geeft de reeks
  een naam, en hij staat er voorgoed tussen. Snelknoppen voor "wat ik nog niet gedaan heb",
  "mijn traagste tien" en "wat ik moet opfrissen".

### Opfrissen

Er is geen aparte herhaalplanning om bij te houden: de tijden die je al maakte tijdens het
drillen zijn de hele invoer. Elke poging op een geval wordt gelezen als een herhaling
ervan, een vlotte telt als geslaagd en een trage als gemist, en het gat tot de volgende
keer groeit na een geslaagde en klapt in na een gemiste — 1 dag, 3 dagen, en daarna telkens
ruim het dubbele.

Wat "vlot" is wordt uit je eigen tijden gehaald: de mediaan van alles wat je in die groep
gedaan hebt, plus een derde. Geen getal dat iemand anders koos.

In het gevallenboek staat bij elk geval wanneer hij weer aan de beurt is, en een geval dat
over tijd is krijgt een streepje langs de rand.

## Het gevallenboek

**Zijlijst → gevallenboek.** Elk geval van een groep, met zijn plaatje, alles wat je erop
gedaan hebt, en elke manier waarop je het kunt doen.

Een geval opendoen geeft eerst de **kaart**: het plaatje groot, de naam ernaast, en hoeveel
zetten jouw manier is. Daaronder de manieren, en pas daarna je tijden — want je slaat een
geval op om te weten wát het is, en pas daarna wat je ermee doet.

De algoritmes staan **in stukken**, niet als een muur van twintig letters. Handen leren
geen zetten, ze leren groepjes — de sexy move, de sledgehammer, het uithalen en terugduwen
— dus wordt er geknipt op de bekende triggers en valt de rest in vieren.

### De ster

Bij elk algoritme staat een ster. Die zet je bij de manier die jij gebruikt, en dat is niet
alleen een notitie aan jezelf: **de opzet is het algoritme achterstevoren**, dus met de ster
ergens anders komt het geval voortaan te liggen zoals jouw algoritme het verwacht, in plaats
van zoals iemand anders het schrijft.

### Je eigen algoritme

Onderaan de manieren staat een veld waarin je je eigen manier typt. Niets wat je typt wordt
geloofd: het geval wordt opgezet zoals het boek het toont, jouw zetten worden erop gedaan,
en er wordt gekeken wat eruit komt. Alle vier de standen tellen mee — een algoritme dat het
geval een kwartslag anders vasthoudt is nog steeds dat algoritme — en bij een PLL telt ook
de laatste U niet mee, want die doe je zonder erbij na te denken.

"Opgelost" betekent wat het bij die drill betekent: een PLL moet de kubus afmaken, een OLL
hoeft alleen de bovenkant één kleur te krijgen, een F2L alleen zijn eigen paar thuis te
brengen. Klopt het niet, dan krijg je te horen waarom — *"breekt het kruis"*, *"lost dit
geval niet op"*, *"draait de hele kubus"* — en wordt er niets bewaard.

Alle 228 algoritmes die met de app meekomen halen die controle. Dat is nagemeten, en het is
de reden dat je die van jezelf ernaast mag zetten zonder dat de lijst minder waard wordt.

### Een notitie

Eén regel per geval, van jou aan jezelf. *"rechterhand, x-rotatie op het einde."* Hij staat
in het boek en gaat mee op je algblad.

## Het algblad

**Zijlijst → algblad.** Alles wat je gekozen hebt, op één pagina: het plaatje, de naam en
jouw manier, in een vorm die een printer overleeft.

Je kiest zelf welke groepen erop staan, en of je alles wilt, alleen wat je zelf gekozen
hebt, of alleen wat je al geoefend hebt. **Afdrukken** zet de rest van de pagina even weg
zodat er alleen een blad uitkomt; **kopieer als tekst** geeft hetzelfde als platte tekst,
voor waar geen printer staat.

## Leer oplossen

**Zijlijst → leer oplossen.** Een cursus in acht stappen, van "ik heb een kubus gekregen"
tot volledig OLL en PLL, met een weg ernaast waarop je ziet waar je bent.

Geen muur van algoritmes. Elke stap zegt eerst wát je probeert te doen en waarom de zetten
dat doen, want waar mensen op afhaken is dat ze twintig letters uit hun hoofd moeten leren
zonder te weten waar ze voor dienen. De algoritmes staan achteraan, en waar de app het
geval zelf al in zijn boek heeft, wijst de stap ernaartoe in plaats van het over te typen.

De stappen: de taal · het kruis · F2L op de makkelijke manier · echte F2L · OLL in twee
kijkbeurten · PLL in twee kijkbeurten · vlot worden · volledig OLL en PLL. Elke stap heeft
een knop naar de drill die erbij hoort, en een *dit kan ik* die de weg een stuk verder
tekent.

## Het rad

**Zijlijst → het rad.** Drie rollen, en een kleine, onredelijke uitdaging die je jezelf
nooit zou geven. Tien opdrachten, tweeëntwintig regels en twaalf inzetten: 2640
uitkomsten, en de meeste ervan zijn belachelijk.

> **10 solves** · *met een sok over je linkerhand* — lukt het niet: 10 extra solves

De eerste rol is de enige die de app kan zien: hij telt je solves, je gedrilde gevallen of
je herkenningen en weet wanneer je klaar bent. Of je echt op één been stond is tussen jou
en het been. Een aangenomen uitdaging blijft staan als je de pagina sluit, en er staat een
streepje mee bovenaan je sessie zolang hij loopt.

## Splits

Zet **splits** aan in de instellingen en er verschijnt tijdens je solve een knopje onder
de ring. Tik het (of druk op enter) als je cross klaar is, als je F2L klaar is, en als je
OLL klaar is. De vierde streep is het stoppen zelf.

Het knopje staat onder de ring en niet erop, want grijpen naar de splitknop mag nooit
grijpen naar het ding zijn dat de klok stopt. Een tik erop laat de tijd gewoon doorlopen.

Achteraf staan de vier stukken in het detailvenster van die solve, en bij **records en
terugblik** staat wat elk deel je gemiddeld kost over alle solves waarin je gesplitst hebt.
Op een andere puzzel dan 3x3 heten ze deel 1 tot en met 4.

Dit werkt alleen als je zelf timet. Op je matje is een hand optillen om een fase te
markeren precies hetzelfde gebaar als stoppen, dus daar is het uit.

## Metronoom, grote weergave, toetsen

Drie kleine dingen, alle drie in de instellingen.

**Metronoom** — een tik op een instelbaar tempo, tussen 30 en 300 per minuut, die
doorloopt terwijl je solvet. Dat is het enige moment waarop je er iets aan hebt. Hij stopt
vanzelf als je de pagina wegklikt.

**Grote weergave** — alles van het scherm behalve de scramble en de tijd, op een formaat
dat je aan de andere kant van de kamer nog leest. Escape brengt je terug.

**Toetsen en gebaren** — een overzichtje van wat spatie, escape, je matje en een veeg
allemaal doen.

## De kast, de kalender en het dagboek

Bij **records en terugblik** staan drie dingen die je nergens hoefde bij te houden.

**De kast.** Je eerste solve, je eerste sub-15, honderd dagen op rij, alle zes de puzzels
op één dag, een solve om drie uur 's nachts. Elke badge is een vraag die aan je hele
geschiedenis gesteld wordt, dus de kast wordt telkens opnieuw uitgerekend en er hoeft
niets bewaard te zijn op de dag zelf. Win je er een, dan is dat een moment met confetti —
één keer, want wat je al had wordt onthouden bij naam.

**Een jaar aan dagen.** Driehonderdvierenzestig vierkantjes, donkerder naarmate je die dag
meer gedraaid hebt. Geen grafiek: een muur om naar te kijken.

**Dagboek.** Eén regel per dag, geschreven door niemand: *"25 aug — 4 solves · beste 12,10
· record verbroken."*

### Eén dag vergeven

Een reeks van veertig dagen die sneuvelt omdat je één avond niet kon is wreed en leert je
niets. Vanaf drie dagen reeks wordt er één gemiste dag overgeslagen, en nog eens één per
dertig dagen die de reeks meegaat. De dag zelf telt niet als gehaald — de reeks loopt er
alleen overheen. Nagemeten: vijf op rij blijft vijf, een gat op dag drie geeft zes in
plaats van drie, en twee gaten kort na elkaar stopt bij het tweede.

## Hoe zwaar was die scramble

Elke timer bewaart je scramble; geen enkele kijkt ernaar. De puzzelmotor die je scrambles
maakt zit hier al, dus "hoe kort kon de cross" is gewoon een vraag die te beantwoorden is
— voor alle zes de kleuren tegelijk.

Zet **de cross die je miste** aan en na elke solve staat er: *"cross kon in 5 op geel, maar
in 3 op blauw."* Pas achteraf, want als je vooraf weet dat de cross vier zetten is, kijk je
anders naar de scramble. Achteraf is het het enige moment dat de scramble nog vers genoeg
is om te blijven hangen.

Bij **records en terugblik** staat wat dat over je hele sessie zegt, en dat is het getal
waar cubers eindeloos over discussiëren zonder ooit hun eigen cijfer te zien:

> Jouw kleur geel · 6,0 zetten · Kortste kleur 4,5 · **Je laat 1,5 zetten per solve liggen**
> · 3 of meer korter: 2 van 6

### Hoe dat kan zonder solver

De hele crosstoestand is vier randen: waar ze liggen en hoe ze liggen. Dat zijn 190.080
mogelijkheden, dus in plaats van per scramble te zoeken wordt één keer de afstand van
opgelost naar élke stand uitgerekend en daarna alleen nog opgezocht — 0,2 milliseconde per
scramble. Het bouwen kost een paar seconden en gebeurt stilletjes zodra de pagina niets te
doen heeft.

Onderweg ging er één ding grondig mis, en het is het vermelden waard omdat het er
plausibel uitzag: ik draaide de kubus om een andere kleur onder te krijgen, maar las de
stand nog steeds af als "waar ligt rand nummer vier". Een omgedraaide opgeloste kubus is
dan niet opgelost — vijf van de zes kleuren kregen een verkeerd antwoord op een kubus die
niet eens gescrambeld was. Nu wordt er gelezen tegen een meegedraaide referentie: *welk
stuk hoort in dit gaatje en ligt het er goed in*. Getest tegen dingen die vast staan: een
opgeloste kubus geeft nul voor alle zes, na `D'` is geel 1 en wit 0, en na `U'` andersom.

## Sfeer

Bij de instellingen kies je niet alleen een accentkleur maar een hele **sfeer**: het
papier, de inkt en de gloed samen. *Blauw matje*, *wedstrijdzaal*, *neon*, *papier*. Elke
sfeer kiest ook zijn eigen lettertype en stelt zijn accentkleur één keer in, waarna je hem
gewoon zelf kunt veranderen.

Een donkere sfeer zet ook het donkere thema aan. Dat leek eerst niet nodig en gaf een zwarte
ring die op wit papier zweefde.

## Delen

Twee manieren, allebei zonder server.

**Een kaartje.** In de statistieken staat **deel je ao5**: dat tekent een plaatje met je
vijf tijden, je gemiddelde en je naam erop. Getekend en niet gescreenshot, want het scherm
is ingedeeld om op te solven, niet om achteraf naar te kijken. Bewaren, of meteen naar de
deelknop van je toestel.

**Een link.** Je tijden worden ingepakt in het stuk van het adres achter de `#` — het
enige deel dat een browser nooit naar een server stuurt. Vijf tijden passen in twintig
tekens; de hele link is er zeventig lang. Er wordt dus niets geüpload en niets bewaard, en
hij werkt gewoon bij wie je hem naartoe stuurt: die ziet je tijden in een venstertje, met
erbij dat ze niet van hem zijn en niet bewaard worden.

## Je kubussen

In de instellingen kun je je kubussen een naam geven en aanvinken welke er ligt. Elke solve
onthoudt het, en bij **records en terugblik** komt er een blokje bij zodra er twee in
voorkomen: per kubus je gemiddelde, je beste en hoe vaak. Zo weet je eindelijk of die
nieuwe echt sneller is of dat je het jezelf wijsmaakt.

## De ring die meeleeft

Staat **ring leeft mee** aan, dan kleurt de ring tijdens je solve: warm zolang je voorligt
op je gewone tempo van de laatste twaalf solves, koel zodra je erover gaat. Geen cijfers —
je voelt het in je ooghoek. Werkt juist ook als je de tijd verborgen hebt, want dan is het
het enige wat je nog hebt.

## Spelen

Het knopje met het zonnetje in de balk. **Niets hiervan komt in je sessies terecht.** Een
marathonreeks en een sprint van vijf minuten zijn geen solves die je op een dinsdagmiddag
deed; ze horen bij het spel en nergens anders. Ze staan naast je tijden opgeslagen, je ziet
ze alleen binnen het spel waar ze bij horen, en ze reizen wel mee in je back-upbestand.

### Scramble van de dag

Eén scramble, één poging, en voor iedereen die de app vandaag opent dezelfde. Er is geen
server: de datum is het zaadje, en hetzelfde zaadje geeft op elk toestel dezelfde zetten.
Je kunt dus gewoon met een vriend je tijd vergelijken zonder accounts of internet.

Dat maakt het wel een *random-move* scramble in plaats van een random-state, en dat is een
echt verschil — sommige standen komen vaker voor dan andere. De officiële scrambler werkt
door een willekeurige stand op te lossen en zijn antwoord is niet twee keer hetzelfde te
krijgen, dus voor iets dat gedeeld moet worden is dit de eerlijke ruil.

Onder de kaart staat hoe je dagen gegaan zijn en hoeveel dagen op rij je hem gedaan hebt.
Gisteren telt nog mee: de dag is pas voorbij als hij voorbij is.

### Duel

Twee namen, om de beurt solven op hetzelfde toestel, best of vijf. Boven de ring staat wie
aan zet is en hoe het staat. Aan het eind een uitslag, en hoe het onderling tussen die twee
namen staat over alle duels heen — welke kant je de namen ook intypt.

### Verras me

Een willekeurige puzzel met een willekeurige opdracht erbij: met één hand, zonder naar de
tijd te kijken, drie keer achter elkaar. Voor als je niet weet wat je wil oefenen en gewoon
zin hebt om te draaien.

### Uitdagingen

Het knopje met het zonnetje in de balk. Een sessie zonder einde is de juiste
standaardinstelling en een matig spel; deze geven een reeks een vorm. Ze houden hun eigen tijden bij, los van je
sessies, dus je kunt er altijd uitstappen zonder dat je gemiddelden iets gemerkt hebben.
Onderin de spelhoek staan je vijf beste pogingen per spel.

**Marathon.** Hoeveel achter elkaar onder jouw drempel? Er staat een rij bolletjes bij die
langer wordt. Eén erover en je begint opnieuw — maar je langste reeks blijft staan.

**Vijf minuten.** Zoveel mogelijk solves binnen de tijd. De klok loopt door terwijl je
scrambelt, dus haasten helpt.

**Verrassing.** Je ziet niets: geen tijd, geen gemiddelde, geen lijst, tot je er zoveel
gedaan hebt als je hebt ingesteld. Daarna komt alles in één keer tevoorschijn. Geen enkele
solve verpest door de vorige.

**Wedstrijdronde.** Vijf solves, beste en slechtste eraf, en aan het eind een resultaat.
Een ronde met een begin en een einde in plaats van een lijst die maar doorloopt.

### Nog eens dezelfde

Onder de scramble staat **nog eens dezelfde**. De volgende solve is dan op precies dezelfde
scramble, zodat je de twee naast elkaar kunt leggen.

### Een scramble die je al eens gehad hebt

Zo nu en dan is de scramble geen nieuwe maar een van jezelf, van minstens drie weken
geleden. Er staat dan een grijs regeltje onder: *"deze had je in mei ook"* — meer niet,
want als je van tevoren weet wat je toen deed, solve je anders. Pas achteraf krijg je te
horen hoe het ging tegen toen.

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
src/diagram.js    het plaatje van een OLL of PLL, uit het net van de puzzel zelf
src/cases.js      de gevallen om te trainen, en de controle die een fout geval weigert
src/recall.js     wanneer een geval op het punt staat weg te zakken
src/course.js     de cursus: acht stappen en de weg ertussen
src/slot.js       de drie rollen van het rad
src/insight.js    de vragen die een lijst tijden zelf niet beantwoordt
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
