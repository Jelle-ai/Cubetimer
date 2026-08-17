# vendor/

Third-party code, copied in unchanged.

## cubing/

Het scramble-deel van [cubing.js](https://github.com/cubing/cubing.js) 0.63.3, de
bibliotheek achter de officiële WCA-scramblers. Gebruikt voor random-state scrambles.

Licentie: **MPL-2.0** (of GPL-3.0-or-later, naar keuze van de gebruiker). De MPL is een
licentie op bestandsniveau: zolang deze bestanden onveranderd blijven, raakt hij de rest
van deze repo niet. Zie `cubing/LICENSE-MPL.md`.

Bijwerken: `npm pack cubing`, uitpakken, en `dist/lib/cubing/scramble` plus
`dist/lib/cubing/chunks` hierheen kopiëren (zonder `.map`-bestanden).

### Wijzigingen aan cubing.js

Eén aanpassing, nodig omdat deze app geen bundler gebruikt: de bare imports
`"cubing/alg"`, `"cubing/puzzles"` en `"random-uint-below"` zijn vervangen door relatieve
paden. Import maps waren geen optie omdat ze niet gelden binnen module workers, en de
scrambler draait zijn solver juist in een worker. Verder is de code onveranderd, en zijn
alleen de bestanden bewaard die vanuit `scramble/index.js` bereikbaar zijn.

## random-uint-below/

Afhankelijkheid van cubing.js. Licentie: **Unlicense** (publiek domein).
