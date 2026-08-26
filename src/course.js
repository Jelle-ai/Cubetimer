// Leren oplossen, van "ik heb een kubus gekregen" tot "ik zit onder de twintig".
//
// Not a wall of algorithms. Every step says what you are actually trying to do
// and why the moves do it, because the thing that makes people give up on the
// cube is being handed twenty letters to memorise with no idea what they are
// for. Algorithms come last in each step, after you know what you are looking
// at -- and where the app already has the case in its own book, the step points
// at it rather than reprinting it.
//
// The algorithms here are the ones the case database already verifies on a real
// cube, or the standard beginner moves, which are checked by the same machinery
// the moment they are drilled.

/**
 * Where each stop sits on the map. A serpentine, drawn in a 120 by 620 box:
 * the numbers are the stations and the path is stitched between them, so
 * moving a stop moves the road with it and the two cannot drift apart.
 */
export const MAP = { width: 120, height: 640 };

export const STEPS = [
  {
    id: 'taal',
    name: 'De taal',
    subtitle: 'Notatie, en wat een kubus eigenlijk is',
    at: [26, 40],
    minutes: 15,
    why: 'Zonder dit is elke uitleg hierna een rij willekeurige letters.',
    what: [
      'Een kubus heeft zes kanten en drie soorten stukken. Zes **centra** — die zitten vast aan elkaar en draaien nooit weg: het witte centrum blijft altijd tegenover het gele. Twaalf **randen**, met twee kleuren. Acht **hoeken**, met drie kleuren.',
      'Dat is de belangrijkste zin van de hele cursus: **de centra bepalen welke kleur een kant is.** Je zoekt dus nooit "waar moet wit heen", je zoekt "waar zit het witte centrum".',
      'Een draai wordt geschreven met één letter, en die letter is de kant die je draait terwijl je met je neus naar de kubus kijkt: **R** rechts, **L** links, **U** boven, **D** onder, **F** voor, **B** achter.',
      'Een kale letter is een kwartslag met de klok mee, alsof je recht naar die kant kijkt. Een **apostrof** (R’) is tegen de klok in. Een **2** (R2) is een halve slag, en die heeft geen richting.',
      'Kleine letters en **r, u, f** zijn twee lagen tegelijk, en **M** is de plak tussen L en R. Die kom je pas later tegen, bij OLL.'
    ],
    moves: [
      { label: 'De sexy move', alg: "R U R' U'", why: 'Doe deze zes keer achter elkaar op een opgeloste kubus. Hij komt precies terug waar hij begon. Dat is geen truc: elke reeks komt ooit terug, en deze na zes. Voel hoe je vingers het overnemen.' },
      { label: 'De sledgehammer', alg: "R' F R F'", why: 'De tweede beweging die je in je vingers wil hebben. Samen met de sexy move zit hier de helft van alles wat later komt in.' }
    ],
    tips: [
      'Leg de kubus neer met wit onder en groen naar je toe. Doe R. Kijk welke stukken bewogen zijn. Doe R’. Alles staat terug.',
      'Draai nooit de hele kubus in je hand tijdens het oefenen van notatie. Later mag dat wel, nu verwart het je.'
    ],
    check: 'Je kunt R U R’ U’ zes keer doen zonder na te denken, en de kubus is weer opgelost.'
  },
  {
    id: 'kruis',
    name: 'Het kruis',
    subtitle: 'De eerste vier randen, op één kant',
    at: [94, 130],
    minutes: 60,
    why: 'Dit is de enige stap zonder algoritmes, en de enige stap waar je echt zelf moet nadenken. Daarom is het ook de stap waar de meeste tijd te winnen valt.',
    what: [
      'Kies een kleur om op te solven. Wit is gewoonte; deze app werkt op elke kleur en je stelt hem in bij de instellingen. Houd die kleur **onderaan**, niet bovenaan — je moet er onderdoor kunnen kijken, en anders moet je de hele kubus omdraaien voor de volgende stap.',
      'Het doel: de vier randen met jouw kleur staan rond het onderste centrum, **en** hun tweede kleur klopt met het centrum van de zijkant. Een kruis waarbij de zijkleuren niet kloppen is geen kruis, dat is vier stukken die toevallig onder liggen.',
      'De methode is er geen. Je zoekt een rand, je brengt hem naar de bovenkant, je draait de bovenkant tot hij recht boven zijn plek staat, en je draait die zijkant twee keer (bijvoorbeeld **F2**). Klaar, één op vier.',
      'Zit de rand al onderaan maar verkeerd? Draai hem eerst met **F2** naar boven en doe het opnieuw. Zit hij in de middelste laag? Eén draai brengt hem naar boven.',
      'Zit de rand goed boven zijn plek maar staat hij omgekeerd (de verkeerde kleur naar beneden)? Dan is F2 fout. Gebruik **U R U’** vanuit de goede stand, of draai hem eerst een plek verder.'
    ],
    moves: [
      { label: 'Rand van boven naar onder', alg: 'F2', why: 'Als de rand recht boven zijn plek staat en de goede kleur naar boven wijst.' },
      { label: 'Rand die omgekeerd staat', alg: "U R U'", why: 'Brengt hem via de zijkant naar beneden zonder hem om te draaien.' },
      { label: 'Rand uit de middelste laag', alg: "R U R'", why: 'Naar boven, en dan het gewone verhaal.' }
    ],
    drill: { mode: 'cross' },
    tips: [
      'Doe het kruis **onderaan** vanaf dag één. Bovenaan leren en later omdraaien kost je maanden.',
      'Zet de app op "Alleen het kruis". Hij rekent na elke poging uit in hoeveel zetten het gekund had. Acht zetten is normaal in het begin, en de rekenmachine haalt er meestal zes of zeven.',
      'De volgende stap: het hele kruis **bedenken** tijdens de vijftien seconden inspectie, en dan blind uitvoeren. Dat is de eerste echte snelheidssprong die je maakt.'
    ],
    check: 'Vier randen onder, alle zijkleuren kloppen, en je hebt geen algoritme gebruikt.'
  },
  {
    id: 'f2l-begin',
    name: 'F2L, de makkelijke manier',
    subtitle: 'Eerst de hoek, dan de rand',
    at: [26, 220],
    minutes: 120,
    why: 'De eerste twee lagen in twee halve stappen. Trager dan echte F2L, maar je hebt er precies één beweging voor nodig en je snapt hem meteen.',
    what: [
      'De eerste twee lagen bestaan uit vier **sleuven**: vier hoeken van je kruiskleur, elk met de rand die ernaast hoort. Je vult ze één voor één. Houd het kruis onder en werk in de sleuf rechtsvoor — dan is het altijd dezelfde beweging.',
      '**De hoek.** Zoek de hoek met jouw kruiskleur die in de sleuf rechtsvoor hoort. Draai hem met U naar rechtsboven, recht boven zijn sleuf. Doe nu de sexy move **R U R’ U’** en kijk. Nog niet goed? Doe hem opnieuw. Na hoogstens vijf keer valt de hoek erin. Dat is geen toeval en geen truc: de sexy move haalt de hoek eruit, draait hem een klein beetje, en zet hem terug.',
      '**De rand.** Zoek de rand die naast die hoek hoort. Breng hem naar boven. Draai de bovenlaag tot de rand **weg van** zijn sleuf wijst, en doe dan **U R U’ R’** (of de spiegel **U’ F’ U F**) om hem erin te duwen.',
      'Vier keer hetzelfde, met de kubus telkens een kwartslag gedraaid, en je eerste twee lagen staan. Dit is traag — je doet vaak twintig zetten voor iets wat in zeven kan — maar je hoeft niets te onthouden.'
    ],
    moves: [
      { label: 'De hoek erin (herhalen tot hij valt)', alg: "R U R' U'", why: 'De sexy move. Werkt vanuit elke stand van die hoek, je moet hem alleen vaak genoeg doen.' },
      { label: 'De rand erin', alg: "U R U' R'", why: 'Als de rand van zijn sleuf weg wijst.' },
      { label: 'De rand erin, andere kant', alg: "U' F' U F", why: 'De spiegel, voor als de rand aan de andere kant staat.' }
    ],
    tips: [
      'Zit een hoek al beneden maar verkeerd? Doe de sexy move één keer: hij komt naar boven en je begint opnieuw.',
      'Blijf niet te lang hangen bij deze manier. Zodra je hem kunt, ga naar de volgende stap — daar zit de echte tijdwinst.'
    ],
    check: 'Twee lagen staan, en de derde laag is een puinhoop. Dat hoort.'
  },
  {
    id: 'f2l-echt',
    name: 'Echte F2L',
    subtitle: 'Hoek en rand als paar, 41 gevallen',
    at: [94, 310],
    minutes: 600,
    why: 'Van dertig zetten naar acht. Dit is de grootste tijdwinst van de hele methode, en het enige stuk dat je niet uit je hoofd hoeft te leren.',
    what: [
      'Het idee: je zet de hoek en de rand **eerst boven aan elkaar** als een paar, en duwt dat paar dan in één beweging in de sleuf. Wat er dus eigenlijk maar drie zijn:',
      '**1. Het paar staat samen boven.** Duw het erin: **R U R’** of **F’ U’ F**, afhankelijk van welke kant het paar op kijkt.',
      '**2. Het paar staat niet samen.** Breng ze bij elkaar met één U-draai en hoogstens één uithaal, en dan geval 1.',
      '**3. Er zit al iets in de sleuf** — verkeerd gedraaid, of het verkeerde stuk. Haal het eruit met **R U R’** of **R U’ R’**, en je bent bij geval 1 of 2.',
      'Dat is de gouden regel van F2L: **alles wat je doet, moet je kunnen terugdraaien.** Je trekt het paar uit de sleuf, zet het boven goed, en duwt het terug. Er zijn 41 gevallen, maar dat zijn 41 **uitkomsten** van dat ene idee, geen 41 dingen om te memoriseren.',
      'Leer ze in het gevallenboek van deze app. Bij elk geval staan meerdere manieren en je zet een ster bij die van jou; het trainen zet het geval dan precies zo klaar als jouw manier het verwacht.'
    ],
    drill: { group: 'f2l' },
    tips: [
      'Leer eerst de zes gevallen waar het paar al boven samen staat. Dat is een derde van alles wat je in een solve tegenkomt.',
      'Rotaties zijn de vijand. Als je de kubus moet ronddraaien om bij een sleuf te komen, ben je een halve seconde kwijt. Leer de linkerhandvarianten.',
      'Kijk tijdens het uitvoeren van het ene paar al naar het volgende. Dat heet look-ahead en het is het enige dat je van 25 naar 18 seconden brengt.'
    ],
    check: 'Je vult een sleuf zonder na te denken over welk algoritme het is — je ziet gewoon waar de twee stukken heen moeten.'
  },
  {
    id: 'oll2',
    name: 'OLL in twee kijkbeurten',
    subtitle: 'Eerst het kruis, dan de hoeken — 10 gevallen',
    at: [26, 400],
    minutes: 180,
    why: 'De hele bovenkant in één kleur, met tien algoritmes in plaats van zevenenvijftig.',
    what: [
      'De laatste laag doe je in twee stappen: eerst alles de goede kant **op** (OLL), dan alles op de goede **plaats** (PLL). En OLL zelf splits je nog eens in twee.',
      '**Kijkbeurt 1: het kruis.** Kijk alleen naar de randen bovenaan. Er zijn precies drie mogelijkheden: een **punt** (geen enkele rand goed), een **streep** (twee tegenover elkaar) of een **haakje** (twee naast elkaar).',
      'Alle drie worden opgelost met dezelfde beweging, alleen vaker: **F R U R’ U’ F’**. Bij een streep één keer. Bij een haakje de variant met twee lagen: **f R U R’ U’ f’**. Bij een punt eerst de ene, dan de andere.',
      'Let op de stand: een streep leg je **horizontaal** voor je, een haakje leg je met de twee goede randen **linksboven**.',
      '**Kijkbeurt 2: de hoeken.** Nu zijn de randen goed en kijk je alleen naar de vier hoeken. Zeven gevallen, en ze hebben namen: Sune, Antisune, Pi, Koplampen, Dubbele Sune, Strik en T-hoeken.',
      'De belangrijkste is de **Sune**: **R U R’ U R U2 R’**. Leer die eerst, want vier van de zeven anderen zijn niets anders dan een Sune met een aanloopje.'
    ],
    drill: { group: 'eo', then: 'ocll' },
    moves: [
      { label: 'Streep', alg: "F R U R' U' F'", why: 'Horizontaal voor je leggen.' },
      { label: 'Haakje', alg: "f R U R' U' f'", why: 'De twee goede randen linksboven.' },
      { label: 'Punt', alg: "F R U R' U' F' f R U R' U' f'", why: 'De twee andere achter elkaar.' },
      { label: 'Sune', alg: "R U R' U R U2 R'", why: 'Eén hoek goed, linksboven houden.' },
      { label: 'Antisune', alg: "R U2 R' U' R U' R'", why: 'De spiegel van de Sune.' }
    ],
    tips: [
      'Herken het kruis vóór je de kubus optilt. Dat zijn drie mogelijkheden — dat kan je in een halve seconde.',
      'De zeven hoekgevallen zitten in deze app als eigen groep ("Hoeken draaien"). Maak er een reeks van en train ze tot je ze niet meer hoeft te tellen.'
    ],
    check: 'De hele bovenkant is één kleur, en je hebt hoogstens twee algoritmes nodig gehad.'
  },
  {
    id: 'pll2',
    name: 'PLL in twee kijkbeurten',
    subtitle: 'Eerst de hoeken, dan de randen — 6 gevallen',
    at: [94, 490],
    minutes: 180,
    why: 'De laatste stap. Hierna is de kubus opgelost, en je hebt er zes algoritmes voor nodig.',
    what: [
      '**Kijkbeurt 1: de hoeken op hun plaats.** Kijk naar de zijkanten van de bovenste laag en zoek **koplampen**: twee hoeken op dezelfde zijkant met dezelfde kleur. Zitten er twee hoeken naast elkaar goed, dan houd je die kant **achter** en doe je de A-perm. Zijn er geen koplampen, dan zitten ze diagonaal en doe je de A-perm één keer, kijk je opnieuw, en doe je hem nog eens.',
      'De A-perm: **R’ F R’ B2 R F’ R’ B2 R2**. Hij verwisselt drie hoeken en laat de randen met rust.',
      '**Kijkbeurt 2: de randen.** Nu staan de hoeken goed en kijk je alleen naar de vier randen. Vier gevallen: **Ua** en **Ub** (drie randen draaien rond), **H** (twee paren wisselen tegenover elkaar) en **Z** (twee paren wisselen naast elkaar).',
      'Alle vier gaan met de M-plak, de laag tussen L en R. **M2 U M U2 M’ U M2** is de Ua, en de andere drie zijn variaties daarop.',
      'En dan nog de laatste draai: soms staat alles goed maar is de hele bovenlaag een kwartslag verdraaid. Eén U en klaar. Dat heet de AUF en die vergeten mensen constant.'
    ],
    drill: { group: 'pll', only: ['Aa', 'Ab', 'Ua', 'Ub', 'H', 'Z'] },
    moves: [
      { label: 'A-perm (hoeken)', alg: "R' F R' B2 R F' R' B2 R2", why: 'Koplampen achter houden.' },
      { label: 'Ua (randen)', alg: "M2 U M U2 M' U M2", why: 'De rand die al goed staat achter houden.' },
      { label: 'Ub (randen)', alg: "M2 U' M U2 M' U' M2", why: 'De andere draairichting.' },
      { label: 'H (randen)', alg: "M2 U M2 U2 M2 U M2", why: 'Alle vier de randen wisselen paarsgewijs.' },
      { label: 'Z (randen)', alg: "M' U M2 U M2 U M' U2 M2 U'", why: 'Twee paren naast elkaar.' }
    ],
    tips: [
      'Koplampen zoeken is de hele kunst van PLL herkennen. Train het in "Herkennen" — zonder kubus, alleen kijken.',
      'De M-plak draai je met je linker wijsvinger, niet met je hele hand. Dat scheelt een halve seconde per PLL.'
    ],
    check: 'De kubus is opgelost. Gefeliciteerd — je bent een cuber.'
  },
  {
    id: 'vlot',
    name: 'Vlot worden',
    subtitle: 'Van "ik kan het" naar onder de dertig',
    at: [26, 580],
    minutes: 1200,
    why: 'Je kent de methode nu. Alles wat je hierna wint, win je met kijken en niet met leren.',
    what: [
      'De volgorde waarin je nu tijd wint, van meeste naar minste:',
      '**1. Look-ahead.** Terwijl je handen het ene paar doen, kijken je ogen al naar het volgende. Dat voelt in het begin alsof je twee dingen tegelijk moet — dat klopt, en het went. Oefen het door **expres langzaam te draaien**: zo traag dat je tijd hebt om te kijken. Je tijden gaan er eerst op achteruit en daarna hard vooruit.',
      '**2. Geen pauzes.** Meet je splits in deze app (aanzetten bij de instellingen, dan tik je tijdens je solve tussen de fases). De pauze tussen F2L en OLL is bij bijna iedereen de grootste, en die pauze is herkennen, niet draaien.',
      '**3. De inspectie gebruiken.** Vijftien seconden is lang. Bedenk het hele kruis, en als dat lukt, kijk waar het eerste paar staat. De app kan je na afloop laten zien in hoeveel zetten je kruis had gekund.',
      '**4. Minder rotaties.** Elke keer dat je de kubus omdraait in je handen ben je een halve seconde kwijt en zie je even niets. Leer de linkerhandvarianten van je F2L-gevallen.',
      '**5. Vingertrucs.** Draai R met je rechter wijsvinger, U met je rechter wijsvinger van bovenaf, niet met je pols. Zet de metronoom in deze app aan op een tempo dat je nét kunt volgen en probeer gelijkmatig te blijven.'
    ],
    tips: [
      'Doel per fase, als je onder de 30 wilt: kruis onder 4 seconden, F2L onder 16, OLL onder 4, PLL onder 4.',
      'Doe elke dag een handvol solves in plaats van één keer per week honderd. De app houdt je reeks bij.',
      'Kijk in "Records en terugblik" naar je zwakste fase. Die vertelt je waar je moet oefenen, en het is bijna nooit wat je dacht.'
    ],
    check: 'Je gemiddelde staat onder de dertig seconden en je hebt geen enkel algoritme extra geleerd.'
  },
  {
    id: 'vol',
    name: 'Volledig OLL en PLL',
    subtitle: '57 plus 21, en de weg erheen',
    at: [94, 620],
    minutes: 3000,
    why: 'Twee kijkbeurten worden er één. Dit is werk van maanden en het is de laatste grote stap van CFOP.',
    what: [
      '**Doe PLL eerst.** Eenentwintig gevallen tegenover zevenenvijftig, en je gebruikt ze vaker: elke solve heeft precies één PLL. Volledig PLL haalt er meteen twee tot drie seconden af.',
      'Een verstandige volgorde: je hebt Ua, Ub, H, Z en de A-perms al. Leer dan **T**, **Jb**, **Ja**, **Y**, **F**, **Ra**, **Rb** — dat zijn de veelvoorkomende en de mooiste om te draaien. Daarna de vier **G-perms**, die iedereen haat en die je gewoon moet doorbijten. Als laatste **V**, **Na**, **Nb** en **E**.',
      '**Dan OLL.** Zevenenvijftig gevallen, maar ze zitten in families: de vier "dot"-gevallen, de vier vormen met een kruis (die ken je al), de T-, C-, P- en W-vormen, de L-vormen, de vier "square" gevallen. Leer per familie, niet op nummer.',
      'Twee tot drie nieuwe per week is een tempo dat blijft plakken. Tien per week is een tempo waarbij je er over een maand nul kent.',
      'Gebruik het **gevallenboek** van deze app: elk geval, elke manier, een ster bij die van jou en een notitie erbij als een geval een addertje heeft. Stel dan een **reeks** samen van precies de gevallen die je aan het leren bent, en zet het trainen op **opfrissen** — dan komt een geval terug net voor je het kwijtraakt in plaats van willekeurig.'
    ],
    drill: { group: 'pll' },
    tips: [
      'Een nieuw geval leer je in vier stappen: lezen, twintig keer traag draaien met de tekst erbij, twintig keer zonder tekst, en dan pas in een echte solve.',
      'Herkennen is de helft. Train het apart in "Herkennen" — dat gaat zonder kubus en kan overal.',
      'Als een geval na een week nog steeds haperen is: zoek een andere manier in het boek en zet de ster daar. Niet elk algoritme past bij elke hand.'
    ],
    check: 'Eén blik, één algoritme, geen tellen meer.'
  }
];

/** The road, stitched through the stations so the two can never disagree. */
export function roadPath(steps = STEPS) {
  if (!steps.length) return '';
  const points = steps.map((step) => step.at);
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let at = 1; at < points.length; at++) {
    const [x, y] = points[at];
    const [px, py] = points[at - 1];
    const mid = (py + y) / 2;
    // A soft S between one stop and the next, so the road bends instead of
    // zig-zagging with corners in it.
    d += ` C ${px} ${mid}, ${x} ${mid}, ${x} ${y}`;
  }
  return d;
}

export const stepAt = (id) => STEPS.findIndex((step) => step.id === id);

/** How far along the road you are, as a fraction. */
export function howFar(done) {
  const had = STEPS.filter((step) => done.includes(step.id)).length;
  return { had, all: STEPS.length, part: STEPS.length ? had / STEPS.length : 0 };
}

/** The step you are on: the first one you have not ticked off. */
export const nextStep = (done) => STEPS.find((step) => !done.includes(step.id)) || null;

/** Roughly how long the whole thing takes, for the person deciding to start. */
export const hoursLeft = (done) =>
  Math.round(STEPS.filter((step) => !done.includes(step.id)).reduce((sum, step) => sum + step.minutes, 0) / 60);
